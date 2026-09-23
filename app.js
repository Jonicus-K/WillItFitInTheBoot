/**
 * Will It Fit In The Boot?
 * Pure client-side spatial rotation, 4-gate constraint, and dual angled solver engine.
 */

let vehicles = [];
let selectedCar = null;

const cargoLengthInput = document.getElementById('cargo-length');
const cargoWidthInput = document.getElementById('cargo-width');
const cargoHeightInput = document.getElementById('cargo-height');
const carSelect = document.getElementById('car-select');
const foldSeatsCheckbox = document.getElementById('fold-seats');

const resultBanner = document.getElementById('result-banner');
const resultExplanation = document.getElementById('result-explanation');
const sideBadge = document.getElementById('side-badge');
const rearBadge = document.getElementById('rear-badge');

const sideSvg = document.getElementById('side-svg');
const rearSvg = document.getElementById('rear-svg');

const specFloor = document.getElementById('spec-floor');
const specArches = document.getElementById('spec-arches');
const specRoof = document.getElementById('spec-roof');
const specAperture = document.getElementById('spec-aperture');

const presetButtons = document.querySelectorAll('.preset-btn');

async function init() {
  try {
    const res = await fetch('data/cars.json');
    vehicles = await res.json();
  } catch (err) {
    console.error('Failed to load cars.json, using fallback data:', err);
    vehicles = [
      {
        id: "vw-golf-mk8",
        name: "Volkswagen Golf (Mk8, 2020+)",
        floor_length_seats_folded: 140,
        floor_length_seats_up: 77,
        wheel_arch_width: 100,
        roof_height: 71,
        aperture_width: 102,
        aperture_height: 67,
        rake_angle_deg: 29.4
      }
    ];
  }

  carSelect.innerHTML = vehicles
    .map((car, idx) => `<option value="${car.id}" ${idx === 0 ? 'selected' : ''}>${car.name}</option>`)
    .join('');

  selectedCar = vehicles[0];
  attachEvents();
  evaluateFitment();
}

function attachEvents() {
  [cargoLengthInput, cargoWidthInput, cargoHeightInput].forEach(input => {
    input.addEventListener('input', () => {
      clearActivePresets();
      evaluateFitment();
    });
  });

  carSelect.addEventListener('change', (e) => {
    selectedCar = vehicles.find(c => c.id === e.target.value) || vehicles[0];
    evaluateFitment();
  });

  foldSeatsCheckbox.addEventListener('change', () => {
    evaluateFitment();
  });

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      clearActivePresets();
      btn.classList.add('active');
      cargoLengthInput.value = btn.dataset.length;
      cargoWidthInput.value = btn.dataset.width;
      cargoHeightInput.value = btn.dataset.height;
      evaluateFitment();
    });
  });
}

function clearActivePresets() {
  presetButtons.forEach(btn => btn.classList.remove('active'));
}

function getUniqueRotations(l, w, h) {
  const perms = [
    [l, w, h],
    [l, h, w],
    [w, l, h],
    [w, h, l],
    [h, l, w],
    [h, w, l]
  ];
  const seen = new Set();
  const unique = [];
  perms.forEach(([dimL, dimW, dimH]) => {
    const key = `${dimL}-${dimW}-${dimH}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ l: dimL, w: dimW, h: dimH });
    }
  });
  return unique;
}

function evaluateFitment() {
  if (!selectedCar) return;

  const rawL = parseFloat(cargoLengthInput.value) || 0;
  const rawW = parseFloat(cargoWidthInput.value) || 0;
  const rawH = parseFloat(cargoHeightInput.value) || 0;

  const seatsFolded = foldSeatsCheckbox.checked;
  const floorLength = seatsFolded ? selectedCar.floor_length_seats_folded : selectedCar.floor_length_seats_up;
  const archWidth = selectedCar.wheel_arch_width;
  const roofHeight = selectedCar.roof_height;
  const apWidth = selectedCar.aperture_width;
  const apHeight = selectedCar.aperture_height;
  const rakeRad = (selectedCar.rake_angle_deg * Math.PI) / 180;
  const tanRake = Math.tan(rakeRad);

  specFloor.textContent = `${floorLength} cm (${seatsFolded ? 'seats folded' : 'seats up'})`;
  specArches.textContent = `${archWidth} cm`;
  specRoof.textContent = `${roofHeight} cm`;
  specAperture.textContent = `${apWidth} cm wide × ${apHeight} cm high`;

  if (rawL <= 0 || rawW <= 0 || rawH <= 0) {
    resultBanner.className = 'result-banner will-not-fit';
    resultBanner.textContent = 'Invalid Dimensions';
    resultExplanation.textContent = 'Please enter positive dimensions for length, width, and height.';
    return;
  }

  const rotations = getUniqueRotations(rawL, rawW, rawH);

  // Gate 1: Check standard flat (orthogonal) fitment across all 6 rotations
  let bestFlatFit = null;
  let flatCollisionReasons = [];

  for (const rot of rotations) {
    const usableLengthAtH = floorLength - (rot.h * tanRake);
    const passesAperture = rot.w <= apWidth && rot.h <= apHeight;
    const passesArch = rot.w <= archWidth;
    const passesRoof = rot.h <= roofHeight;
    const passesRake = rot.l <= usableLengthAtH;

    if (passesAperture && passesArch && passesRoof && passesRake) {
      const margin = Math.min(
        usableLengthAtH - rot.l,
        archWidth - rot.w,
        roofHeight - rot.h,
        apWidth - rot.w,
        apHeight - rot.h
      );
      if (!bestFlatFit || margin > bestFlatFit.margin) {
        bestFlatFit = { rot, margin, usableLengthAtH };
      }
    } else {
      if (!passesRake && passesArch && passesRoof) {
        flatCollisionReasons.push(`Hits rear window glass (available length at ${rot.h} cm height is ${Math.round(usableLengthAtH)} cm).`);
      } else if (!passesArch) {
        flatCollisionReasons.push(`Exceeds wheel arch width (${rot.w} cm vs ${archWidth} cm limit).`);
      } else if (!passesRoof) {
        flatCollisionReasons.push(`Exceeds roof height (${rot.h} cm vs ${roofHeight} cm limit).`);
      }
    }
  }

  if (bestFlatFit) {
    const isComfortable = bestFlatFit.margin >= 4;
    resultBanner.className = `result-banner ${isComfortable ? 'fits-comfortable' : 'fits-tight'}`;
    resultBanner.textContent = isComfortable ? 'Fits Comfortably' : 'Tight Fit';
    resultExplanation.textContent = isComfortable
      ? `Clears all cargo limits with over ${Math.round(bestFlatFit.margin)} cm buffer (orientation: ${bestFlatFit.rot.l} × ${bestFlatFit.rot.w} × ${bestFlatFit.rot.h} cm).`
      : `Fits with a tight margin of ${Math.round(bestFlatFit.margin * 10) / 10} cm. Take care when closing the tailgate.`;

    sideBadge.className = 'badge badge-clears';
    sideBadge.textContent = 'Clears';
    rearBadge.className = 'badge badge-clears';
    rearBadge.textContent = 'Clears';

    renderSideSvg(bestFlatFit.rot, floorLength, roofHeight, tanRake, 'flat', 0);
    renderRearSvg(bestFlatFit.rot, archWidth, roofHeight, apWidth, apHeight, false);
    return;
  }

  // Gate 2: Angled Pitch Solver (Front propped up onto folded seatbacks to bypass hatch rake)
  let bestPitchFit = null;

  for (const rot of rotations) {
    if (rot.w > archWidth || rot.w > apWidth) continue;

    for (let deg = 1; deg <= 35; deg++) {
      const rad = (deg * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      const topFrontH = (rot.l * sinA) + (rot.h * cosA);
      if (topFrontH > roofHeight) continue;

      const minSillOffset = rot.h * (sinA + cosA * tanRake);
      const maxSillOffset = floorLength - (rot.l * cosA);

      if (maxSillOffset >= minSillOffset) {
        bestPitchFit = {
          rot,
          angle: deg,
          margin: maxSillOffset - minSillOffset,
          topFrontH
        };
        break;
      }
    }
    if (bestPitchFit) break;
  }

  // Gate 3: Angled Yaw Solver (Rotated diagonally corner-to-corner across boot floor)
  let bestYawFit = null;

  for (const rot of rotations) {
    if (rot.h > roofHeight || rot.h > apHeight) continue;
    const usableL = floorLength - (rot.h * tanRake);

    for (let deg = 1; deg <= 40; deg++) {
      const rad = (deg * Math.PI) / 180;
      const cosP = Math.cos(rad);
      const sinP = Math.sin(rad);

      const boundingL = (rot.l * cosP) + (rot.w * sinP);
      const boundingW = (rot.l * sinP) + (rot.w * cosP);

      if (boundingL <= usableL && boundingW <= archWidth && boundingW <= apWidth) {
        bestYawFit = {
          rot,
          angle: deg,
          boundingL,
          boundingW
        };
        break;
      }
    }
    if (bestYawFit) break;
  }

  // Decide Angled Outcome
  if (bestPitchFit) {
    resultBanner.className = 'result-banner fits-angled';
    resultBanner.textContent = `Fits at an Angle (Tilted ~${bestPitchFit.angle}°)`;
    resultExplanation.textContent = `Hits rear window if flat, but fits by propping the front edge up onto the seatback (~${bestPitchFit.angle}° tilt), pulling the rear face clear of the glass.`;

    sideBadge.className = 'badge badge-angled';
    sideBadge.textContent = `Tilted ~${bestPitchFit.angle}°`;
    rearBadge.className = 'badge badge-clears';
    rearBadge.textContent = 'Clears';

    renderSideSvg(bestPitchFit.rot, floorLength, roofHeight, tanRake, 'pitch', bestPitchFit.angle);
    renderRearSvg(bestPitchFit.rot, archWidth, roofHeight, apWidth, apHeight, false);
    return;
  }

  if (bestYawFit) {
    resultBanner.className = 'result-banner fits-angled';
    resultBanner.textContent = `Fits Diagonally (Angled ~${bestYawFit.angle}°)`;
    resultExplanation.textContent = `Too long to fit straight, but clears comfortably when positioned diagonally corner-to-corner across the boot floor.`;

    sideBadge.className = 'badge badge-angled';
    sideBadge.textContent = `Diagonal ~${bestYawFit.angle}°`;
    rearBadge.className = 'badge badge-angled';
    rearBadge.textContent = 'Diagonal';

    renderSideSvg(bestYawFit.rot, floorLength, roofHeight, tanRake, 'yaw', bestYawFit.angle);
    renderRearSvg(bestYawFit.rot, archWidth, roofHeight, apWidth, apHeight, false);
    return;
  }

  // Gate 4: Will Not Fit
  resultBanner.className = 'result-banner will-not-fit';
  resultBanner.textContent = 'Will Not Fit';
  resultExplanation.textContent = flatCollisionReasons[0] || 'Object dimensions exceed maximum interior vehicle limits.';

  sideBadge.className = 'badge badge-colliding';
  sideBadge.textContent = 'Colliding';
  rearBadge.className = rawW > archWidth ? 'badge badge-colliding' : 'badge badge-clears';
  rearBadge.textContent = rawW > archWidth ? 'Colliding' : 'Clears';

  renderSideSvg({ l: rawL, w: rawW, h: rawH }, floorLength, roofHeight, tanRake, 'colliding', 0);
  renderRearSvg({ l: rawL, w: rawW, h: rawH }, archWidth, roofHeight, apWidth, apHeight, rawW > archWidth);
}

function renderSideSvg(rot, floorLength, roofHeight, tanRake, mode, angle) {
  const svgW = 540;
  const svgH = 220;
  const floorY = 175;
  const rearSillX = 430;
  const scale = 1.6;

  const floorLenPx = floorLength * scale;
  const seatFrontX = rearSillX - floorLenPx;
  const roofY = floorY - (roofHeight * scale);
  const glassTopX = rearSillX - (roofHeight * tanRake * scale);

  const boxLPx = rot.l * scale;
  const boxHPx = rot.h * scale;

  let cargoMarkup = '';

  if (mode === 'pitch') {
    const pivotX = rearSillX - 10;
    const pivotY = floorY;
    cargoMarkup = `
      <g transform="rotate(${angle}, ${pivotX}, ${pivotY})">
        <rect x="${pivotX - boxLPx}" y="${pivotY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
              fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" stroke-width="2" rx="3" />
        <text x="${pivotX - (boxLPx / 2)}" y="${pivotY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">
          ${rot.l} × ${rot.h} cm (~${angle}° tilt)
        </text>
      </g>
      <line x1="${pivotX - 10}" y1="${pivotY}" x2="${pivotX + 20}" y2="${pivotY}" stroke="#38bdf8" stroke-dasharray="3,3" stroke-width="1.5" />
    `;
  } else if (mode === 'colliding') {
    const boxX = seatFrontX;
    cargoMarkup = `
      <rect x="${boxX}" y="${floorY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
            fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,2" rx="3" />
      <text x="${boxX + (boxLPx / 2)}" y="${floorY - (boxHPx / 2) + 4}" fill="#fca5a5" font-size="11" font-weight="700" text-anchor="middle">
        ${rot.l} × ${rot.h} cm
      </text>
      <line x1="${rearSillX}" y1="${floorY - boxHPx}" x2="${glassTopX + 25}" y2="${floorY - boxHPx}" stroke="#ef4444" stroke-width="2" />
      <text x="${rearSillX - 20}" y="${floorY - boxHPx - 8}" fill="#f87171" font-size="10" font-weight="700" text-anchor="middle">
        Window Collision
      </text>
    `;
  } else {
    const boxX = Math.max(seatFrontX, rearSillX - boxLPx);
    cargoMarkup = `
      <rect x="${boxX}" y="${floorY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
            fill="rgba(34, 197, 94, 0.35)" stroke="#22c55e" stroke-width="2" rx="3" />
      <text x="${boxX + (boxLPx / 2)}" y="${floorY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">
        ${rot.l} × ${rot.h} cm
      </text>
    `;
  }

  sideSvg.innerHTML = `
    <!-- Ground Line -->
    <line x1="20" y1="195" x2="520" y2="195" stroke="#1e293b" stroke-width="2" />

    <!-- Vehicle Outer Contour (Hatchback/SUV Silhouette) -->
    <path d="M 60 175 
             L 75 140 
             Q 110 135 150 120 
             L 210 65 
             Q 230 60 270 60 
             L 380 60 
             Q 405 60 420 75 
             L ${glassTopX + 35} ${roofY - 10}
             L ${rearSillX + 15} 150 
             L ${rearSillX + 18} 175 Z" 
          fill="none" stroke="#22304a" stroke-width="2" />

    <!-- Wheels -->
    <circle cx="120" cy="180" r="22" fill="#0d1527" stroke="#334155" stroke-width="3" />
    <circle cx="120" cy="180" r="10" fill="#1e293b" />
    <circle cx="430" cy="180" r="22" fill="#0d1527" stroke="#334155" stroke-width="3" />
    <circle cx="430" cy="180" r="10" fill="#1e293b" />

    <!-- Headlight & Taillight -->
    <polygon points="62,142 75,140 70,150" fill="#eab308" opacity="0.8" />
    <polygon points="${rearSillX + 16},152 ${rearSillX + 10},150 ${rearSillX + 12},162" fill="#ef4444" opacity="0.8" />

    <!-- Cargo Compartment Floor -->
    <line x1="${seatFrontX}" y1="${floorY}" x2="${rearSillX}" y2="${floorY}" stroke="#38bdf8" stroke-width="2.5" />
    <text x="${rearSillX - 10}" y="${floorY + 14}" fill="#64748b" font-size="9" text-anchor="end">
      Cargo Floor: ${floorLength} cm
    </text>

    <!-- Front Seat Divider -->
    <line x1="${seatFrontX}" y1="${floorY}" x2="${seatFrontX + 10}" y2="${roofY}" stroke="#475569" stroke-width="2" stroke-dasharray="3,3" />

    <!-- Raked Rear Window Line -->
    <line x1="${rearSillX}" y1="${floorY}" x2="${glassTopX}" y2="${roofY}" stroke="#38bdf8" stroke-dasharray="4,3" stroke-width="1.5" />

    <!-- Roofline Limit -->
    <line x1="${seatFrontX + 10}" y1="${roofY}" x2="${glassTopX}" y2="${roofY}" stroke="#334155" stroke-dasharray="2,2" stroke-width="1" />

    <!-- Cargo Payload -->
    ${cargoMarkup}
  `;
}

function renderRearSvg(rot, archWidth, roofHeight, apWidth, apHeight, isArchColliding) {
  const svgW = 380;
  const svgH = 220;
  const centerX = svgW / 2;
  const floorY = 175;
  const scale = 1.35;

  const archWPx = archWidth * scale;
  const roofHPx = roofHeight * scale;
  const apWPx = apWidth * scale;
  const apHPx = apHeight * scale;

  const boxWPx = rot.w * scale;
  const boxHPx = rot.h * scale;
  const boxLeftX = centerX - (boxWPx / 2);

  const boxColor = isArchColliding ? '#ef4444' : '#22c55e';
  const boxBg = isArchColliding ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.35)';

  rearSvg.innerHTML = `
    <!-- Tires -->
    <rect x="${centerX - (archWPx / 2) - 45}" y="160" width="30" height="35" rx="4" fill="#0d1527" stroke="#334155" stroke-width="2" />
    <rect x="${centerX + (archWPx / 2) + 15}" y="160" width="30" height="35" rx="4" fill="#0d1527" stroke="#334155" stroke-width="2" />

    <!-- Car Rear Shell -->
    <path d="M ${centerX - (apWPx / 2) - 25} 175 
             L ${centerX - (apWPx / 2) - 20} 90 
             Q ${centerX - (apWPx / 2)} 45 ${centerX} 45 
             Q ${centerX + (apWPx / 2)} 45 ${centerX + (apWPx / 2) + 20} 90 
             L ${centerX + (apWPx / 2) + 25} 175 Z" 
          fill="none" stroke="#22304a" stroke-width="2" />

    <!-- Taillights -->
    <polygon points="${centerX - (apWPx / 2) - 18},95 ${centerX - (apWPx / 2) - 4},100 ${centerX - (apWPx / 2) - 12},125" fill="#ef4444" opacity="0.85" />
    <polygon points="${centerX + (apWPx / 2) + 18},95 ${centerX + (apWPx / 2) + 4},100 ${centerX + (apWPx / 2) + 12},125" fill="#ef4444" opacity="0.85" />

    <!-- Tailgate Aperture Outline -->
    <rect x="${centerX - (apWPx / 2)}" y="${floorY - apHPx}" width="${apWPx}" height="${apHPx}" 
          fill="none" stroke="#334155" stroke-dasharray="4,3" stroke-width="1.5" rx="6" />

    <!-- Wheel Arch Intrusions -->
    <path d="M ${centerX - (apWPx / 2)} 175 
             L ${centerX - (archWPx / 2)} 175 
             Q ${centerX - (archWPx / 2) + 10} 150 ${centerX - (archWPx / 2) - 15} 145 
             L ${centerX - (apWPx / 2)} 145 Z" 
          fill="#151e32" stroke="#38bdf8" stroke-width="1.5" />

    <path d="M ${centerX + (apWPx / 2)} 175 
             L ${centerX + (archWPx / 2)} 175 
             Q ${centerX + (archWPx / 2) - 10} 150 ${centerX + (archWPx / 2) + 15} 145 
             L ${centerX + (apWPx / 2)} 145 Z" 
          fill="#151e32" stroke="#38bdf8" stroke-width="1.5" />

    <!-- Arch Width Measurement Line -->
    <line x1="${centerX - (archWPx / 2)}" y1="184" x2="${centerX + (archWPx / 2)}" y2="184" stroke="#64748b" stroke-width="1" />
    <text x="${centerX}" y="196" fill="#64748b" font-size="9" text-anchor="middle">
      Between Arches: ${archWidth} cm
    </text>

    <!-- Cargo Box -->
    <rect x="${boxLeftX}" y="${floorY - boxHPx}" width="${boxWPx}" height="${boxHPx}" 
          fill="${boxBg}" stroke="${boxColor}" stroke-width="2" rx="3" />
    <text x="${centerX}" y="${floorY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">
      ${rot.w} × ${rot.h} cm
    </text>
  `;
}

document.addEventListener('DOMContentLoaded', init);