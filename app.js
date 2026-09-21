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
const rearSvg = document.getElementById("rear-svg");
const sideTag = document.getElementById("side-tag");
const rearTag = document.getElementById("rear-tag");

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
    statusMessage.textContent = "Failed to load cars.json. Check file path.";
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

// 3. Render Automotive Visualizers
function renderVisualizers(boot, aperture, oL, oW, oH) {
  visualizerCard.style.display = "block";

  // ==========================================
  // VIEW 1: SIDE CAR PROFILE (Length × Height)
  // ==========================================
  profileSvg.innerHTML = "";
  const sW = 460;
  const sH = 220;
  const groundY = 195;
  const floorY = 168; // Boot floor sits above rear axle/bumper
  const seatFrontX = 135;

  // Dynamically scale according to car and item dimensions
  const maxL = Math.max(boot.floor_length_cm, oL, 160);
  const maxH = Math.max(boot.max_height_cm, oH, 75);
  const scaleX = 240 / maxL;
  const scaleY = 100 / maxH;
  const sScale = Math.min(scaleX, scaleY);

  const floorLenPx = boot.floor_length_cm * sScale;
  const bootHeightPx = boot.max_height_cm * sScale;
  const roofY = floorY - bootHeightPx;

  const rad = (boot.rake_angle_deg * Math.PI) / 180;
  const roofLossPx = bootHeightPx * Math.tan(rad);
  const roofLenPx = Math.max(10, floorLenPx - roofLossPx);

  const sillX = seatFrontX + floorLenPx;
  const hatchTopX = seatFrontX + roofLenPx;

  // Collision checks for side profile
  const maxAllowedLenAtBoxH = boot.floor_length_cm - (oH * Math.tan(rad));
  const sideClip = oL > maxAllowedLenAtBoxH || oL > boot.floor_length_cm || oH > boot.max_height_cm;

  const boxW_side = oL * sScale;
  const boxH_side = oH * sScale;
  const boxY_side = floorY - boxH_side;

  // SVG Elements for Side Car
  profileSvg.innerHTML = `
    <!-- Ground line -->
    <line x1="10" y1="${groundY}" x2="450" y2="${groundY}" class="svg-ground-line" />

    <!-- Car Body Silhouette (Side View) -->
    <!-- Front cabin silhouette flowing into roof spoiler, hatch, bumper & floor -->
    <path d="
      M 20 ${floorY + 5}
      C 30 ${floorY - 20}, 45 ${floorY - 45}, 70 ${roofY + 5}
      L 95 ${roofY}
      L ${hatchTopX + 12} ${roofY}
      C ${hatchTopX + 16} ${roofY}, ${sillX + 12} ${floorY - 15}, ${sillX + 8} ${floorY + 2}
      L ${sillX + 14} ${floorY + 8}
      C ${sillX + 14} ${floorY + 18}, ${sillX + 5} ${groundY - 16}, ${sillX - 10} ${groundY - 16}
      L ${sillX - 25} ${groundY - 16}
      C ${sillX - 25} ${floorY + 10}, ${sillX - 65} ${floorY + 10}, ${sillX - 65} ${groundY - 16}
      L ${seatFrontX - 35} ${groundY - 16}
      L 20 ${groundY - 16}
      Z" 
      class="svg-car-outline" 
    />

    <!-- Rear Wheel & Rim -->
    <circle cx="${sillX - 45}" cy="${groundY - 14}" r="17" class="svg-car-wheel" />
    <circle cx="${sillX - 45}" cy="${groundY - 14}" r="8" class="svg-car-rim" />

    <!-- Rear Tail Light -->
    <path d="M ${sillX + 6} ${floorY - 5} Q ${sillX + 11} ${floorY + 3} ${sillX + 4} ${floorY + 7} Z" class="svg-car-light" />

    <!-- Rear Backrest / Seat Silhouette -->
    <path d="
      M ${seatFrontX} ${floorY} 
      L ${seatFrontX - 12} ${roofY + 12} 
      Q ${seatFrontX - 12} ${roofY + 4} ${seatFrontX - 5} ${roofY + 4} 
      L ${seatFrontX + 4} ${roofY + 12} 
      Z" 
      class="svg-seat" 
    />
    <!-- Headrest -->
    <ellipse cx="${seatFrontX - 4}" cy="${roofY - 2}" rx="5" ry="7" class="svg-seat" />

    <!-- Cargo Compartment Envelope -->
    <polygon 
      points="${seatFrontX},${floorY} ${sillX},${floorY} ${hatchTopX},${roofY} ${seatFrontX},${roofY}" 
      class="svg-cargo-zone" 
    />

    <!-- Cargo Box (Side Profile) -->
    <rect 
      x="${seatFrontX}" 
      y="${boxY_side}" 
      width="${boxW_side}" 
      height="${boxH_side}" 
      rx="2" 
      class="${sideClip ? 'svg-box-clip' : 'svg-box-fit'}" 
    />

    <!-- Dimension Label -->
    <text x="${seatFrontX + boxW_side / 2}" y="${boxY_side + boxH_side / 2 + 4}" class="svg-label-text" fill="${sideClip ? '#ef4444' : '#22c55e'}">
      ${Math.round(oL)} × ${Math.round(oH)} cm
    </text>

    <!-- Hatch Window Collision Callout -->
    ${sideClip && oL > maxAllowedLenAtBoxH && oL <= boot.floor_length_cm && oH <= boot.max_height_cm ? `
      <circle cx="${seatFrontX + boxW_side}" cy="${boxY_side}" r="4" fill="#ef4444" />
      <text x="${seatFrontX + boxW_side + 6}" y="${boxY_side - 3}" fill="#ef4444" font-size="9" font-weight="700">Windscreen hit</text>
    ` : ''}

    <text x="${seatFrontX + floorLenPx / 2}" y="${floorY + 16}" class="svg-dim-text">Floor: ${boot.floor_length_cm} cm</text>
  `;

  sideTag.className = sideClip ? "vis-tag vis-tag-bad" : "vis-tag vis-tag-ok";
  sideTag.textContent = sideClip ? "Colliding" : "Clears";

  // ===============================================
  // VIEW 2: REAR CROSS-SECTION (Width × Height)
  // ===============================================
  rearSvg.innerHTML = "";
  const rW = 420;
  const midX = rW / 2;
  const rGroundY = 195;
  const rFloorY = 168;

  const maxRearW = Math.max(boot.min_width_cm + 35, oW, aperture.width_cm + 10);
  const rScale = Math.min(260 / maxRearW, 100 / maxH);

  const archSpanPx = boot.min_width_cm * rScale;
  const totalBootHeightPx = boot.max_height_cm * rScale;
  const rRoofY = rFloorY - totalBootHeightPx;

  const archLeftX = midX - (archSpanPx / 2);
  const archRightX = midX + (archSpanPx / 2);
  const carOuterLeft = midX - ((boot.min_width_cm + 34) * rScale / 2);
  const carOuterRight = midX + ((boot.min_width_cm + 34) * rScale / 2);

  const boxW_rear = oW * rScale;
  const boxH_rear = oH * rScale;
  const boxX_rear = midX - (boxW_rear / 2);
  const boxY_rear = rFloorY - boxH_rear;

  // Collision checks for rear profile
  const rearClip = oW > boot.min_width_cm || oH > boot.max_height_cm || oW > aperture.width_cm || oH > aperture.height_cm;

  rearSvg.innerHTML = `
    <!-- Ground line -->
    <line x1="20" y1="${rGroundY}" x2="400" y2="${rGroundY}" class="svg-ground-line" />

    <!-- Two Rear Tires on Road -->
    <rect x="${carOuterLeft + 2}" y="${rGroundY - 26}" width="22" height="26" rx="4" class="svg-car-wheel" />
    <rect x="${carOuterRight - 24}" y="${rGroundY - 26}" width="22" height="26" rx="4" class="svg-car-wheel" />

    <!-- Car Rear Outer Body Shell -->
    <path d="
      M ${carOuterLeft + 4} ${rGroundY - 20}
      L ${carOuterLeft - 4} ${rFloorY + 6}
      Q ${carOuterLeft - 6} ${rFloorY - 20} ${carOuterLeft + 6} ${rFloorY - 30}
      L ${carOuterLeft + 18} ${rRoofY - 6}
      Q ${carOuterLeft + 25} ${rRoofY - 14} ${midX} ${rRoofY - 14}
      Q ${carOuterRight - 25} ${rRoofY - 14} ${carOuterRight - 18} ${rRoofY - 6}
      L ${carOuterRight - 6} ${rFloorY - 30}
      Q ${carOuterRight + 6} ${rFloorY - 20} ${carOuterRight + 4} ${rFloorY + 6}
      L ${carOuterRight - 4} ${rGroundY - 20}
      Z" 
      class="svg-car-outline" 
    />

    <!-- Tail Lights -->
    <path d="M ${carOuterLeft - 4} ${rFloorY - 24} Q ${carOuterLeft + 8} ${rFloorY - 26} ${carOuterLeft + 14} ${rFloorY - 16} L ${carOuterLeft + 2} ${rFloorY - 12} Z" class="svg-car-light" />
    <path d="M ${carOuterRight + 4} ${rFloorY - 24} Q ${carOuterRight - 8} ${rFloorY - 26} ${carOuterRight - 14} ${rFloorY - 16} L ${carOuterRight - 2} ${rFloorY - 12} Z" class="svg-car-light" />

    <!-- Boot Opening & Interior with Wheel Arch Wells -->
    <path d="
      M ${archLeftX - 16} ${rRoofY}
      L ${archRightX + 16} ${rRoofY}
      L ${archRightX + 16} ${rFloorY - 28}
      C ${archRightX + 16} ${rFloorY - 28}, ${archRightX} ${rFloorY - 28}, ${archRightX} ${rFloorY}
      L ${archLeftX} ${rFloorY}
      C ${archLeftX} ${rFloorY - 28}, ${archLeftX - 16} ${rFloorY - 28}, ${archLeftX - 16} ${rFloorY - 28}
      Z" 
      class="svg-cargo-zone" 
    />

    <!-- Boot Floor -->
    <line x1="${archLeftX}" y1="${rFloorY}" x2="${archRightX}" y2="${rFloorY}" stroke="#94a3b8" stroke-width="2" />

    <!-- Cargo Box (Rear Profile) -->
    <rect 
      x="${boxX_rear}" 
      y="${boxY_rear}" 
      width="${boxW_rear}" 
      height="${boxH_rear}" 
      rx="2" 
      class="${rearClip ? 'svg-box-clip' : 'svg-box-fit'}" 
    />

    <!-- Box Dimension Text -->
    <text x="${midX}" y="${boxY_rear + boxH_rear / 2 + 4}" class="svg-label-text" fill="${rearClip ? '#ef4444' : '#22c55e'}">
      ${Math.round(oW)} × ${Math.round(oH)} cm
    </text>

    <!-- Arch Width Measurement -->
    <text x="${midX}" y="${rFloorY + 16}" class="svg-dim-text">Between arches: ${boot.min_width_cm} cm</text>
  `;

  rearTag.className = rearClip ? "vis-tag vis-tag-bad" : "vis-tag vis-tag-ok";
  rearTag.textContent = rearClip ? "Colliding" : "Clears";
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

    // Gate 1: Tailgate Aperture
    const canEnterAperture = 
      (oW <= aperture.width_cm && oH <= aperture.height_cm) ||
      (oH <= aperture.width_cm && oW <= aperture.height_cm);

    if (!canEnterAperture) {
      failureReasons.push(`Too bulky to pass through the ${aperture.width_cm}×${aperture.height_cm} cm tailgate opening.`);
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

    // Gate 4: Tailgate rake angle
    const rad = (boot.rake_angle_deg * Math.PI) / 180;
    const lengthLossAtHeight = oH * Math.tan(rad);
    const usableLengthAtHeight = boot.floor_length_cm - lengthLossAtHeight;

    if (oL > usableLengthAtHeight) {
      if (oL <= boot.floor_length_cm) {
        failureReasons.push(`Hits rear window glass (available length at ${oH} cm height is ${Math.floor(usableLengthAtHeight)} cm).`);
      } else {
        failureReasons.push(`Length (${oL} cm) exceeds boot floor length (${boot.floor_length_cm} cm).`);
      }
      continue;
    }

    const minMargin = Math.min(usableLengthAtHeight - oL, boot.min_width_cm - oW, boot.max_height_cm - oH);
    bestFit = { orientation: ori, minMargin };
    break;
  }

  if (bestFit) {
    const { length, width, height } = bestFit.orientation;
    if (bestFit.minMargin >= 4) {
      statusBadge.className = "badge badge-success";
      statusBadge.textContent = "Fits Comfortably";
      statusMessage.textContent = `Will fit when loaded as: ${length} cm (L) × ${width} cm (W) × ${height} cm (H). Clearance: ~${Math.round(bestFit.minMargin)} cm.`;
    } else {
      statusBadge.className = "badge badge-warning";
      statusBadge.textContent = "Tight Fit";
      statusMessage.textContent = `It will fit, but it is extremely close (under ${Math.max(1, Math.round(bestFit.minMargin))} cm clearance).`;
    }
    renderVisualizers(boot, aperture, length, width, height);
  } else {
    statusBadge.className = "badge badge-danger";
    statusBadge.textContent = "Will Not Fit";
    statusMessage.textContent = failureReasons[0] || "Dimensions exceed internal capacity.";
    renderVisualizers(boot, aperture, itemL, itemW, itemH);
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