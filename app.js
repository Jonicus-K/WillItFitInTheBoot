let carsData = [];

// DOM References
const carSelect = document.getElementById("car-select");
const inputL = document.getElementById("item-length");
const inputW = document.getElementById("item-width");
const inputH = document.getElementById("item-height");
const seatsDownCheck = document.getElementById("seats-down");
const statusBadge = document.getElementById("status-badge");
const statusMessage = document.getElementById("status-message");
const carSpecs = document.getElementById("car-specs");
const specsList = document.getElementById("specs-list");
const presetButtons = document.querySelectorAll(".btn-preset");
const visualizerCard = document.getElementById("visualizer-card");
const profileSvg = document.getElementById("profile-svg");
const visualizerLegend = document.getElementById("visualizer-legend");

// 1. Initialise & Fetch JSON Data
async function init() {
  try {
    const res = await fetch("data/cars.json");
    if (!res.ok) throw new Error("Could not fetch car database");
    carsData = await res.json();
    populateCarSelect();
    calculateFit();
  } catch (err) {
    statusBadge.className = "badge badge-danger";
    statusBadge.textContent = "Data Load Error";
    statusMessage.textContent = "Failed to load cars.json. Verify the file path in your repository.";
  }
}

function populateCarSelect() {
  carSelect.innerHTML = "";
  carsData.forEach(car => {
    const opt = document.createElement("option");
    opt.value = car.id;
    opt.textContent = `${car.make} ${car.model}`;
    carSelect.appendChild(opt);
  });
}

// 2. Generate all unique 6 orientation permutations for a 3D box
function getOrientations(l, w, h) {
  const perms = [
    [l, w, h], [l, h, w],
    [w, l, h], [w, h, l],
    [h, l, w], [h, w, l]
  ];
  const unique = [];
  const seen = new Set();
  for (const p of perms) {
    const key = p.join("x");
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ length: p[0], width: p[1], height: p[2] });
    }
  }
  return unique;
}

// 3. Render 2D SVG Profile View
function renderSideProfile(boot, itemL, itemH, fits) {
  visualizerCard.style.display = "block";
  profileSvg.innerHTML = "";

  const svgWidth = 540;
  const svgHeight = 220;
  const padLeft = 60;
  const padBottom = 35;
  const padTop = 30;

  const maxL = Math.max(boot.floor_length_cm, itemL) + 25;
  const maxH = Math.max(boot.max_height_cm, itemH) + 20;

  const scaleX = (svgWidth - padLeft - 40) / maxL;
  const scaleY = (svgHeight - padBottom - padTop) / maxH;
  const scale = Math.min(scaleX, scaleY);

  const floorY = svgHeight - padBottom;
  const seatX = padLeft;

  const floorLenPx = boot.floor_length_cm * scale;
  const bootHeightPx = boot.max_height_cm * scale;
  const roofY = floorY - bootHeightPx;

  const rad = (boot.rake_angle_deg * Math.PI) / 180;
  const lengthLossAtRoof = boot.max_height_cm * Math.tan(rad);
  const roofLenPx = Math.max(0, (boot.floor_length_cm - lengthLossAtRoof) * scale);

  const ptSeatBottom = `${seatX},${floorY}`;
  const ptSill = `${seatX + floorLenPx},${floorY}`;
  const ptHatchTop = `${seatX + roofLenPx},${roofY}`;
  const ptSeatTop = `${seatX},${roofY}`;

  const boxWidthPx = itemL * scale;
  const boxHeightPx = itemH * scale;
  const boxY = floorY - boxHeightPx;

  const hitsRoof = itemH > boot.max_height_cm;
  const hitsFloor = itemL > boot.floor_length_cm;
  const maxAllowedLengthAtBoxHeight = boot.floor_length_cm - (itemH * Math.tan(rad));
  const hitsRake = itemL > maxAllowedLengthAtBoxHeight;
  const hasClipping = hitsRoof || hitsFloor || hitsRake;

  const svgElements = `
    <!-- Cargo Interior Outline -->
    <polygon 
      points="${ptSeatBottom} ${ptSill} ${ptHatchTop} ${ptSeatTop}" 
      class="svg-boot-envelope"
    />

    <!-- Front Partition (Seats) -->
    <line 
      x1="${seatX}" y1="${floorY + 10}" 
      x2="${seatX}" y2="${roofY - 10}" 
      class="svg-seat-divider" 
    />
    <text x="${seatX - 10}" y="${floorY - 10}" class="svg-dim-text" text-anchor="end">Seats</text>

    <!-- Floor Line -->
    <line 
      x1="${seatX}" y1="${floorY}" 
      x2="${seatX + floorLenPx}" y2="${floorY}" 
      stroke="#94a3b8" stroke-width="2" 
    />

    <!-- Cargo Box -->
    <rect 
      x="${seatX}" 
      y="${boxY}" 
      width="${boxWidthPx}" 
      height="${boxHeightPx}" 
      rx="3"
      class="${hasClipping ? "svg-box-clip" : "svg-box-fit"}" 
    />

    <!-- Windscreen Clip Point Marker -->
    ${hitsRake && !hitsRoof && !hitsFloor ? `
      <circle cx="${seatX + boxWidthPx}" cy="${boxY}" r="4" fill="#ef4444" />
      <text x="${seatX + boxWidthPx + 8}" y="${boxY - 4}" fill="#ef4444" class="svg-label-text">
        Window collision
      </text>
    ` : ""}

    <!-- Floor Measurement -->
    <text x="${seatX + floorLenPx / 2}" y="${floorY + 20}" class="svg-dim-text">
      Floor: ${boot.floor_length_cm} cm
    </text>

    <!-- Box Measurement -->
    <text x="${seatX + boxWidthPx / 2}" y="${boxY + boxHeightPx / 2 + 4}" class="svg-label-text" fill="${hasClipping ? "#ef4444" : "#22c55e"}" text-anchor="middle">
      ${Math.round(itemL)} × ${Math.round(itemH)} cm
    </text>
  `;

  profileSvg.innerHTML = svgElements;

  if (hasClipping) {
    visualizerLegend.innerHTML = `<span style="color: #ef4444; font-weight: 600; font-size: 0.8rem;">● Boundary Collision</span>`;
  } else {
    visualizerLegend.innerHTML = `<span style="color: #22c55e; font-weight: 600; font-size: 0.8rem;">● Fits Within Envelope</span>`;
  }
}

// 4. Fit Calculation Core
function calculateFit() {
  const selectedCar = carsData.find(c => c.id === carSelect.value);
  if (!selectedCar) return;

  const itemL = parseFloat(inputL.value) || 0;
  const itemW = parseFloat(inputW.value) || 0;
  const itemH = parseFloat(inputH.value) || 0;

  if (itemL <= 0 || itemW <= 0 || itemH <= 0) {
    statusBadge.className = "badge badge-neutral";
    statusBadge.textContent = "Enter Dimensions";
    statusMessage.textContent = "Please provide valid dimensions for length, width, and height.";
    carSpecs.style.display = "none";
    visualizerCard.style.display = "none";
    return;
  }

  const seatsMode = seatsDownCheck.checked ? "seats_down" : "seats_up";
  const boot = selectedCar.boot[seatsMode];
  const aperture = selectedCar.boot.aperture;

  carSpecs.style.display = "block";
  specsList.innerHTML = `
    <li>Floor length: ${boot.floor_length_cm} cm (${seatsDownCheck.checked ? "seats folded" : "seats upright"})</li>
    <li>Width between wheel arches: ${boot.min_width_cm} cm</li>
    <li>Roof height: ${boot.max_height_cm} cm</li>
    <li>Tailgate opening: ${aperture.width_cm} cm wide × ${aperture.height_cm} cm high</li>
  `;

  const orientations = getOrientations(itemL, itemW, itemH);
  let bestFit = null;
  let failureReasons = [];

  for (const ori of orientations) {
    const { length: oL, width: oW, height: oH } = ori;

    // Gate 1: Aperture entry check
    const canEnterAperture = 
      (oW <= aperture.width_cm && oH <= aperture.height_cm) ||
      (oH <= aperture.width_cm && oW <= aperture.height_cm);

    if (!canEnterAperture) {
      failureReasons.push(`Too large to clear the ${aperture.width_cm}×${aperture.height_cm} cm tailgate opening.`);
      continue;
    }

    // Gate 2: Wheel arch width
    if (oW > boot.min_width_cm) {
      failureReasons.push(`Width (${oW} cm) exceeds wheel arch clearance (${boot.min_width_cm} cm).`);
      continue;
    }

    // Gate 3: Ceiling height
    if (oH > boot.max_height_cm) {
      failureReasons.push(`Height (${oH} cm) exceeds boot roof height (${boot.max_height_cm} cm).`);
      continue;
    }

    // Gate 4: Tailgate rake angle clearance
    const rad = (boot.rake_angle_deg * Math.PI) / 180;
    const lengthLossAtHeight = oH * Math.tan(rad);
    const usableLengthAtHeight = boot.floor_length_cm - lengthLossAtHeight;

    if (oL > usableLengthAtHeight) {
      if (oL <= boot.floor_length_cm) {
        failureReasons.push(`Hits the rear window glass at that height (usable length at ${oH} cm height is ${Math.floor(usableLengthAtHeight)} cm).`);
      } else {
        failureReasons.push(`Length (${oL} cm) exceeds boot floor length (${boot.floor_length_cm} cm).`);
      }
      continue;
    }

    const marginL = usableLengthAtHeight - oL;
    const marginW = boot.min_width_cm - oW;
    const marginH = boot.max_height_cm - oH;
    const minMargin = Math.min(marginL, marginW, marginH);

    bestFit = {
      orientation: ori,
      minMargin: minMargin
    };
    break;
  }

  if (bestFit) {
    const { length, width, height } = bestFit.orientation;
    if (bestFit.minMargin >= 4) {
      statusBadge.className = "badge badge-success";
      statusBadge.textContent = "Fits Comfortably";
      statusMessage.textContent = `Will fit when loaded as: ${length} cm (length) × ${width} cm (width) × ${height} cm (height). You have ~${Math.round(bestFit.minMargin)} cm clearance on your tightest edge.`;
    } else {
      statusBadge.className = "badge badge-warning";
      statusBadge.textContent = "Tight Fit";
      statusMessage.textContent = `It will fit, but it is extremely close (under ${Math.max(1, Math.round(bestFit.minMargin))} cm clearance).`;
    }
    renderSideProfile(boot, length, height, true);
  } else {
    statusBadge.className = "badge badge-danger";
    statusBadge.textContent = "Will Not Fit";
    statusMessage.textContent = failureReasons[0] || "Dimensions exceed the vehicle's cargo space.";
    renderSideProfile(boot, itemL, itemH, false);
  }
}

// 5. Event Listeners
[inputL, inputW, inputH, carSelect, seatsDownCheck].forEach(el => {
  el.addEventListener("input", calculateFit);
  el.addEventListener("change", calculateFit);
});

presetButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    inputL.value = btn.dataset.l;
    inputW.value = btn.dataset.w;
    inputH.value = btn.dataset.h;
    calculateFit();
  });
});

init();