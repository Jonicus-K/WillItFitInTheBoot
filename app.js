/**
 * Will It Fit In The Boot?
 * Pure client-side spatial rotation, 4-gate constraint, and dual angled solver engine.
 */

const defaultCars = [
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
  },
  {
    id: "ford-focus-mk4",
    name: "Ford Focus Hatchback (Mk4, 2018+)",
    floor_length_seats_folded: 146,
    floor_length_seats_up: 81,
    wheel_arch_width: 103,
    roof_height: 74,
    aperture_width: 104,
    aperture_height: 69,
    rake_angle_deg: 31.0
  },
  {
    id: "nissan-qashqai-mk3",
    name: "Nissan Qashqai (Mk3, 2021+)",
    floor_length_seats_folded: 153,
    floor_length_seats_up: 86,
    wheel_arch_width: 105,
    roof_height: 80,
    aperture_width: 108,
    aperture_height: 75,
    rake_angle_deg: 26.5
  },
  {
    id: "vauxhall-corsa-f",
    name: "Vauxhall Corsa (F, 2019+)",
    floor_length_seats_folded: 125,
    floor_length_seats_up: 66,
    wheel_arch_width: 96,
    roof_height: 68,
    aperture_width: 95,
    aperture_height: 62,
    rake_angle_deg: 32.0
  },
  {
    id: "tesla-model-y",
    name: "Tesla Model Y (2021+)",
    floor_length_seats_folded: 195,
    floor_length_seats_up: 108,
    wheel_arch_width: 95,
    roof_height: 72,
    aperture_width: 106,
    aperture_height: 70,
    rake_angle_deg: 35.0
  }
];

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

function extractNumber(obj, candidateKeys, fallback) {
  if (!obj || typeof obj !== 'object') return fallback;

  const objectKeys = Object.keys(obj);
  const normalizedKeyMap = objectKeys.map(k => ({
    original: k,
    clean: k.toLowerCase().replace(/[^a-z0-9]/g, '')
  }));

  for (const candidate of candidateKeys) {
    const cleanCand = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = normalizedKeyMap.find(k => k.clean === cleanCand);
    if (found) {
      const val = parseFloat(obj[found.original]);
      if (!isNaN(val) && val > 0) return val;
    }
  }

  const subObjects = ['boot', 'cargo', 'dimensions', 'specs', 'measurements', 'interior', 'seats_folded', 'folded'];
  for (const sub of subObjects) {
    if (obj[sub] && typeof obj[sub] === 'object') {
      const nestedVal = extractNumber(obj[sub], candidateKeys, null);
      if (nestedVal !== null) return nestedVal;
    }
  }

  return fallback;
}

function normalizeCar(raw, index = 0) {
  if (!raw || typeof raw !== 'object') {
    return defaultCars[index % defaultCars.length];
  }

  const name = raw.name || raw.model || (raw.make ? `${raw.make} ${raw.model || ''}`.trim() : '') || raw.title || raw.vehicle || `Vehicle ${index + 1}`;
  const id = String(raw.id || raw.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

  const floorFolded = extractNumber(raw, [
    'floor_length_seats_folded', 'floorlengthseatsfolded', 'seats_folded_length', 'seatsfoldedlength',
    'folded_length', 'foldedlength', 'seats_down_length', 'seatsdownlength', 'boot_length_folded',
    'bootlengthfolded', 'max_cargo_length', 'maxlength', 'length_folded'
  ], null);

  const floorUp = extractNumber(raw, [
    'floor_length_seats_up', 'floorlengthseatsup', 'seats_up_length', 'seatsuplength',
    'floor_length_standard', 'floorlengthstandard', 'floor_length', 'floorlength',
    'boot_length', 'bootlength', 'standard_length', 'min_length', 'minlength', 'length'
  ], 80);

  const resolvedFolded = floorFolded !== null ? floorFolded : Math.round(floorUp * 1.8);

  const archWidth = extractNumber(raw, [
    'wheel_arch_width', 'wheelarchwidth', 'width_between_arches', 'widthbetweenwheelarches',
    'arch_width', 'archwidth', 'min_width', 'minwidth', 'boot_width', 'bootwidth', 'cargo_width', 'width'
  ], 102);

  const roofHeight = extractNumber(raw, [
    'roof_height', 'roofheight', 'interior_height', 'interiorheight',
    'boot_height', 'bootheight', 'cargo_height', 'max_height', 'height'
  ], 74);

  const apertureWidth = extractNumber(raw, [
    'aperture_width', 'aperturewidth', 'tailgate_width', 'tailgatewidth',
    'opening_width', 'openingwidth', 'hatch_width', 'hatchwidth'
  ], archWidth + 2);

  const apertureHeight = extractNumber(raw, [
    'aperture_height', 'apertureheight', 'tailgate_height', 'tailgateheight',
    'opening_height', 'openingheight', 'hatch_height', 'hatchheight'
  ], roofHeight - 4);

  const rakeAngle = extractNumber(raw, [
    'rake_angle_deg', 'rakeangledeg', 'rake_angle', 'rakeangle',
    'rear_window_angle', 'rearwindowangle', 'window_angle', 'rake', 'rear_rake'
  ], 29.0);

  return {
    id,
    name,
    floor_length_seats_folded: resolvedFolded,
    floor_length_seats_up: floorUp,
    wheel_arch_width: archWidth,
    roof_height: roofHeight,
    aperture_width: apertureWidth,
    aperture_height: apertureHeight,
    rake_angle_deg: rakeAngle
  };
}

async function init() {
  try {
    const res = await fetch('data/cars.json');
    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }
    const rawData = await res.json();
    let carArray = [];

    if (Array.isArray(rawData)) {
      carArray = rawData;
    } else if (rawData && Array.isArray(rawData.cars)) {
      carArray = rawData.cars;
    } else if (rawData && Array.isArray(rawData.vehicles)) {
      carArray = rawData.vehicles;
    } else if (rawData && typeof rawData === 'object') {
      carArray = Object.keys(rawData).map(key => ({ id: key, ...rawData[key] }));
    }

    vehicles = carArray.map((car, idx) => normalizeCar(car, idx));
  } catch (err) {
    console.warn('Unable to load external cars.json, initializing built-in vehicle registry:', err);
    vehicles = defaultCars.map((car, idx) => normalizeCar(car, idx));
  }

  if (!vehicles || vehicles.length === 0) {
    vehicles = defaultCars.map((car, idx) => normalizeCar(car, idx));
  }

  carSelect.innerHTML = vehicles
    .map((car, idx) => `<option value="${idx}" ${idx === 0 ? 'selected' : ''}>${car.name}</option>`)
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
    const selectedIdx = parseInt(e.target.value, 10);
    if (!isNaN(selectedIdx) && vehicles[selectedIdx]) {
      selectedCar = vehicles[selectedIdx];
    } else if (carSelect.selectedIndex >= 0 && vehicles[carSelect.selectedIndex]) {
      selectedCar = vehicles[carSelect.selectedIndex];
    } else {
      selectedCar = vehicles.find(c => c.id === e.target.value || c.name === e.target.value) || vehicles[0];
    }
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

    renderSideSvg(bestFlatFit.rot, floorLength, roofHeight, tanRake, 'flat', 0, seatsFolded);
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

    renderSideSvg(bestPitchFit.rot, floorLength, roofHeight, tanRake, 'pitch', bestPitchFit.angle, seatsFolded);
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

    renderSideSvg(bestYawFit.rot, floorLength, roofHeight, tanRake, 'yaw', bestYawFit.angle, seatsFolded);
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

  renderSideSvg({ l: rawL, w: rawW, h: rawH }, floorLength, roofHeight, tanRake, 'colliding', 0, seatsFolded);
  renderRearSvg({ l: rawL, w: rawW, h: rawH }, archWidth, roofHeight, apWidth, apHeight, rawW > archWidth);
}

function renderSideSvg(rot, floorLength, roofHeight, tanRake, mode, angle, seatsFolded) {
  const floorY = 205;
  const rearSillX = 500;
  const scale = 1.7;

  const floorLenPx = floorLength * scale;
  const seatFrontX = rearSillX - floorLenPx;
  const roofY = floorY - (roofHeight * scale);
  const glassTopX = rearSillX - (roofHeight * tanRake * scale);

  const boxLPx = rot.l * scale;
  const boxHPx = rot.h * scale;

  let cargoMarkup = '';

  if (mode === 'pitch') {
    const pivotX = rearSillX - 10;
    const pivotY = floorY - 3;
    cargoMarkup = `
      <!-- Tilted Cargo Box -->
      <g transform="rotate(-${angle}, ${pivotX}, ${pivotY})">
        <rect x="${pivotX - boxLPx}" y="${pivotY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
              fill="url(#box-grad-cyan)" stroke="#38bdf8" stroke-width="2" rx="4" filter="url(#glow-cyan)" />
        
        <!-- Box Center Label -->
        <text x="${pivotX - (boxLPx / 2)}" y="${pivotY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
          ${rot.l} × ${rot.h} cm
        </text>

        <!-- Box Tape / Accent Detail -->
        <line x1="${pivotX - boxLPx + 12}" y1="${pivotY - boxHPx}" x2="${pivotX - boxLPx + 12}" y2="${pivotY}" stroke="rgba(56, 189, 248, 0.4)" stroke-width="2" />
        <line x1="${pivotX - 12}" y1="${pivotY - boxHPx}" x2="${pivotX - 12}" y2="${pivotY}" stroke="rgba(56, 189, 248, 0.4)" stroke-width="2" />
      </g>

      <!-- Tilt Angle Arc Indicator -->
      <path d="M ${pivotX - 55} ${pivotY} A 55 55 0 0 0 ${pivotX - 52} ${pivotY - 20}" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2,2" />
      <text x="${pivotX - 62}" y="${pivotY - 10}" fill="#38bdf8" font-size="10" font-family="ui-monospace, monospace" font-weight="700" text-anchor="end">
        ~${angle}°
      </text>
    `;
  } else if (mode === 'colliding') {
    const boxX = seatFrontX;
    cargoMarkup = `
      <!-- Colliding Box -->
      <rect x="${boxX}" y="${floorY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
            fill="url(#box-grad-red)" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,3" rx="4" />
      
      <!-- Caution Hatch Pattern on Overlap -->
      <rect x="${rearSillX - 45}" y="${floorY - boxHPx}" width="60" height="${boxHPx}" fill="url(#hazard-stripes)" opacity="0.65" rx="3" />

      <text x="${boxX + (boxLPx / 2)}" y="${floorY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
        ${rot.l} × ${rot.h} cm
      </text>

      <!-- Collision Reticle & Indicator -->
      <circle cx="${rearSillX - 10}" cy="${floorY - boxHPx + 10}" r="9" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" stroke-width="2" />
      <circle cx="${rearSillX - 10}" cy="${floorY - boxHPx + 10}" r="3" fill="#ef4444" />
      <line x1="${rearSillX - 10}" y1="${floorY - boxHPx + 10}" x2="${rearSillX + 35}" y2="${floorY - boxHPx - 15}" stroke="#ef4444" stroke-width="1.5" />
      <rect x="${rearSillX + 35}" y="${floorY - boxHPx - 26}" width="100" height="18" rx="4" fill="#180e14" stroke="#ef4444" stroke-width="1" />
      <text x="${rearSillX + 85}" y="${floorY - boxHPx - 14}" fill="#fca5a5" font-size="9" font-family="ui-monospace, monospace" font-weight="700" text-anchor="middle">
        GLASS COLLISION
      </text>
    `;
  } else {
    const boxX = Math.max(seatFrontX, rearSillX - boxLPx);
    cargoMarkup = `
      <!-- Cleared Cargo Box -->
      <rect x="${boxX}" y="${floorY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
            fill="url(#box-grad-green)" stroke="#22c55e" stroke-width="2" rx="4" filter="url(#glow-green)" />
      
      <!-- Technical Package Strapping Lines -->
      <line x1="${boxX + 16}" y1="${floorY - boxHPx}" x2="${boxX + 16}" y2="${floorY}" stroke="rgba(34, 197, 94, 0.3)" stroke-width="2" />
      <line x1="${boxX + boxLPx - 16}" y1="${floorY - boxHPx}" x2="${boxX + boxLPx - 16}" y2="${floorY}" stroke="rgba(34, 197, 94, 0.3)" stroke-width="2" />

      <text x="${boxX + (boxLPx / 2)}" y="${floorY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
        ${rot.l} × ${rot.h} cm
      </text>
    `;
  }

  // Seat Configuration Geometry
  let seatGraphics = '';
  if (seatsFolded) {
    seatGraphics = `
      <!-- Folded Flat Seats Profile -->
      <path d="M ${seatFrontX} ${floorY} 
               L ${seatFrontX - 22} ${floorY - 14} 
               L ${seatFrontX + 45} ${floorY - 14} 
               L ${seatFrontX + 40} ${floorY} Z" 
            fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <circle cx="${seatFrontX - 2}" cy="${floorY - 7}" r="4" fill="#38bdf8" opacity="0.6" />
      <text x="${seatFrontX + 8}" y="${floorY - 20}" fill="#64748b" font-size="8" font-family="ui-monospace, monospace">SEATS FOLDED</text>
    `;
  } else {
    seatGraphics = `
      <!-- Upright Rear Seats Profile -->
      <path d="M ${seatFrontX} ${floorY} 
               L ${seatFrontX - 12} ${floorY - 75} 
               L ${seatFrontX - 24} ${floorY - 75} 
               L ${seatFrontX - 18} ${floorY} Z" 
            fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <!-- Headrest -->
      <rect x="${seatFrontX - 21}" y="${floorY - 92}" width="16" height="14" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <line x1="${seatFrontX - 16}" y1="${floorY - 75}" x2="${seatFrontX - 16}" y2="${floorY - 78}" stroke="#64748b" stroke-width="2" />
      <line x1="${seatFrontX - 10}" y1="${floorY - 75}" x2="${seatFrontX - 10}" y2="${floorY - 78}" stroke="#64748b" stroke-width="2" />
      <text x="${seatFrontX - 30}" y="${floorY - 45}" fill="#64748b" font-size="8" font-family="ui-monospace, monospace" transform="rotate(-90, ${seatFrontX - 30}, ${floorY - 45})">SEATBACK</text>
    `;
  }

  sideSvg.innerHTML = `
    <defs>
      <!-- Blueprint Grid Pattern -->
      <pattern id="grid-side" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#162032" stroke-width="0.8" />
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1c2c46" stroke-width="1.2" />
      </pattern>

      <!-- Hazard Diagonal Stripe Pattern -->
      <pattern id="hazard-stripes" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" stroke-width="4" />
        <line x1="5" y1="0" x2="5" y2="10" stroke="#1e1014" stroke-width="6" />
      </pattern>

      <!-- Gradients -->
      <linearGradient id="body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#19263e" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#0a101d" stop-opacity="0.95" />
      </linearGradient>

      <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0.08" />
      </linearGradient>

      <linearGradient id="box-grad-green" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(34, 197, 94, 0.45)" />
        <stop offset="100%" stop-color="rgba(34, 197, 94, 0.15)" />
      </linearGradient>

      <linearGradient id="box-grad-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(56, 189, 248, 0.5)" />
        <stop offset="100%" stop-color="rgba(56, 189, 248, 0.18)" />
      </linearGradient>

      <linearGradient id="box-grad-red" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(239, 68, 68, 0.4)" />
        <stop offset="100%" stop-color="rgba(239, 68, 68, 0.12)" />
      </linearGradient>

      <!-- Glow Filters -->
      <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#38bdf8" flood-opacity="0.4" />
      </filter>
      <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#22c55e" flood-opacity="0.4" />
      </filter>
    </defs>

    <!-- Canvas Background & Grid -->
    <rect width="600" height="270" fill="#070c18" />
    <rect width="600" height="270" fill="url(#grid-side)" />

    <!-- Corner Blueprint Crop Marks -->
    <path d="M 10 20 L 20 20 M 20 10 L 20 20" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 590 20 L 580 20 M 580 10 L 580 20" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 10 250 L 20 250 M 20 260 L 20 250" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 590 250 L 580 250 M 580 260 L 580 250" stroke="#2a3c5a" stroke-width="1.5" />

    <!-- Ground Level & Measurement Guide -->
    <line x1="25" y1="230" x2="575" y2="230" stroke="#1e2c47" stroke-width="2" />
    <line x1="25" y1="235" x2="575" y2="235" stroke="#121b2d" stroke-dasharray="3,3" stroke-width="1" />

    <!-- Vehicle Body Aerodynamic Silhouette Shell -->
    <path d="M 45 205 
             C 45 190, 52 170, 70 162 
             C 85 155, 115 152, 145 145
             C 175 138, 205 110, 230 76
             C 248 52, 280 48, 330 48 
             L 420 48 
             C 445 48, 470 54, 492 76 
             L ${glassTopX + 38} ${roofY - 14} 
             C ${rearSillX + 22} 135, ${rearSillX + 24} 165, ${rearSillX + 20} 205 Z" 
          fill="url(#body-grad)" stroke="#223656" stroke-width="2" />

    <!-- Aerodynamic Roof Rail Accent -->
    <path d="M 290 44 L 435 44" stroke="#334b73" stroke-width="3" stroke-linecap="round" />
    <line x1="305" y1="44" x2="305" y2="48" stroke="#334b73" stroke-width="2" />
    <line x1="420" y1="44" x2="420" y2="48" stroke="#334b73" stroke-width="2" />

    <!-- Tinted Cabin Greenhouse & Window Frames -->
    <path d="M 234 80 
             L 325 56 
             L 416 56 
             L 472 80 
             L ${glassTopX + 26} ${roofY - 6} 
             L 234 80 Z" 
          fill="url(#glass-grad)" stroke="#223656" stroke-width="1.5" />
    <!-- B-Pillar & C-Pillar Dividers -->
    <line x1="328" y1="56" x2="328" y2="120" stroke="#111c2e" stroke-width="5" />
    <line x1="418" y1="56" x2="418" y2="120" stroke="#111c2e" stroke-width="5" />

    <!-- Wheels & Suspension -->
    <!-- Front Wheel -->
    <circle cx="118" cy="208" r="28" fill="#060a12" stroke="#1c2d47" stroke-width="3" />
    <circle cx="118" cy="208" r="18" fill="#0c1322" stroke="#38bdf8" stroke-width="1" stroke-dasharray="6,3" />
    <circle cx="118" cy="208" r="8" fill="#1c2d47" />
    <!-- Rear Wheel -->
    <circle cx="452" cy="208" r="28" fill="#060a12" stroke="#1c2d47" stroke-width="3" />
    <circle cx="452" cy="208" r="18" fill="#0c1322" stroke="#38bdf8" stroke-width="1" stroke-dasharray="6,3" />
    <circle cx="452" cy="208" r="8" fill="#1c2d47" />

    <!-- Modern LED Headlight & Tail Light Signatures -->
    <path d="M 47 165 L 75 160 L 68 172 Z" fill="#38bdf8" opacity="0.85" filter="url(#glow-cyan)" />
    <path d="M ${rearSillX + 20} 145 L ${rearSillX + 6} 148 L ${rearSillX + 8} 160 Z" fill="#ef4444" opacity="0.9" />

    <!-- Cargo Compartment Floor (Reinforced Beam Graphic) -->
    <line x1="${seatFrontX}" y1="${floorY}" x2="${rearSillX}" y2="${floorY}" stroke="#38bdf8" stroke-width="3" />
    <line x1="${seatFrontX}" y1="${floorY + 2}" x2="${rearSillX}" y2="${floorY + 2}" stroke="#0369a1" stroke-width="1" />
    
    <!-- Floor Length CAD Dimension Callout -->
    <line x1="${seatFrontX}" y1="${floorY + 16}" x2="${rearSillX}" y2="${floorY + 16}" stroke="#64748b" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <line x1="${seatFrontX}" y1="${floorY + 8}" x2="${seatFrontX}" y2="${floorY + 22}" stroke="#64748b" stroke-width="1" />
    <line x1="${rearSillX}" y1="${floorY + 8}" x2="${rearSillX}" y2="${floorY + 22}" stroke="#64748b" stroke-width="1" />
    <text x="${seatFrontX + (floorLenPx / 2)}" y="${floorY + 28}" fill="#94a3b8" font-size="10" font-family="ui-monospace, monospace" font-weight="700" text-anchor="middle">
      FLOOR ${floorLength} cm
    </text>

    <!-- Interior Roofline Ceiling Limit -->
    <line x1="${seatFrontX}" y1="${roofY}" x2="${glassTopX}" y2="${roofY}" stroke="#334b73" stroke-dasharray="4,4" stroke-width="1.5" />

    <!-- Raked Tailgate Window Clearance Vector -->
    <line x1="${rearSillX}" y1="${floorY}" x2="${glassTopX}" y2="${roofY}" stroke="#38bdf8" stroke-dasharray="4,3" stroke-width="2" />

    <!-- Seats Geometry Graphic -->
    ${seatGraphics}

    <!-- Cargo Object Payload Render -->
    ${cargoMarkup}
  `;
}

function renderRearSvg(rot, archWidth, roofHeight, apWidth, apHeight, isArchColliding) {
  const svgW = 420;
  const centerX = svgW / 2;
  const floorY = 205;
  const scale = 1.45;

  const archWPx = archWidth * scale;
  const apWPx = apWidth * scale;
  const apHPx = apHeight * scale;

  const boxWPx = rot.w * scale;
  const boxHPx = rot.h * scale;
  const boxLeftX = centerX - (boxWPx / 2);

  const boxStroke = isArchColliding ? '#ef4444' : '#22c55e';
  const boxFill = isArchColliding ? 'url(#box-rear-red)' : 'url(#box-rear-green)';
  const boxGlow = isArchColliding ? '' : 'filter="url(#glow-green)"';

  rearSvg.innerHTML = `
    <defs>
      <!-- Blueprint Grid -->
      <pattern id="grid-rear" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#162032" stroke-width="0.8" />
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1c2c46" stroke-width="1.2" />
      </pattern>

      <linearGradient id="body-rear-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#141f33" />
        <stop offset="100%" stop-color="#090f1b" />
      </linearGradient>

      <linearGradient id="box-rear-green" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(34, 197, 94, 0.45)" />
        <stop offset="100%" stop-color="rgba(34, 197, 94, 0.15)" />
      </linearGradient>

      <linearGradient id="box-rear-red" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(239, 68, 68, 0.45)" />
        <stop offset="100%" stop-color="rgba(239, 68, 68, 0.15)" />
      </linearGradient>

      <linearGradient id="rear-lightbar" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ef4444" />
        <stop offset="25%" stop-color="#dc2626" />
        <stop offset="50%" stop-color="#f87171" />
        <stop offset="75%" stop-color="#dc2626" />
        <stop offset="100%" stop-color="#ef4444" />
      </linearGradient>
    </defs>

    <!-- Canvas Background & Grid -->
    <rect width="420" height="270" fill="#070c18" />
    <rect width="420" height="270" fill="url(#grid-rear)" />

    <!-- Corner Blueprint Crop Marks -->
    <path d="M 10 20 L 20 20 M 20 10 L 20 20" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 410 20 L 400 20 M 400 10 L 400 20" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 10 250 L 20 250 M 20 260 L 20 250" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 410 250 L 400 250 M 400 260 L 400 250" stroke="#2a3c5a" stroke-width="1.5" />

    <!-- Ground Level -->
    <line x1="30" y1="230" x2="390" y2="230" stroke="#1e2c47" stroke-width="2" />

    <!-- Wide Rear Tires -->
    <rect x="${centerX - (apWPx / 2) - 34}" y="172" width="30" height="52" rx="5" fill="#070c16" stroke="#1e2c47" stroke-width="2.5" />
    <rect x="${centerX + (apWPx / 2) + 4}" y="172" width="30" height="52" rx="5" fill="#070c16" stroke="#1e2c47" stroke-width="2.5" />

    <!-- Vehicle Rear Body Stance -->
    <path d="M ${centerX - (apWPx / 2) - 26} 210 
             L ${centerX - (apWPx / 2) - 22} 110 
             Q ${centerX - (apWPx / 2)} 42 ${centerX} 42 
             Q ${centerX + (apWPx / 2)} 42 ${centerX + (apWPx / 2) + 22} 110 
             L ${centerX + (apWPx / 2) + 26} 210 Z" 
          fill="url(#body-rear-grad)" stroke="#223656" stroke-width="2" />

    <!-- Roof Shark Fin Antenna -->
    <path d="M ${centerX - 3} 42 L ${centerX} 28 L ${centerX + 5} 42 Z" fill="#1e2d47" stroke="#334b73" stroke-width="1.5" />

    <!-- Rear Window & Defroster Lines -->
    <path d="M ${centerX - (apWPx / 2) - 10} 102 
             Q ${centerX - (apWPx / 2) + 8} 54 ${centerX} 54 
             Q ${centerX + (apWPx / 2) - 8} 54 ${centerX + (apWPx / 2) + 10} 102 Z" 
          fill="url(#glass-grad)" stroke="#223656" stroke-width="1.5" />
    <line x1="${centerX - (apWPx / 2) + 8}" y1="68" x2="${centerX + (apWPx / 2) - 8}" y2="68" stroke="rgba(56, 189, 248, 0.2)" stroke-width="1" />
    <line x1="${centerX - (apWPx / 2) + 2}" y1="82" x2="${centerX + (apWPx / 2) - 2}" y2="82" stroke="rgba(56, 189, 248, 0.2)" stroke-width="1" />

    <!-- Modern Coast-to-Coast LED Lightbar -->
    <rect x="${centerX - (apWPx / 2) - 16}" y="104" width="${apWPx + 32}" height="10" rx="3" fill="url(#rear-lightbar)" opacity="0.9" />

    <!-- Rear Aperture Trunk Opening Frame -->
    <rect x="${centerX - (apWPx / 2)}" y="${floorY - apHPx}" width="${apWPx}" height="${apHPx}" 
          fill="#070c18" stroke="#334b73" stroke-dasharray="5,4" stroke-width="1.8" rx="8" />

    <!-- Left & Right Wheel Arch Intrusions -->
    <path d="M ${centerX - (apWPx / 2)} ${floorY} 
             L ${centerX - (archWPx / 2)} ${floorY} 
             C ${centerX - (archWPx / 2) + 8} ${floorY - 26}, ${centerX - (archWPx / 2) - 2} ${floorY - 44}, ${centerX - (apWPx / 2)} ${floorY - 46} Z" 
          fill="#111c2e" stroke="#38bdf8" stroke-width="1.8" />

    <path d="M ${centerX + (apWPx / 2)} ${floorY} 
             L ${centerX + (archWPx / 2)} ${floorY} 
             C ${centerX + (archWPx / 2) - 8} ${floorY - 26}, ${centerX + (archWPx / 2) + 2} ${floorY - 44}, ${centerX + (apWPx / 2)} ${floorY - 46} Z" 
          fill="#111c2e" stroke="#38bdf8" stroke-width="1.8" />

    <!-- CAD Wheel Arch Width Dimension Callout -->
    <line x1="${centerX - (archWPx / 2)}" y1="${floorY + 16}" x2="${centerX + (archWPx / 2)}" y2="${floorY + 16}" stroke="#64748b" stroke-width="1" />
    <line x1="${centerX - (archWPx / 2)}" y1="${floorY + 8}" x2="${centerX - (archWPx / 2)}" y2="${floorY + 22}" stroke="#64748b" stroke-width="1" />
    <line x1="${centerX + (archWPx / 2)}" y1="${floorY + 8}" x2="${centerX + (archWPx / 2)}" y2="${floorY + 22}" stroke="#64748b" stroke-width="1" />
    <text x="${centerX}" y="${floorY + 28}" fill="#94a3b8" font-size="10" font-family="ui-monospace, monospace" font-weight="700" text-anchor="middle">
      ARCHES ${archWidth} cm
    </text>

    <!-- Cargo Box Payload -->
    <rect x="${boxLeftX}" y="${floorY - boxHPx}" width="${boxWPx}" height="${boxHPx}" 
          fill="${boxFill}" stroke="${boxStroke}" stroke-width="2" rx="4" ${boxGlow} />

    <!-- Center Package Label -->
    <text x="${centerX}" y="${floorY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
      ${rot.w} × ${rot.h} cm
    </text>

    <!-- Wheel Arch Collision Reticles if Overlapping -->
    ${isArchColliding ? `
      <circle cx="${centerX - (archWPx / 2)}" cy="${floorY - (boxHPx / 2)}" r="6" fill="#ef4444" />
      <circle cx="${centerX + (archWPx / 2)}" cy="${floorY - (boxHPx / 2)}" r="6" fill="#ef4444" />
    ` : ''}
  `;
}

document.addEventListener('DOMContentLoaded', init);