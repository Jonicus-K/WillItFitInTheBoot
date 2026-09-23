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

// 3. Render High-Detail Automotive Vector Visualizers
function renderVisualizers(boot, aperture, oL, oW, oH) {
  visualizerCard.style.display = "block";

  // ==========================================
  // VIEW 1: SIDE PROFILE BLUEPRINT (Length × Height)
  // ==========================================
  profileSvg.innerHTML = "";
  const floorY = 175;
  const sillX = 460; // Rear tailgate hinge/bumper anchor point

  // Auto-scale relative to cargo dimensions
  const maxCargoL = Math.max(boot.floor_length_cm, oL, 160);
  const maxCargoH = Math.max(boot.max_height_cm, oH, 75);
  const scaleX = 240 / maxCargoL;
  const scaleY = 100 / maxCargoH;
  const sScale = Math.min(scaleX, scaleY);

  const floorLenPx = boot.floor_length_cm * sScale;
  const bootHeightPx = boot.max_height_cm * sScale;
  const roofY = floorY - bootHeightPx;

  const rad = (boot.rake_angle_deg * Math.PI) / 180;
  const roofLossPx = bootHeightPx * Math.tan(rad);
  const hatchTopX = sillX - roofLossPx;
  const seatFrontX = sillX - floorLenPx;

  // Collision logic for side view
  const maxAllowedLenAtBoxH = boot.floor_length_cm - (oH * Math.tan(rad));
  const sideClip = oL > maxAllowedLenAtBoxH || oL > boot.floor_length_cm || oH > boot.max_height_cm;

  const boxW_side = oL * sScale;
  const boxH_side = oH * sScale;
  const boxY_side = floorY - boxH_side;

  profileSvg.innerHTML = `
    <!-- Blueprint background grid -->
    <line x1="20" y1="50" x2="500" y2="50" class="svg-blueprint-grid" />
    <line x1="20" y1="100" x2="500" y2="100" class="svg-blueprint-grid" />
    <line x1="20" y1="150" x2="500" y2="150" class="svg-blueprint-grid" />

    <!-- Road / Ground Line -->
    <line x1="15" y1="208" x2="505" y2="208" stroke="#1e293b" stroke-width="2" />

    <!-- Full Car Silhouette Exterior -->
    <path d="
      M 35 180 
      C 45 155, 60 145, 95 145 
      L 145 145 
      C 180 145, 215 100, 245 78 
      L 410 78 
      C 435 78, 470 120, 480 155 
      L 485 180 
      C 485 195, 475 200, 455 200 
      L 435 200 
      C 435 178, 395 178, 395 200 
      L 155 200 
      C 155 178, 115 178, 115 200 
      L 50 200 
      C 35 200, 30 190, 35 180 
      Z" 
      class="svg-car-body" 
    />

    <!-- Front Cabin Windows & Pillars -->
    <path d="M 160 140 L 225 90 L 290 90 L 290 140 Z" class="svg-car-glass" />
    <path d="M 300 90 L 370 90 L 370 140 L 300 140 Z" class="svg-car-glass" />

    <!-- Headlights & Taillights -->
    <path d="M 35 170 Q 50 170 55 160 L 40 160 Z" class="svg-car-light-amber" />
    <path d="M 480 160 Q 470 160 468 172 L 483 172 Z" class="svg-car-light-red" />

    <!-- Front & Rear Wheels -->
    <circle cx="135" cy="200" r="18" class="svg-car-wheel" />
    <circle cx="135" cy="200" r="9" class="svg-car-rim" />
    <circle cx="415" cy="200" r="18" class="svg-car-wheel" />
    <circle cx="415" cy="200" r="9" class="svg-car-rim" />

    <!-- Front Seats Silhouette -->
    <path d="M ${seatFrontX - 15} ${floorY} L ${seatFrontX - 22} ${roofY + 15} Q ${seatFrontX - 20} ${roofY + 5} ${seatFrontX - 10} ${roofY + 12} L ${seatFrontX - 5} ${floorY} Z" fill="#1e293b" stroke="#334155" />
    <circle cx="${seatFrontX - 14}" cy="${roofY + 6}" r="5" fill="#334155" />

    <!-- X-Ray Boot Cargo Enclosure -->
    <polygon 
      points="${seatFrontX},${floorY} ${sillX},${floorY} ${hatchTopX},${roofY} ${seatFrontX},${roofY}" 
      class="svg-car-interior" 
    />

    <!-- Boot Floor Plank -->
    <line x1="${seatFrontX}" y1="${floorY}" x2="${sillX}" y2="${floorY}" stroke="#0ea5e9" stroke-width="2.5" />

    <!-- Cargo Box (Side Profile) -->
    <rect 
      x="${seatFrontX}" 
      y="${boxY_side}" 
      width="${boxW_side}" 
      height="${boxH_side}" 
      rx="3" 
      class="${sideClip ? 'svg-box-clip' : 'svg-box-fit'}" 
    />

    <!-- Box Dimension Badge -->
    <text x="${seatFrontX + boxW_side / 2}" y="${boxY_side + boxH_side / 2 + 4}" class="svg-label-text" fill="${sideClip ? '#ef4444' : '#22c55e'}">
      ${Math.round(oL)} × ${Math.round(oH)} cm
    </text>

    <!-- Glass Collision Callout -->
    ${sideClip && oL > maxAllowedLenAtBoxH && oL <= boot.floor_length_cm && oH <= boot.max_height_cm ? `
      <circle cx="${seatFrontX + boxW_side}" cy="${boxY_side}" r="4" fill="#ef4444" />
      <text x="${seatFrontX + boxW_side - 5}" y="${boxY_side - 6}" fill="#ef4444" font-size="9" font-weight="800" text-anchor="end">Window Contact</text>
    ` : ''}

    <text x="${seatFrontX + floorLenPx / 2}" y="${floorY + 18}" class="svg-dim-text">Cargo Floor: ${boot.floor_length_cm} cm</text>
  `;

  sideTag.className = sideClip ? "vis-tag vis-tag-bad" : "vis-tag vis-tag-ok";
  sideTag.textContent = sideClip ? "Colliding" : "Clears";

  // ===============================================
  // VIEW 2: REAR HATCH BLUEPRINT (Width × Height)
  // ===============================================
  rearSvg.innerHTML = "";
  const midX = 220;
  const rFloorY = 175;

  const maxRearW = Math.max(boot.min_width_cm + 40, oW, aperture.width_cm + 10);
  const rScale = Math.min(270 / maxRearW, 100 / maxCargoH);

  const archSpanPx = boot.min_width_cm * rScale;
  const rBootHeightPx = boot.max_height_cm * rScale;
  const rRoofY = rFloorY - rBootHeightPx;

  const archLeftX = midX - (archSpanPx / 2);
  const archRightX = midX + (archSpanPx / 2);
  const carOuterLeft = midX - ((boot.min_width_cm + 42) * rScale / 2);
  const carOuterRight = midX + ((boot.min_width_cm + 42) * rScale / 2);

  const boxW_rear = oW * rScale;
  const boxH_rear = oH * rScale;
  const boxX_rear = midX - (boxW_rear / 2);
  const boxY_rear = rFloorY - boxH_rear;

  // Collision logic for rear view
  const rearClip = oW > boot.min_width_cm || oH > boot.max_height_cm || oW > aperture.width_cm || oH > aperture.height_cm;

  rearSvg.innerHTML = `
    <!-- Blueprint background grid -->
    <line x1="20" y1="50" x2="420" y2="50" class="svg-blueprint-grid" />
    <line x1="20" y1="100" x2="420" y2="100" class="svg-blueprint-grid" />
    <line x1="20" y1="150" x2="420" y2="150" class="svg-blueprint-grid" />

    <!-- Road Line -->
    <line x1="20" y1="208" x2="420" y2="208" stroke="#1e293b" stroke-width="2" />

    <!-- Dual Rear Tires -->
    <rect x="${carOuterLeft + 4}" y="180" width="22" height="28" rx="4" class="svg-car-wheel" />
    <rect x="${carOuterRight - 26}" y="180" width="22" height="28" rx="4" class="svg-car-wheel" />

    <!-- Car Rear Outer Shell -->
    <path d="
      M ${carOuterLeft + 6} 200 
      L ${carOuterLeft - 4} 175 
      Q ${carOuterLeft - 8} 145 ${carOuterLeft + 12} 135 
      L ${carOuterLeft + 22} 65 
      Q ${carOuterLeft + 30} 55 ${midX} 55 
      Q ${carOuterRight - 30} 55 ${carOuterRight - 22} 65 
      L ${carOuterRight - 12} 135 
      Q ${carOuterRight + 8} 145 ${carOuterRight + 4} 175 
      L ${carOuterRight - 6} 200 
      Z" 
      class="svg-car-body" 
    />

    <!-- Rear Tail Lights -->
    <path d="M ${carOuterLeft - 2} 140 Q ${carOuterLeft + 12} 138 ${carOuterLeft + 18} 148 L ${carOuterLeft + 4} 154 Z" class="svg-car-light-red" />
    <path d="M ${carOuterRight + 2} 140 Q ${carOuterRight - 12} 138 ${carOuterRight - 18} 148 L ${carOuterRight - 4} 154 Z" class="svg-car-light-red" />

    <!-- Rear Windscreen Outline (Upper Section) -->
    <path d="
      M ${carOuterLeft + 28} 72 
      L ${midX} 68 
      L ${carOuterRight - 28} 72 
      L ${carOuterRight - 20} 125 
      L ${carOuterLeft + 20} 125 
      Z" 
      class="svg-car-glass" 
    />

    <!-- Boot Opening & Interior Wheel Arch Intrusions -->
    <path d="
      M ${archLeftX - 15} ${rRoofY} 
      L ${archRightX + 15} ${rRoofY} 
      L ${archRightX + 15} ${rFloorY - 26} 
      C ${archRightX + 15} ${rFloorY - 26}, ${archRightX} ${rFloorY - 26}, ${archRightX} ${rFloorY} 
      L ${archLeftX} ${rFloorY} 
      C ${archLeftX} ${rFloorY - 26}, ${archLeftX - 15} ${rFloorY - 26}, ${archLeftX - 15} ${rFloorY - 26} 
      Z" 
      class="svg-car-interior" 
    />

    <!-- Boot Floor -->
    <line x1="${archLeftX}" y1="${rFloorY}" x2="${archRightX}" y2="${rFloorY}" stroke="#0ea5e9" stroke-width="2.5" />

    <!-- Cargo Box (Rear Cross-Section) -->
    <rect 
      x="${boxX_rear}" 
      y="${boxY_rear}" 
      width="${boxW_rear}" 
      height="${boxH_rear}" 
      rx="3" 
      class="${rearClip ? 'svg-box-clip' : 'svg-box-fit'}" 
    />

    <!-- Box Dimension Badge -->
    <text x="${midX}" y="${boxY_rear + boxH_rear / 2 + 4}" class="svg-label-text" fill="${rearClip ? '#ef4444' : '#22c55e'}">
      ${Math.round(oW)} × ${Math.round(oH)} cm
    </text>

    <!-- Arch Pinch Callout Indicator -->
    <text x="${midX}" y="${rFloorY + 18}" class="svg-dim-text">Between Arches: ${boot.min_width_cm} cm</text>
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