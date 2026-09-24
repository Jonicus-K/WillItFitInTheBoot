/**
 * Will It Fit In The Boot?
 * Pure client-side spatial rotation, 4-gate constraint, dual angled solver,
 * interactive Three.js 3D Studio, and CAD 2D blueprints.
 */

const defaultCars = [
  {
    id: "vw-golf-mk8",
    name: "Volkswagen Golf (Mk8, 2020+)",
    body_type: "hatchback",
    overall_length: 428,
    overall_width: 179,
    overall_height: 145,
    wheelbase: 263,
    floor_length_seats_folded: 140,
    floor_length_seats_up: 77,
    wheel_arch_width: 100,
    roof_height: 71,
    aperture_width: 102,
    aperture_height: 67,
    rake_angle_deg: 29.4
  },
  {
    id: "vauxhall-corsa-f",
    name: "Vauxhall Corsa (F, 2019+)",
    body_type: "hatchback",
    overall_length: 406,
    overall_width: 176,
    overall_height: 143,
    wheelbase: 254,
    floor_length_seats_folded: 125,
    floor_length_seats_up: 66,
    wheel_arch_width: 96,
    roof_height: 68,
    aperture_width: 95,
    aperture_height: 62,
    rake_angle_deg: 32.0
  },
  {
    id: "ford-focus-estate",
    name: "Ford Focus Estate (Mk4, 2018+)",
    body_type: "estate",
    overall_length: 467,
    overall_width: 182,
    overall_height: 148,
    wheelbase: 270,
    floor_length_seats_folded: 175,
    floor_length_seats_up: 104,
    wheel_arch_width: 115,
    roof_height: 78,
    aperture_width: 108,
    aperture_height: 75,
    rake_angle_deg: 18.0
  },
  {
    id: "skoda-octavia-estate",
    name: "Škoda Octavia Estate (Mk4, 2020+)",
    body_type: "estate",
    overall_length: 469,
    overall_width: 183,
    overall_height: 147,
    wheelbase: 268,
    floor_length_seats_folded: 188,
    floor_length_seats_up: 109,
    wheel_arch_width: 101,
    roof_height: 82,
    aperture_width: 107,
    aperture_height: 78,
    rake_angle_deg: 16.5
  },
  {
    id: "nissan-qashqai-mk3",
    name: "Nissan Qashqai (Mk3, 2021+)",
    body_type: "suv",
    overall_length: 442,
    overall_width: 184,
    overall_height: 162,
    wheelbase: 266,
    floor_length_seats_folded: 153,
    floor_length_seats_up: 86,
    wheel_arch_width: 105,
    roof_height: 80,
    aperture_width: 108,
    aperture_height: 75,
    rake_angle_deg: 26.5
  },
  {
    id: "tesla-model-y",
    name: "Tesla Model Y (2021+)",
    body_type: "suv",
    overall_length: 475,
    overall_width: 192,
    overall_height: 162,
    wheelbase: 289,
    floor_length_seats_folded: 195,
    floor_length_seats_up: 108,
    wheel_arch_width: 95,
    roof_height: 72,
    aperture_width: 106,
    aperture_height: 70,
    rake_angle_deg: 35.0
  },
  {
    id: "bmw-3-series-saloon",
    name: "BMW 3 Series Saloon (G20, 2019+)",
    body_type: "saloon",
    overall_length: 471,
    overall_width: 183,
    overall_height: 144,
    wheelbase: 285,
    floor_length_seats_folded: 170,
    floor_length_seats_up: 100,
    wheel_arch_width: 94,
    roof_height: 52,
    aperture_width: 90,
    aperture_height: 48,
    rake_angle_deg: 48.0
  },
  {
    id: "audi-a4-saloon",
    name: "Audi A4 Saloon (B9, 2019+)",
    body_type: "saloon",
    overall_length: 476,
    overall_width: 184,
    overall_height: 143,
    wheelbase: 282,
    floor_length_seats_folded: 168,
    floor_length_seats_up: 98,
    wheel_arch_width: 95,
    roof_height: 53,
    aperture_width: 92,
    aperture_height: 49,
    rake_angle_deg: 46.5
  }
];

let vehicles = [];
let selectedCar = null;
let lastFitResult = null;
let xRayMode = 0.70; // 0.70 (Sleek CAD Cutaway) or 1.0 (Solid Showroom Paint)
let isTailgateOpen = true;
let currentTailgateAngle = 1.08;
let targetTailgateAngle = 1.08;
let tailgatePivot = null;

// DOM Elements
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
const hudBodyType = document.getElementById('hud-body-type');

const presetButtons = document.querySelectorAll('.preset-btn');
const tabBtn3d = document.getElementById('tab-btn-3d');
const tabBtn2d = document.getElementById('tab-btn-2d');
const view3dContainer = document.getElementById('view-3d-container');
const view2dContainer = document.getElementById('view-2d-container');
const camButtons = document.querySelectorAll('.cam-btn[data-view]');
const btnXRayToggle = document.getElementById('btn-xray-toggle');

// Three.js State
let scene, camera, renderer, controls;
let car3DGroup = null;
let cargo3DMesh = null;

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

  const rawBody = String(raw.body_type || raw.bodyType || raw.type || raw.style || '').toLowerCase();
  let body_type = 'hatchback';
  if (rawBody.includes('estate') || rawBody.includes('wagon') || rawBody.includes('touring') || rawBody.includes('avant')) {
    body_type = 'estate';
  } else if (rawBody.includes('suv') || rawBody.includes('crossover') || rawBody.includes('4x4')) {
    body_type = 'suv';
  } else if (rawBody.includes('saloon') || rawBody.includes('sedan')) {
    body_type = 'saloon';
  }

  const floorFolded = extractNumber(raw, [
    'floor_length_seats_folded', 'floorlengthseatsfolded', 'seats_folded_length', 'seatsfoldedlength',
    'folded_length', 'foldedlength', 'seats_down_length', 'seatsdownlength', 'boot_length_folded',
    'bootlengthfolded', 'max_cargo_length', 'maxlength', 'length_folded'
  ], 140);

  const floorUp = extractNumber(raw, [
    'floor_length_seats_up', 'floorlengthseatsup', 'seats_up_length', 'seatsuplength',
    'floor_length_standard', 'floorlengthstandard', 'floor_length', 'floorlength',
    'boot_length', 'bootlength', 'standard_length', 'min_length', 'minlength', 'length'
  ], 77);

  const overallLength = extractNumber(raw, ['overall_length', 'overalllength', 'car_length', 'total_length'], Math.max(420, floorFolded + 270));
  const overallWidth = extractNumber(raw, ['overall_width', 'overallwidth', 'car_width', 'total_width'], 180);
  const overallHeight = extractNumber(raw, ['overall_height', 'overallheight', 'car_height', 'total_height'], 146);
  const wheelbase = extractNumber(raw, ['wheelbase', 'wheel_base'], 265);

  const archWidth = extractNumber(raw, [
    'wheel_arch_width', 'wheelarchwidth', 'width_between_arches', 'widthbetweenwheelarches',
    'arch_width', 'archwidth', 'min_width', 'minwidth', 'boot_width', 'bootwidth', 'cargo_width', 'width'
  ], 100);

  const roofHeight = extractNumber(raw, [
    'roof_height', 'roofheight', 'interior_height', 'interiorheight',
    'boot_height', 'bootheight', 'cargo_height', 'max_height', 'height'
  ], 71);

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
  ], 29.4);

  return {
    id,
    name,
    body_type,
    overall_length: overallLength,
    overall_width: overallWidth,
    overall_height: overallHeight,
    wheelbase: wheelbase,
    floor_length_seats_folded: floorFolded,
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
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const rawData = await res.json();
    let carArray = [];

    if (Array.isArray(rawData)) carArray = rawData;
    else if (rawData && Array.isArray(rawData.cars)) carArray = rawData.cars;
    else if (rawData && Array.isArray(rawData.vehicles)) carArray = rawData.vehicles;
    else if (rawData && typeof rawData === 'object') carArray = Object.keys(rawData).map(k => ({ id: k, ...rawData[k] }));

    vehicles = carArray.map((car, idx) => normalizeCar(car, idx));
  } catch (err) {
    console.warn('Using built-in vehicle registry:', err);
    vehicles = defaultCars.map((car, idx) => normalizeCar(car, idx));
  }

  if (!vehicles || vehicles.length === 0) {
    vehicles = defaultCars.map((car, idx) => normalizeCar(car, idx));
  }

  carSelect.innerHTML = vehicles
    .map((car, idx) => `<option value="${idx}" ${idx === 0 ? 'selected' : ''}>${car.name}</option>`)
    .join('');

  selectedCar = vehicles[0];
  initThreeStudio();
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
    } else {
      selectedCar = vehicles[0];
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

  tabBtn3d.addEventListener('click', () => {
    tabBtn3d.classList.add('active');
    tabBtn2d.classList.remove('active');
    view3dContainer.classList.add('active');
    view2dContainer.classList.remove('active');
    onWindowResize();
  });

  tabBtn2d.addEventListener('click', () => {
    tabBtn2d.classList.add('active');
    tabBtn3d.classList.remove('active');
    view2dContainer.classList.add('active');
    view3dContainer.classList.remove('active');
  });

  camButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      camButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      snapCamera(btn.dataset.view);
    });
  });

  if (btnXRayToggle) {
    btnXRayToggle.addEventListener('click', () => {
      xRayMode = xRayMode < 0.85 ? 1.0 : 0.70;
      btnXRayToggle.textContent = xRayMode < 0.85 ? 'CAD Cutaway' : 'Solid Paint';
      if (selectedCar && lastFitResult) {
        update3DStudio(selectedCar, foldSeatsCheckbox.checked, lastFitResult);
      }
    });
  }

  const btnBootToggle = document.getElementById('btn-boot-toggle');
  if (btnBootToggle) {
    btnBootToggle.addEventListener('click', () => {
      isTailgateOpen = !isTailgateOpen;
      btnBootToggle.classList.toggle('active', isTailgateOpen);
      btnBootToggle.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align: -1px; margin-right: 3px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        Boot: ${isTailgateOpen ? 'Open' : 'Closed'}
      `;
      targetTailgateAngle = isTailgateOpen ? getOpenTailgateAngle(selectedCar ? selectedCar.body_type : 'hatchback') : 0;
    });
  }

  window.addEventListener('resize', onWindowResize);
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
  hudBodyType.textContent = selectedCar.body_type.toUpperCase();

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

    lastFitResult = { mode: 'flat', rot: bestFlatFit.rot, angle: 0, status: isComfortable ? 'comfortable' : 'tight' };
    renderSideSvg(bestFlatFit.rot, floorLength, roofHeight, tanRake, 'flat', 0, seatsFolded, selectedCar);
    renderRearSvg(bestFlatFit.rot, archWidth, roofHeight, apWidth, apHeight, false, selectedCar.body_type);
    update3DStudio(selectedCar, seatsFolded, lastFitResult);
    return;
  }

  // Gate 2: Angled Pitch Solver (Front propped up onto folded seatbacks to bypass hatch rake)
  let bestPitchFit = null;

  for (const rot of rotations) {
    if (rot.w > archWidth || rot.w > apWidth) continue;

    for (let deg = 2; deg <= 30; deg++) {
      const rad = (deg * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      const topFrontH = (rot.l * sinA) + (rot.h * cosA);
      if (topFrontH > roofHeight) continue;

      const horizSpan = rot.l * cosA;
      const maxAllowedSpan = seatsFolded ? (floorLength + 10) : floorLength;

      if (horizSpan <= maxAllowedSpan) {
        bestPitchFit = {
          rot,
          angle: deg,
          topFrontH,
          horizSpan
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

    for (let deg = 2; deg <= 35; deg++) {
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
    resultExplanation.textContent = `Hits rear window if laid flat, but fits by propping the front edge up onto the seatback (~${bestPitchFit.angle}° tilt), pulling the rear face clear of the glass.`;

    sideBadge.className = 'badge badge-angled';
    sideBadge.textContent = `Tilted ~${bestPitchFit.angle}°`;
    rearBadge.className = 'badge badge-clears';
    rearBadge.textContent = 'Clears';

    lastFitResult = { mode: 'pitch', rot: bestPitchFit.rot, angle: bestPitchFit.angle, status: 'angled' };
    renderSideSvg(bestPitchFit.rot, floorLength, roofHeight, tanRake, 'pitch', bestPitchFit.angle, seatsFolded, selectedCar);
    renderRearSvg(bestPitchFit.rot, archWidth, roofHeight, apWidth, apHeight, false, selectedCar.body_type);
    update3DStudio(selectedCar, seatsFolded, lastFitResult);
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

    lastFitResult = { mode: 'yaw', rot: bestYawFit.rot, angle: bestYawFit.angle, status: 'angled' };
    renderSideSvg(bestYawFit.rot, floorLength, roofHeight, tanRake, 'yaw', bestYawFit.angle, seatsFolded, selectedCar);
    renderRearSvg(bestYawFit.rot, archWidth, roofHeight, apWidth, apHeight, false, selectedCar.body_type);
    update3DStudio(selectedCar, seatsFolded, lastFitResult);
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

  lastFitResult = { mode: 'colliding', rot: { l: rawL, w: rawW, h: rawH }, angle: 0, status: 'colliding' };
  renderSideSvg({ l: rawL, w: rawW, h: rawH }, floorLength, roofHeight, tanRake, 'colliding', 0, seatsFolded, selectedCar);
  renderRearSvg({ l: rawL, w: rawW, h: rawH }, archWidth, roofHeight, apWidth, apHeight, rawW > archWidth, selectedCar.body_type);
  update3DStudio(selectedCar, seatsFolded, lastFitResult);
}

/* ==========================================================================
   THREE.JS 3D INTERACTIVE STUDIO (High-Fidelity CAD Cutaway Models)
   ========================================================================== */

let fallbackOrbit = {
  isDragging: false,
  prevX: 0,
  prevY: 0,
  radius: 270,
  theta: 0.85,
  phi: 1.18
};

function getOpenTailgateAngle(bodyType) {
  if (bodyType === 'saloon') return 0.95;
  if (bodyType === 'estate') return 1.15;
  if (bodyType === 'suv') return 1.10;
  return 1.08;
}

function initThreeStudio() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const width = canvas.parentElement.clientWidth || 600;
  const height = canvas.parentElement.clientHeight || 480;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060a14);

  camera = new THREE.PerspectiveCamera(36, width / height, 1, 5000);
  camera.position.set(165, 110, 145);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = (Math.PI / 2) + 0.04;
    controls.minDistance = 70;
    controls.maxDistance = 600;
    controls.target.set(-50, 38, 0);
  } else {
    initFallbackControls(canvas);
  }

  // Studio Lighting (Automotive Stage Setup)
  const ambientLight = new THREE.AmbientLight(0x384a6b, 1.8);
  scene.add(ambientLight);

  const keySun = new THREE.DirectionalLight(0xffffff, 2.0);
  keySun.position.set(220, 360, 220);
  scene.add(keySun);

  const fillCyan = new THREE.DirectionalLight(0x38bdf8, 1.2);
  fillCyan.position.set(-220, 180, -220);
  scene.add(fillCyan);

  const rearHighlight = new THREE.DirectionalLight(0x60a5fa, 1.0);
  rearHighlight.position.set(260, 120, 0);
  scene.add(rearHighlight);

  const bootInteriorLight = new THREE.PointLight(0xbae6fd, 1.2, 240);
  bootInteriorLight.position.set(20, 85, 0);
  scene.add(bootInteriorLight);

  const grid = new THREE.GridHelper(800, 40, 0x1e3a5f, 0x0c1729);
  grid.position.y = -0.5;
  scene.add(grid);

  animateThree();
}

function initFallbackControls(canvas) {
  canvas.addEventListener('mousedown', (e) => {
    fallbackOrbit.isDragging = true;
    fallbackOrbit.prevX = e.clientX;
    fallbackOrbit.prevY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    fallbackOrbit.isDragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!fallbackOrbit.isDragging) return;
    const deltaX = e.clientX - fallbackOrbit.prevX;
    const deltaY = e.clientY - fallbackOrbit.prevY;
    fallbackOrbit.prevX = e.clientX;
    fallbackOrbit.prevY = e.clientY;

    fallbackOrbit.theta -= deltaX * 0.008;
    fallbackOrbit.phi = Math.max(0.08, Math.min(Math.PI / 2, fallbackOrbit.phi - deltaY * 0.008));
    updateCameraFromSpherical();
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    fallbackOrbit.radius = Math.max(70, Math.min(500, fallbackOrbit.radius + e.deltaY * 0.3));
    updateCameraFromSpherical();
  }, { passive: false });
}

function updateCameraFromSpherical() {
  if (!camera) return;
  const sinPhi = Math.sin(fallbackOrbit.phi);
  const cosPhi = Math.cos(fallbackOrbit.phi);
  const sinTheta = Math.sin(fallbackOrbit.theta);
  const cosTheta = Math.cos(fallbackOrbit.theta);

  const targetX = -50;
  const targetY = 38;
  const targetZ = 0;
  camera.position.x = targetX + (fallbackOrbit.radius * sinPhi * cosTheta);
  camera.position.y = targetY + (fallbackOrbit.radius * cosPhi);
  camera.position.z = targetZ + (fallbackOrbit.radius * sinPhi * sinTheta);
  camera.lookAt(targetX, targetY, targetZ);
}

function animateThree() {
  requestAnimationFrame(animateThree);
  if (tailgatePivot) {
    currentTailgateAngle += (targetTailgateAngle - currentTailgateAngle) * 0.12;
    tailgatePivot.rotation.z = currentTailgateAngle;
  }
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function onWindowResize() {
  if (!renderer || !camera) return;
  const canvas = document.getElementById('three-canvas');
  if (!canvas || !canvas.parentElement) return;

  const width = canvas.parentElement.clientWidth;
  const height = canvas.parentElement.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function snapCamera(view) {
  if (!camera) return;

  const targetCenter = new THREE.Vector3(-50, 38, 0);

  if (view === 'side') {
    fallbackOrbit.theta = Math.PI / 2;
    fallbackOrbit.phi = 1.48;
  } else if (view === 'rear') {
    fallbackOrbit.theta = 0;
    fallbackOrbit.phi = 1.48;
  } else if (view === 'top') {
    fallbackOrbit.theta = 0;
    fallbackOrbit.phi = 0.05;
  } else {
    fallbackOrbit.theta = 0.85;
    fallbackOrbit.phi = 1.18;
  }

  if (controls) {
    if (view === 'side') camera.position.set(-50, 42, 310);
    else if (view === 'rear') camera.position.set(230, 45, 0);
    else if (view === 'top') camera.position.set(-50, 360, 0);
    else camera.position.set(165, 110, 145);
    controls.target.copy(targetCenter);
    controls.update();
  } else {
    updateCameraFromSpherical();
  }
}

/**
 * Procedural Realistic 3D Wheel Assembly
 */
function createWheel3D(radius = 30, width = 22) {
  const wheelGroup = new THREE.Group();

  // Rubber Tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 32);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111622,
    roughness: 0.85,
    metalness: 0.1
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.rotation.x = Math.PI / 2;
  wheelGroup.add(tire);

  // Outer Silver Rim Lip
  const rimRingGeo = new THREE.TorusGeometry(radius * 0.72, 2.5, 16, 32);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd8e1ed,
    metalness: 0.95,
    roughness: 0.15
  });
  const rimRing = new THREE.Mesh(rimRingGeo, rimMat);
  wheelGroup.add(rimRing);

  // 5-Spoke Split Star Alloy Design
  const spokeGeo = new THREE.BoxGeometry(3.5, radius * 1.35, 3.5);
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.rotation.z = (i * Math.PI) / 2.5;
    wheelGroup.add(spoke);
  }

  // Steel Brake Rotor Disc
  const discGeo = new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, 2, 24);
  const discMat = new THREE.MeshStandardMaterial({ color: 0x8896a6, metalness: 0.92, roughness: 0.22 });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = Math.PI / 2;
  wheelGroup.add(disc);

  // Sport Red Caliper
  const caliperGeo = new THREE.BoxGeometry(8, 14, 5);
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(radius * 0.38, radius * 0.25, 0);
  wheelGroup.add(caliper);

  return wheelGroup;
}

/**
 * Creates front bucket seats with realistic contours and headrests.
 */
function createSeat3D(width = 44, backHeight = 42) {
  const seatGroup = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x121b2b, roughness: 0.8 });

  const cushionGeo = new THREE.BoxGeometry(38, 8, width);
  const cushion = new THREE.Mesh(cushionGeo, seatMat);
  cushion.position.y = 4;
  seatGroup.add(cushion);

  const backGeo = new THREE.BoxGeometry(10, backHeight, width - 4);
  const back = new THREE.Mesh(backGeo, seatMat);
  back.position.set(13, (backHeight / 2) + 4, 0);
  back.rotation.z = 0.1;
  seatGroup.add(back);

  const headrestGeo = new THREE.BoxGeometry(8, 11, 18);
  const headrest = new THREE.Mesh(headrestGeo, seatMat);
  headrest.position.set(17, backHeight + 11, 0);
  seatGroup.add(headrest);

  return seatGroup;
}

/**
 * Creates a rounded semi-cylindrical wheel arch tub for the interior cargo bay.
 */
function createRoundedWheelArchTub(radius = 28, depth = 16) {
  const tubGeo = new THREE.CylinderGeometry(radius, radius, depth, 24, 1, false, 0, Math.PI);
  const tubMat = new THREE.MeshStandardMaterial({
    color: 0x152238,
    roughness: 0.75,
    metalness: 0.2,
    side: THREE.DoubleSide
  });
  const tubMesh = new THREE.Mesh(tubGeo, tubMat);
  tubMesh.rotation.z = Math.PI / 2; // Curve points UP
  tubMesh.rotation.y = Math.PI / 2; // Aligned with car length
  return tubMesh;
}

/**
 * Helper to add precision CAD edge highlight lines to a mesh
 */
function addCadEdges(mesh, color = 0x38bdf8, thresholdAngle = 26) {
  if (!mesh || !mesh.geometry) return;
  const edges = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.45
  }));
  mesh.add(line);
}

/**
 * Main 3D Studio Update: Generates 1:1 scale parametric CAD vehicle chassis,
 * authentic wheel arches, hollow interior cabin, toggleable tailgate, and cargo fitment.
 */
function update3DStudio(car, seatsFolded, fitResult) {
  if (!scene) return;

  if (car3DGroup) scene.remove(car3DGroup);
  if (cargo3DMesh) scene.remove(cargo3DMesh);

  car3DGroup = new THREE.Group();

  const totalLength = car.overall_length;
  const totalCarWidth = car.overall_width;
  const cabinWidth = totalCarWidth * 0.82;
  const archW = car.wheel_arch_width;
  const roofH = car.roof_height;
  const bodyType = car.body_type;
  const currentFloorLen = seatsFolded ? car.floor_length_seats_folded : car.floor_length_seats_up;

  const isSUV = bodyType === 'suv';
  const isSaloon = bodyType === 'saloon';
  const isEstate = bodyType === 'estate';
  const isHatch = bodyType === 'hatchback';

  const groundY = 0;
  const sillY = isSUV ? 58 : 46;
  const cabinFloorY = sillY - 14;
  const wheelRadius = isSUV ? 35 : (isHatch ? 30 : 31);
  const wheelArchR = wheelRadius + 4.5;
  const wheelY = wheelRadius;

  // FIXED VEHICLE DATUM: Rear bumper is at +X, front nose is at -X
  const rearBumperX = 70;
  const rearSillX = rearBumperX - 22; // rear sill load threshold
  const carFrontX = rearBumperX - totalLength;

  // Accurate wheelbase from vehicle specifications!
  const rearWheelX = rearSillX - 38;
  const frontWheelX = rearWheelX - car.wheelbase;
  const frontSeatsX = rearSillX - car.floor_length_seats_folded - 26;

  // Key vertical & longitudinal datum
  const beltY = sillY + 22;
  const roofTopY = car.overall_height;
  const cowlX = frontWheelX + (isSaloon ? 32 : (isEstate ? 26 : (isSUV ? 28 : 22)));
  const cowlY = beltY + 4;
  const roofFrontX = cowlX + 34;

  let roofRearX, deckFrontX;
  if (isSaloon) {
    roofRearX = rearWheelX - 25;
    deckFrontX = rearWheelX + 10;
  } else if (isEstate) {
    roofRearX = rearSillX - 10;
    deckFrontX = rearSillX;
  } else if (isSUV) {
    roofRearX = rearWheelX + 6;
    deckFrontX = rearSillX;
  } else {
    roofRearX = rearWheelX - 4;
    deckFrontX = rearSillX;
  }

  const bPillarX = (roofFrontX + (isSaloon ? deckFrontX : roofRearX)) / 2 - 4;

  // Materials: CAD Cutaway vs Showroom Paint
  const isGhost = xRayMode < 0.85;

  const bodyPaintMat = new THREE.MeshPhysicalMaterial({
    color: 0x142848, // Deep Automotive Royal Navy
    metalness: 0.85,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transparent: isGhost,
    opacity: isGhost ? 0.65 : 1.0,
    depthWrite: true,
    side: THREE.DoubleSide
  });

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x080c14, // Piano black pillars
    roughness: 0.2,
    metalness: 0.6,
    transparent: isGhost,
    opacity: isGhost ? 0.85 : 1.0
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a1829, // Tinted automotive glass
    roughness: 0.08,
    metalness: 0.15,
    transparent: true,
    opacity: isGhost ? 0.26 : 0.45,
    depthWrite: false
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.15
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8
  });

  const headlampMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.8,
    roughness: 0.1
  });

  const taillampMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 2.0,
    roughness: 0.15
  });

  // 1. FOUR WHEELS (Placed accurately using official vehicle wheelbase)
  const wheelZOffset = (totalCarWidth / 2) - 2;
  const wheelPositions = [
    [frontWheelX, wheelY, wheelZOffset],
    [frontWheelX, wheelY, -wheelZOffset],
    [rearWheelX, wheelY, wheelZOffset],
    [rearWheelX, wheelY, -wheelZOffset]
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheel = createWheel3D(wheelRadius, 22);
    wheel.position.set(wx, wy, wz);
    if (wz < 0) wheel.rotation.y = Math.PI;
    car3DGroup.add(wheel);
  });

  // 2. LEFT & RIGHT SIDE FLANKS (Lower body with authentic wheel arches)
  const flankShape = new THREE.Shape();
  flankShape.moveTo(carFrontX, sillY - 12);
  flankShape.lineTo(carFrontX, sillY + 4);
  flankShape.lineTo(carFrontX + 12, beltY - 2);
  flankShape.lineTo(cowlX, beltY);
  if (isSaloon) {
    flankShape.lineTo(deckFrontX, beltY);
    flankShape.lineTo(rearBumperX - 4, beltY - 2);
  } else {
    flankShape.lineTo(rearSillX + 4, beltY);
  }
  flankShape.lineTo(rearBumperX, sillY + 6);
  flankShape.lineTo(rearBumperX, sillY - 14);

  // Underside with Wheel Arch Cutouts (rear to front)
  flankShape.lineTo(rearWheelX + wheelArchR, sillY - 14);
  flankShape.lineTo(rearWheelX + wheelArchR, wheelY);
  flankShape.absarc(rearWheelX, wheelY, wheelArchR, 0, Math.PI, false);
  flankShape.lineTo(rearWheelX - wheelArchR, sillY - 14);

  // Rocker sill between wheels
  flankShape.lineTo(frontWheelX + wheelArchR, sillY - 14);
  flankShape.lineTo(frontWheelX + wheelArchR, wheelY);
  flankShape.absarc(frontWheelX, wheelY, wheelArchR, 0, Math.PI, false);
  flankShape.lineTo(frontWheelX - wheelArchR, sillY - 14);

  // Front chin
  flankShape.lineTo(carFrontX + 8, sillY - 14);
  flankShape.lineTo(carFrontX, sillY - 12);

  const flankExtrude = { depth: 4.5, bevelEnabled: true, bevelSize: 0.8, bevelThickness: 0.8, bevelSegments: 2 };
  const flankGeo = new THREE.ExtrudeGeometry(flankShape, flankExtrude);

  const leftFlank = new THREE.Mesh(flankGeo, bodyPaintMat);
  leftFlank.position.z = (totalCarWidth / 2) - 4.5;
  addCadEdges(leftFlank, 0x38bdf8);
  car3DGroup.add(leftFlank);

  const rightFlank = new THREE.Mesh(flankGeo, bodyPaintMat);
  rightFlank.position.z = -(totalCarWidth / 2);
  addCadEdges(rightFlank, 0x38bdf8);
  car3DGroup.add(rightFlank);

  // 3. GREENHOUSE PILLARS (A-Pillar, Cantrails, B-Pillar, C-Pillar)
  [-wheelZOffset, wheelZOffset - 3].forEach(zPos => {
    // A-Pillar
    const aLen = Math.hypot(roofFrontX - cowlX, roofTopY - beltY);
    const aAngle = Math.atan2(roofTopY - beltY, roofFrontX - cowlX);
    const aPillarGeo = new THREE.BoxGeometry(aLen, 4.5, 3.5);
    const aPillar = new THREE.Mesh(aPillarGeo, bodyPaintMat);
    aPillar.position.set((cowlX + roofFrontX) / 2, (beltY + roofTopY) / 2, zPos + 1.5);
    aPillar.rotation.z = aAngle;
    car3DGroup.add(aPillar);

    // Roof Cantrail
    const cantrailLen = Math.abs(roofRearX - roofFrontX);
    const cantrailGeo = new THREE.BoxGeometry(cantrailLen, 4.0, 3.5);
    const cantrail = new THREE.Mesh(cantrailGeo, bodyPaintMat);
    cantrail.position.set((roofFrontX + roofRearX) / 2, roofTopY - 2, zPos + 1.5);
    car3DGroup.add(cantrail);

    // B-Pillar (Piano Black vertical post)
    const bHeight = roofTopY - beltY - 4;
    const bPillarGeo = new THREE.BoxGeometry(5.5, bHeight, 3.2);
    const bPillar = new THREE.Mesh(bPillarGeo, pillarMat);
    bPillar.position.set(bPillarX, beltY + (bHeight / 2), zPos + 1.5);
    car3DGroup.add(bPillar);

    // C-Pillar
    if (isSaloon) {
      const cLen = Math.hypot(deckFrontX - roofRearX, roofTopY - beltY);
      const cAngle = Math.atan2(roofTopY - beltY, roofRearX - deckFrontX);
      const cPillarGeo = new THREE.BoxGeometry(cLen, 5.0, 3.5);
      const cPillar = new THREE.Mesh(cPillarGeo, bodyPaintMat);
      cPillar.position.set((roofRearX + deckFrontX) / 2, (beltY + roofTopY) / 2, zPos + 1.5);
      cPillar.rotation.z = -cAngle;
      car3DGroup.add(cPillar);
    } else {
      const cLen = Math.hypot(rearSillX - roofRearX, roofTopY - beltY);
      const cAngle = Math.atan2(roofTopY - beltY, roofRearX - rearSillX);
      const cPillarGeo = new THREE.BoxGeometry(cLen, 5.0, 3.5);
      const cPillar = new THREE.Mesh(cPillarGeo, bodyPaintMat);
      cPillar.position.set((roofRearX + rearSillX) / 2, (beltY + roofTopY) / 2, zPos + 1.5);
      cPillar.rotation.z = -cAngle;
      car3DGroup.add(cPillar);
    }

    // Side Door Windows (Tinted Glass)
    const fWinWidth = Math.abs(bPillarX - cowlX) - 5;
    const winHeight = roofTopY - beltY - 6;
    const fWinGeo = new THREE.BoxGeometry(fWinWidth, winHeight, 1.2);
    const fWin = new THREE.Mesh(fWinGeo, glassMat);
    fWin.position.set((cowlX + bPillarX) / 2 + 2, beltY + (winHeight / 2) + 1, zPos + 1.5);
    car3DGroup.add(fWin);

    const rWinEndX = isSaloon ? deckFrontX : roofRearX;
    const rWinWidth = Math.abs(rWinEndX - bPillarX) - 6;
    const rWinGeo = new THREE.BoxGeometry(rWinWidth, winHeight, 1.2);
    const rWin = new THREE.Mesh(rWinGeo, glassMat);
    rWin.position.set((bPillarX + rWinEndX) / 2, beltY + (winHeight / 2) + 1, zPos + 1.5);
    car3DGroup.add(rWin);
  });

  // 4. FRONT BONNET / HOOD & WINDSHIELD
  const hoodLen = Math.abs(cowlX - carFrontX) - 10;
  const hoodSlopeAngle = Math.atan2((beltY + 2) - (sillY + 10), hoodLen);
  const hoodGeo = new THREE.BoxGeometry(hoodLen, 2.5, totalCarWidth - 10);
  const hood = new THREE.Mesh(hoodGeo, bodyPaintMat);
  hood.position.set((cowlX + carFrontX + 10) / 2, (beltY + sillY + 12) / 2, 0);
  hood.rotation.z = -hoodSlopeAngle;
  addCadEdges(hood, 0x38bdf8);
  car3DGroup.add(hood);

  // Front Windshield
  const windLen = Math.hypot(roofFrontX - cowlX, roofTopY - (beltY + 2));
  const windAngle = Math.atan2(roofTopY - (beltY + 2), roofFrontX - cowlX);
  const windGeo = new THREE.BoxGeometry(windLen - 4, 1.8, cabinWidth - 6);
  const windshield = new THREE.Mesh(windGeo, glassMat);
  windshield.position.set((cowlX + roofFrontX) / 2, (beltY + 2 + roofTopY) / 2, 0);
  windshield.rotation.z = windAngle;
  car3DGroup.add(windshield);

  // 5. ROOF PANEL (Metal or Panoramic Glass for Tesla)
  const roofLen = Math.abs(roofRearX - roofFrontX);
  const roofGeo = new THREE.BoxGeometry(roofLen, 2.2, cabinWidth - 4);
  const roofMesh = new THREE.Mesh(roofGeo, (car.id.includes('tesla') ? glassMat : bodyPaintMat));
  roofMesh.position.set((roofFrontX + roofRearX) / 2, roofTopY - 1.1, 0);
  addCadEdges(roofMesh, 0x38bdf8);
  car3DGroup.add(roofMesh);

  // Roof Rails (Estate & SUV)
  if (isEstate || isSUV) {
    [-((cabinWidth / 2) - 1), (cabinWidth / 2) - 1].forEach(rz => {
      const railGeo = new THREE.CylinderGeometry(1.6, 1.6, roofLen + 10, 12);
      const rail = new THREE.Mesh(railGeo, chromeMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.set((roofFrontX + roofRearX) / 2, roofTopY + 3.2, rz);
      car3DGroup.add(rail);

      // Mount stanchions
      [-0.4, 0, 0.4].forEach(offsetPct => {
        const postGeo = new THREE.BoxGeometry(3, 3.5, 2.5);
        const post = new THREE.Mesh(postGeo, chromeMat);
        post.position.set((roofFrontX + roofRearX) / 2 + (roofLen * offsetPct), roofTopY + 1.5, rz);
        car3DGroup.add(post);
      });
    });
  }

  // 6. FRONT FASCIA & BRAND-SPECIFIC GRILLE
  const frontBumperGeo = new THREE.BoxGeometry(8, 22, totalCarWidth - 4);
  const frontBumper = new THREE.Mesh(frontBumperGeo, bodyPaintMat);
  frontBumper.position.set(carFrontX + 4, sillY - 2, 0);
  car3DGroup.add(frontBumper);

  // Lower air dam
  const airDamGeo = new THREE.BoxGeometry(6, 9, totalCarWidth - 30);
  const airDam = new THREE.Mesh(airDamGeo, trimMat);
  airDam.position.set(carFrontX + 2, sillY - 8, 0);
  car3DGroup.add(airDam);

  // Brand Signature Grille Styling
  const grilleGroup = new THREE.Group();
  if (car.id.includes('bmw')) {
    // Iconic Twin Kidney Grille
    [-14, 14].forEach(gx => {
      const kidneyGeo = new THREE.BoxGeometry(4, 13, 20);
      const kidney = new THREE.Mesh(kidneyGeo, trimMat);
      kidney.position.set(carFrontX + 3, sillY + 4, gx);
      addCadEdges(kidney, 0xe2e8f0, 15);
      grilleGroup.add(kidney);
    });
  } else if (car.id.includes('audi')) {
    // Singleframe Hexagonal Grille
    const singleGeo = new THREE.BoxGeometry(4, 16, 42);
    const singleFrame = new THREE.Mesh(singleGeo, trimMat);
    singleFrame.position.set(carFrontX + 3, sillY + 3, 0);
    addCadEdges(singleFrame, 0xe2e8f0, 15);
    grilleGroup.add(singleFrame);
  } else if (car.id.includes('tesla')) {
    // Smooth aerodynamic front
    const noseGeo = new THREE.BoxGeometry(5, 14, totalCarWidth - 36);
    const nose = new THREE.Mesh(noseGeo, bodyPaintMat);
    nose.position.set(carFrontX + 3, sillY + 4, 0);
    grilleGroup.add(nose);
  } else {
    // Golf / Horizontal LED Grille Bar
    const barGeo = new THREE.BoxGeometry(4, 6, totalCarWidth - 40);
    const bar = new THREE.Mesh(barGeo, trimMat);
    bar.position.set(carFrontX + 3, sillY + 5, 0);
    addCadEdges(bar, 0x38bdf8, 20);
    grilleGroup.add(bar);
  }
  car3DGroup.add(grilleGroup);

  // Headlights
  [-1, 1].forEach(dir => {
    const headGeo = new THREE.BoxGeometry(10, 7, 24);
    const head = new THREE.Mesh(headGeo, headlampMat);
    head.position.set(carFrontX + 6, sillY + 6, dir * ((totalCarWidth / 2) - 20));
    car3DGroup.add(head);
  });

  // 7. TOGGLEABLE REAR BOOT / TAILGATE ASSEMBLY
  tailgatePivot = new THREE.Group();
  const openAngle = getOpenTailgateAngle(bodyType);

  if (isSaloon) {
    // Fixed rear window for sedan
    const rearWinLen = Math.hypot(deckFrontX - roofRearX, roofTopY - beltY);
    const rearWinAngle = Math.atan2(roofTopY - beltY, deckFrontX - roofRearX);
    const rearWinGeo = new THREE.BoxGeometry(rearWinLen - 4, 1.8, cabinWidth - 8);
    const rearWin = new THREE.Mesh(rearWinGeo, glassMat);
    rearWin.position.set((roofRearX + deckFrontX) / 2, (roofTopY + beltY) / 2, 0);
    rearWin.rotation.z = -rearWinAngle;
    car3DGroup.add(rearWin);

    // Boot Trunk Lid Hinges at (deckFrontX, beltY, 0)
    tailgatePivot.position.set(deckFrontX, beltY, 0);

    const trunkLen = Math.abs(rearBumperX - deckFrontX) - 4;
    const trunkLidGeo = new THREE.BoxGeometry(trunkLen, 2.5, totalCarWidth - 14);
    const trunkLid = new THREE.Mesh(trunkLidGeo, bodyPaintMat);
    trunkLid.position.set(trunkLen / 2, 0, 0);
    addCadEdges(trunkLid, 0x38bdf8);
    tailgatePivot.add(trunkLid);

    // Vertical rear face
    const rearFaceGeo = new THREE.BoxGeometry(3, 16, totalCarWidth - 18);
    const rearFace = new THREE.Mesh(rearFaceGeo, bodyPaintMat);
    rearFace.position.set(trunkLen, -7, 0);
    tailgatePivot.add(rearFace);

    // Taillight bar on trunk
    const tailBarGeo = new THREE.BoxGeometry(4, 5, totalCarWidth - 22);
    const tailBar = new THREE.Mesh(tailBarGeo, taillampMat);
    tailBar.position.set(trunkLen + 1, -2, 0);
    tailgatePivot.add(tailBar);

    // Dual Gooseneck Hinges
    [-1, 1].forEach(side => {
      const hingeGeo = new THREE.CylinderGeometry(1.2, 1.2, 18, 12);
      const hinge = new THREE.Mesh(hingeGeo, chromeMat);
      hinge.position.set(6, -6, side * ((archW / 2) + 2));
      hinge.rotation.z = 0.5;
      tailgatePivot.add(hinge);
    });
  } else {
    // Hatchback, Estate, SUV: Hinges at (roofRearX, roofTopY, 0)
    tailgatePivot.position.set(roofRearX, roofTopY, 0);

    const hatchSpanX = Math.abs(rearBumperX - roofRearX) - 4;
    const hatchSpanY = Math.abs(roofTopY - (sillY + 8));
    const hatchDiagonal = Math.hypot(hatchSpanX, hatchSpanY);
    const hatchAngle = Math.atan2(hatchSpanY, hatchSpanX);

    // Roof Spoiler Lip
    const spoilerGeo = new THREE.BoxGeometry(12, 3.5, cabinWidth - 4);
    const spoiler = new THREE.Mesh(spoilerGeo, bodyPaintMat);
    spoiler.position.set(4, 1.5, 0);
    tailgatePivot.add(spoiler);

    // High 3rd Brake Light
    const thirdBrakeGeo = new THREE.BoxGeometry(2, 2, 28);
    const thirdBrake = new THREE.Mesh(thirdBrakeGeo, taillampMat);
    thirdBrake.position.set(8, 2.5, 0);
    tailgatePivot.add(thirdBrake);

    // Rear Hatch Window (Glass)
    const glassLen = hatchDiagonal * 0.52;
    const rearHatchGlassGeo = new THREE.BoxGeometry(glassLen, 1.8, cabinWidth - 8);
    const rearHatchGlass = new THREE.Mesh(rearHatchGlassGeo, glassMat);
    rearHatchGlass.position.set(hatchSpanX * 0.28, -hatchSpanY * 0.28, 0);
    rearHatchGlass.rotation.z = -hatchAngle;
    tailgatePivot.add(rearHatchGlass);

    // Lower Tailgate Sheet Metal
    const sheetLen = hatchDiagonal * 0.48;
    const sheetGeo = new THREE.BoxGeometry(sheetLen, 3.0, totalCarWidth - 12);
    const sheet = new THREE.Mesh(sheetGeo, bodyPaintMat);
    sheet.position.set(hatchSpanX * 0.74, -hatchSpanY * 0.74, 0);
    sheet.rotation.z = -hatchAngle;
    addCadEdges(sheet, 0x38bdf8);
    tailgatePivot.add(sheet);

    // Ruby Taillight Lightbar
    const tailBarGeo = new THREE.BoxGeometry(4, 5, totalCarWidth - 20);
    const tailBar = new THREE.Mesh(tailBarGeo, taillampMat);
    tailBar.position.set(hatchSpanX - 2, -hatchSpanY + 4, 0);
    tailgatePivot.add(tailBar);

    // Hydraulic Gas Struts (Hold tailgate open)
    [-1, 1].forEach(side => {
      const strutGroup = new THREE.Group();
      const strutGeo = new THREE.CylinderGeometry(1.2, 1.2, 26, 12);
      const strutMesh = new THREE.Mesh(strutGeo, trimMat);
      strutMesh.position.set(hatchSpanX * 0.4, -hatchSpanY * 0.4, side * ((cabinWidth / 2) - 4));
      strutMesh.rotation.z = -hatchAngle;
      strutGroup.add(strutMesh);

      const rodGeo = new THREE.CylinderGeometry(0.7, 0.7, 18, 12);
      const rodMesh = new THREE.Mesh(rodGeo, chromeMat);
      rodMesh.position.set(hatchSpanX * 0.4 - 4, -hatchSpanY * 0.4 + 4, side * ((cabinWidth / 2) - 4));
      rodMesh.rotation.z = -hatchAngle;
      strutGroup.add(rodMesh);

      tailgatePivot.add(strutGroup);
    });
  }

  // Set initial tailgate angle according to isTailgateOpen state
  targetTailgateAngle = isTailgateOpen ? openAngle : 0;
  currentTailgateAngle = targetTailgateAngle;
  tailgatePivot.rotation.z = currentTailgateAngle;
  car3DGroup.add(tailgatePivot);

  // 8. APERTURE CAD BOUNDARY FRAME (Rear Sill Reference)
  const apWidth = car.aperture_width;
  const apHeight = car.aperture_height;
  const isApertureColliding = fitResult && fitResult.rot && (fitResult.rot.w > apWidth || fitResult.rot.h > apHeight);

  const apFrameGeo = new THREE.BoxGeometry(1.5, apHeight, apWidth);
  const apFrameMat = new THREE.LineBasicMaterial({
    color: isApertureColliding ? 0xef4444 : 0x38bdf8,
    linewidth: 2
  });
  const apFrame = new THREE.LineSegments(new THREE.EdgesGeometry(apFrameGeo), apFrameMat);
  apFrame.position.set(rearSillX, sillY + (apHeight / 2), 0);
  car3DGroup.add(apFrame);

  // 9. INTERIOR CARGO BAY & SEATING ARCHITECTURE
  // Cargo Floor
  const bootFloorGeo = new THREE.BoxGeometry(currentFloorLen, 2.5, archW);
  const bootFloorMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 0.7,
    transparent: true,
    opacity: 0.75
  });
  const bootFloorMesh = new THREE.Mesh(bootFloorGeo, bootFloorMat);
  bootFloorMesh.position.set(rearSillX - (currentFloorLen / 2), sillY + 1.25, 0);
  bootFloorMesh.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(bootFloorGeo),
    new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 })
  ));
  car3DGroup.add(bootFloorMesh);

  // Stainless steel scuff plate at rear sill threshold
  const scuffGeo = new THREE.BoxGeometry(6, 1.5, apWidth - 6);
  const scuffPlate = new THREE.Mesh(scuffGeo, chromeMat);
  scuffPlate.position.set(rearSillX - 3, sillY + 2.0, 0);
  car3DGroup.add(scuffPlate);

  // Interior Rounded Wheel Arch Tubs
  const archThick = (totalCarWidth - archW) / 2;
  const leftTub = createRoundedWheelArchTub(26, archThick);
  leftTub.position.set(rearWheelX, sillY + 12, (archW / 2) + (archThick / 2));
  const rightTub = createRoundedWheelArchTub(26, archThick);
  rightTub.position.set(rearWheelX, sillY + 12, -((archW / 2) + (archThick / 2)));
  car3DGroup.add(leftTub);
  car3DGroup.add(rightTub);

  // Front Bucket Seats
  const seatZOffset = (totalCarWidth / 4) - 6;
  const driverSeat = createSeat3D(44, 42);
  driverSeat.position.set(frontSeatsX, cabinFloorY, seatZOffset);
  const passSeat = createSeat3D(44, 42);
  passSeat.position.set(frontSeatsX, cabinFloorY, -seatZOffset);
  car3DGroup.add(driverSeat);
  car3DGroup.add(passSeat);

  // Rear Folding Seats
  const rearSeatGroup = new THREE.Group();
  const rearSeatMat = new THREE.MeshStandardMaterial({ color: 0x111b2b, roughness: 0.75 });
  const rearHingeX = rearSillX - car.floor_length_seats_up;

  if (seatsFolded) {
    const foldedGeo = new THREE.BoxGeometry(Math.max(30, car.floor_length_seats_folded - car.floor_length_seats_up), 5, archW + 10);
    const foldedMesh = new THREE.Mesh(foldedGeo, rearSeatMat);
    foldedMesh.position.set(rearHingeX - 25, sillY + 3.5, 0);
    rearSeatGroup.add(foldedMesh);
  } else {
    const benchBaseGeo = new THREE.BoxGeometry(38, 8, archW + 10);
    const benchBase = new THREE.Mesh(benchBaseGeo, rearSeatMat);
    benchBase.position.set(rearHingeX + 16, sillY + 4, 0);
    rearSeatGroup.add(benchBase);

    const benchBackGeo = new THREE.BoxGeometry(10, 42, archW + 8);
    const benchBack = new THREE.Mesh(benchBackGeo, rearSeatMat);
    benchBack.position.set(rearHingeX + 2, sillY + 21, 0);
    benchBack.rotation.z = -0.12;
    rearSeatGroup.add(benchBack);
  }
  car3DGroup.add(rearSeatGroup);

  // Ground Ambient Occlusion Plate & Wheel Shadows
  const shadowGeo = new THREE.PlaneGeometry(rearBumperX - carFrontX + 30, totalCarWidth + 24);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x02050b, transparent: true, opacity: 0.8 });
  const shadowPlate = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlate.rotation.x = -Math.PI / 2;
  shadowPlate.position.set((carFrontX + rearBumperX) / 2, groundY + 0.2, 0);
  car3DGroup.add(shadowPlate);

  wheelPositions.forEach(([wx, wy, wz]) => {
    const tireShadowGeo = new THREE.PlaneGeometry(wheelRadius * 1.5, 26);
    const tireShadow = new THREE.Mesh(tireShadowGeo, shadowMat);
    tireShadow.rotation.x = -Math.PI / 2;
    tireShadow.position.set(wx, groundY + 0.3, wz);
    car3DGroup.add(tireShadow);
  });

  scene.add(car3DGroup);

  // 10. PHYSICAL CARGO BOX (High-contrast, 1:1 scale, with glowing CAD outlines)
  if (fitResult && fitResult.rot) {
    const rot = fitResult.rot;
    const boxGeo = new THREE.BoxGeometry(rot.l, rot.h, rot.w);

    let boxColor = 0x10b981; // Emerald green
    let edgeColor = 0x34d399;
    if (fitResult.status === 'tight') {
      boxColor = 0xf59e0b; // Amber
      edgeColor = 0xfbbf24;
    } else if (fitResult.status === 'angled') {
      boxColor = 0x0284c7; // Cyan
      edgeColor = 0x38bdf8;
    } else if (fitResult.status === 'colliding') {
      boxColor = 0xef4444; // Crimson
      edgeColor = 0xf87171;
    }

    const boxMat = new THREE.MeshPhysicalMaterial({
      color: boxColor,
      roughness: 0.2,
      metalness: 0.15,
      transparent: true,
      opacity: 0.82
    });

    cargo3DMesh = new THREE.Mesh(boxGeo, boxMat);
    cargo3DMesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 2 })
    ));

    if (fitResult.mode === 'pitch') {
      const pivot = new THREE.Group();
      pivot.position.set(rearSillX - 4, sillY + 2.5, 0);
      cargo3DMesh.position.set(-(rot.l / 2), rot.h / 2, 0);
      pivot.rotation.z = -(fitResult.angle * Math.PI) / 180;
      pivot.add(cargo3DMesh);
      scene.add(pivot);
      cargo3DMesh = pivot;
    } else if (fitResult.mode === 'yaw') {
      cargo3DMesh.position.set(rearSillX - (rot.l / 2) - 4, sillY + (rot.h / 2) + 2.5, 0);
      cargo3DMesh.rotation.y = (fitResult.angle * Math.PI) / 180;
      scene.add(cargo3DMesh);
    } else {
      const posX = rearSillX - (rot.l / 2) - 4;
      cargo3DMesh.position.set(posX, sillY + (rot.h / 2) + 2.5, 0);
      scene.add(cargo3DMesh);
    }
  }
}

/* ==========================================================================
   CAD 2D BLUEPRINT VECTOR VISUALIZERS (Static Chassis Datum)
   ========================================================================== */

function renderSideSvg(rot, floorLength, roofHeight, tanRake, mode, angle, seatsFolded, car) {
  const groundY = 205;
  const floorY = 165;
  const rearSillX = 490; // Fixed rear sill datum!
  const scale = 1.45;
  const bodyType = car.body_type;

  const floorLenPx = floorLength * scale;
  const seatFrontX = rearSillX - floorLenPx;
  const roofY = floorY - (roofHeight * scale);
  const glassTopX = rearSillX - (roofHeight * tanRake * scale);

  const boxLPx = rot.l * scale;
  const boxHPx = rot.h * scale;

  let cargoMarkup = '';

  if (mode === 'pitch') {
    const pivotX = rearSillX - 8;
    const pivotY = floorY;
    cargoMarkup = `
      <g transform="rotate(${angle}, ${pivotX}, ${pivotY})">
        <rect x="${pivotX - boxLPx}" y="${pivotY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
              fill="url(#box-grad-cyan)" stroke="#38bdf8" stroke-width="2" rx="3" filter="url(#glow-cyan)" />
        <text x="${pivotX - (boxLPx / 2)}" y="${pivotY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
          ${rot.l} × ${rot.h} cm
        </text>
        <line x1="${pivotX - boxLPx + 14}" y1="${pivotY - boxHPx}" x2="${pivotX - boxLPx + 14}" y2="${pivotY}" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5" />
        <line x1="${pivotX - 14}" y1="${pivotY - boxHPx}" x2="${pivotX - 14}" y2="${pivotY}" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5" />
      </g>
      <path d="M ${pivotX - 50} ${pivotY} A 50 50 0 0 1 ${pivotX - 48} ${pivotY - 18}" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2,2" />
      <text x="${pivotX - 56}" y="${pivotY - 8}" fill="#38bdf8" font-size="10" font-family="ui-monospace, monospace" font-weight="700" text-anchor="end">
        ~${angle}° tilt
      </text>
    `;
  } else if (mode === 'colliding') {
    const boxX = Math.max(seatFrontX, rearSillX - boxLPx);
    cargoMarkup = `
      <rect x="${boxX}" y="${floorY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
            fill="url(#box-grad-red)" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,3" rx="3" />
      <rect x="${rearSillX - 40}" y="${floorY - boxHPx}" width="45" height="${boxHPx}" fill="url(#hazard-stripes)" opacity="0.65" rx="2" />
      <text x="${boxX + (boxLPx / 2)}" y="${floorY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
        ${rot.l} × ${rot.h} cm
      </text>
      <circle cx="${rearSillX - 8}" cy="${floorY - boxHPx + 8}" r="8" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" stroke-width="2" />
      <circle cx="${rearSillX - 8}" cy="${floorY - boxHPx + 8}" r="3" fill="#ef4444" />
      <line x1="${rearSillX - 8}" y1="${floorY - boxHPx + 8}" x2="${rearSillX + 30}" y2="${floorY - boxHPx - 14}" stroke="#ef4444" stroke-width="1.5" />
      <rect x="${rearSillX + 30}" y="${floorY - boxHPx - 24}" width="88" height="17" rx="3" fill="#180e14" stroke="#ef4444" stroke-width="1" />
      <text x="${rearSillX + 74}" y="${floorY - boxHPx - 12}" fill="#fca5a5" font-size="8.5" font-family="ui-monospace, monospace" font-weight="700" text-anchor="middle">
        GLASS COLLISION
      </text>
    `;
  } else {
    const boxX = Math.max(seatFrontX, rearSillX - boxLPx);
    cargoMarkup = `
      <rect x="${boxX}" y="${floorY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
            fill="url(#box-grad-green)" stroke="#22c55e" stroke-width="2" rx="3" filter="url(#glow-green)" />
      <line x1="${boxX + 16}" y1="${floorY - boxHPx}" x2="${boxX + 16}" y2="${floorY}" stroke="rgba(34, 197, 94, 0.3)" stroke-width="1.5" />
      <line x1="${boxX + boxLPx - 16}" y1="${floorY - boxHPx}" x2="${boxX + boxLPx - 16}" y2="${floorY}" stroke="rgba(34, 197, 94, 0.3)" stroke-width="1.5" />
      <text x="${boxX + (boxLPx / 2)}" y="${floorY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
        ${rot.l} × ${rot.h} cm
      </text>
    `;
  }

  // 2D Chassis Silhouette (Static for this car model)
  let bodyPath = '';
  let greenhousePath = '';
  let roofRail = '';

  if (bodyType === 'estate') {
    bodyPath = `
      M 45 192 L 40 176 L 42 160 L 55 145 L 165 124 L 230 70 L 465 72 L 485 76 
      L 482 85 L 505 142 L 515 152 L 510 178 L 488 192 
      L 484 178 A 34 34 0 0 0 416 178 L 416 190 L 159 190 L 159 178 A 34 34 0 0 0 91 178 L 91 192 Z`;
    greenhousePath = `
      M 172 122 L 234 76 L 465 76 L 480 110 L 480 122 Z`;
    roofRail = `<line x1="240" y1="67" x2="465" y2="67" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />`;
  } else if (bodyType === 'suv') {
    bodyPath = `
      M 45 192 L 40 168 L 44 148 L 60 135 L 165 116 L 225 54 L 440 54 L 470 60 
      L 465 70 L 498 136 L 518 146 L 512 175 L 488 192 
      L 484 178 A 34 34 0 0 0 416 178 L 416 190 L 159 190 L 159 178 A 34 34 0 0 0 91 178 L 91 192 Z`;
    greenhousePath = `
      M 172 114 L 230 60 L 438 60 L 468 96 L 468 114 Z`;
    roofRail = `<line x1="240" y1="50" x2="435" y2="50" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />`;
  } else if (bodyType === 'saloon') {
    bodyPath = `
      M 45 192 L 40 176 L 42 160 L 55 145 L 165 124 L 230 70 L 375 70 L 425 118 
      L 485 118 L 515 142 L 510 178 L 488 192 
      L 484 178 A 34 34 0 0 0 416 178 L 416 190 L 159 190 L 159 178 A 34 34 0 0 0 91 178 L 91 192 Z`;
    greenhousePath = `
      M 172 122 L 234 76 L 372 76 L 420 122 Z`;
  } else {
    // Hatchback
    bodyPath = `
      M 45 192 L 40 176 L 42 160 L 55 145 L 165 122 L 230 68 L 415 70 L 455 74 
      L 445 82 L 495 138 L 515 148 L 510 175 L 488 192 
      L 484 178 A 34 34 0 0 0 416 178 L 416 190 L 159 190 L 159 178 A 34 34 0 0 0 91 178 L 91 192 Z`;
    greenhousePath = `
      M 172 122 L 234 74 L 408 74 L 440 92 L 440 122 Z`;
  }

  let seatGraphics = '';
  if (seatsFolded) {
    seatGraphics = `
      <path d="M ${seatFrontX} ${floorY} 
               L ${seatFrontX - 25} ${floorY - 12} 
               L ${seatFrontX + 50} ${floorY - 12} 
               L ${seatFrontX + 42} ${floorY} Z" 
            fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <circle cx="${seatFrontX - 2}" cy="${floorY - 6}" r="3" fill="#38bdf8" />
    `;
  } else {
    seatGraphics = `
      <path d="M ${seatFrontX} ${floorY} 
               L ${seatFrontX - 10} ${floorY - 45} 
               L ${seatFrontX - 20} ${floorY - 45} 
               L ${seatFrontX - 16} ${floorY} Z" 
            fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <rect x="${seatFrontX - 18}" y="${floorY - 56}" width="14" height="9" rx="2" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
    `;
  }

  sideSvg.innerHTML = `
    <defs>
      <pattern id="grid-side" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#131e33" stroke-width="0.8" />
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1c2c46" stroke-width="1.2" />
      </pattern>

      <pattern id="hazard-stripes" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" stroke-width="4" />
        <line x1="5" y1="0" x2="5" y2="10" stroke="#1e1014" stroke-width="6" />
      </pattern>

      <linearGradient id="body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e2d4a" />
        <stop offset="100%" stop-color="#0c1424" />
      </linearGradient>

      <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(56, 189, 248, 0.28)" />
        <stop offset="100%" stop-color="rgba(14, 165, 233, 0.06)" />
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

      <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#38bdf8" flood-opacity="0.4" />
      </filter>
      <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#22c55e" flood-opacity="0.4" />
      </filter>
    </defs>

    <rect width="600" height="240" fill="#070c18" />
    <rect width="600" height="240" fill="url(#grid-side)" />

    <path d="M 12 20 L 22 20 M 22 10 L 22 20" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 588 20 L 578 20 M 578 10 L 578 20" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 12 220 L 22 220 M 22 230 L 22 220" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 588 220 L 578 220 M 578 230 L 578 220" stroke="#2a3c5a" stroke-width="1.5" />

    <line x1="25" y1="${groundY}" x2="575" y2="${groundY}" stroke="#1e2c47" stroke-width="2" />
    <line x1="25" y1="${groundY + 4}" x2="575" y2="${groundY + 4}" stroke="#10192a" stroke-dasharray="3,3" stroke-width="1" />

    <path d="${bodyPath}" fill="url(#body-grad)" stroke="#2a3f66" stroke-width="2" />
    <path d="${greenhousePath}" fill="url(#glass-grad)" stroke="#203352" stroke-width="1.5" />
    ${roofRail}

    <circle cx="125" cy="178" r="27" fill="#080e1a" stroke="#1e2c47" stroke-width="3" />
    <circle cx="125" cy="178" r="17" fill="#111c2e" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="6,4" />
    <circle cx="125" cy="178" r="7" fill="#1e2c47" />

    <circle cx="450" cy="178" r="27" fill="#080e1a" stroke="#1e2c47" stroke-width="3" />
    <circle cx="450" cy="178" r="17" fill="#111c2e" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="6,4" />
    <circle cx="450" cy="178" r="7" fill="#1e2c47" />

    <polygon points="42,160 55,145 62,156" fill="#38bdf8" opacity="0.9" filter="url(#glow-cyan)" />
    <polygon points="515,148 495,138 497,152" fill="#ef4444" opacity="0.95" />

    <line x1="${seatFrontX}" y1="${floorY}" x2="${rearSillX}" y2="${floorY}" stroke="#38bdf8" stroke-width="3" />
    <line x1="${seatFrontX}" y1="${floorY + 2}" x2="${rearSillX}" y2="${floorY + 2}" stroke="#0369a1" stroke-width="1" />
    
    <line x1="${seatFrontX}" y1="${floorY + 16}" x2="${rearSillX}" y2="${floorY + 16}" stroke="#64748b" stroke-width="1" />
    <line x1="${seatFrontX}" y1="${floorY + 10}" x2="${seatFrontX}" y2="${floorY + 22}" stroke="#64748b" stroke-width="1" />
    <line x1="${rearSillX}" y1="${floorY + 10}" x2="${rearSillX}" y2="${floorY + 22}" stroke="#64748b" stroke-width="1" />
    <text x="${seatFrontX + (floorLenPx / 2)}" y="${floorY + 28}" fill="#94a3b8" font-size="9.5" font-family="ui-monospace, monospace" font-weight="700" text-anchor="middle">
      FLOOR ${floorLength} cm
    </text>

    <line x1="${seatFrontX}" y1="${roofY}" x2="${glassTopX}" y2="${roofY}" stroke="#334b73" stroke-dasharray="4,4" stroke-width="1.5" />
    <line x1="${rearSillX}" y1="${floorY}" x2="${glassTopX}" y2="${roofY}" stroke="#38bdf8" stroke-dasharray="4,3" stroke-width="1.8" />

    ${seatGraphics}

    ${cargoMarkup}
  `;
}

function renderRearSvg(rot, archWidth, roofHeight, apWidth, apHeight, isArchColliding, bodyType) {
  const groundY = 205;
  const floorY = 165;
  const centerX = 210;
  const scale = 1.35;

  const archWPx = archWidth * scale;
  const apWPx = apWidth * scale;
  const apHPx = apHeight * scale;

  const boxWPx = rot.w * scale;
  const boxHPx = rot.h * scale;
  const boxLeftX = centerX - (boxWPx / 2);

  const boxStroke = isArchColliding ? '#ef4444' : '#22c55e';
  const boxFill = isArchColliding ? 'url(#box-rear-red)' : 'url(#box-rear-green)';
  const boxGlow = isArchColliding ? '' : 'filter="url(#glow-green)"';

  let rearBodyPath = '';
  let rearWindowPoly = '';

  if (bodyType === 'suv') {
    rearBodyPath = `
      M 88 192 L 46 168 L 44 125 L 60 115 L 105 50 L 315 50 L 360 115 L 376 125 L 374 168 L 332 192 Z`;
    rearWindowPoly = `points="114,56 306,56 345,110 75,110"`;
  } else if (bodyType === 'estate') {
    rearBodyPath = `
      M 88 192 L 48 168 L 46 130 L 62 120 L 108 60 L 312 60 L 358 120 L 374 130 L 372 168 L 332 192 Z`;
    rearWindowPoly = `points="118,66 302,66 342,115 78,115"`;
  } else if (bodyType === 'saloon') {
    rearBodyPath = `
      M 88 192 L 48 168 L 46 142 L 65 132 L 120 74 L 300 74 L 355 132 L 374 142 L 372 168 L 332 192 Z`;
    rearWindowPoly = `points="130,80 290,80 335,124 85,124"`;
  } else {
    rearBodyPath = `
      M 88 192 L 48 168 L 46 138 L 65 130 L 115 68 L 305 68 L 355 130 L 374 138 L 372 168 L 332 192 Z`;
    rearWindowPoly = `points="126,74 294,74 340,122 80,122"`;
  }

  rearSvg.innerHTML = `
    <defs>
      <pattern id="grid-rear" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#131e33" stroke-width="0.8" />
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1c2c46" stroke-width="1.2" />
      </pattern>

      <linearGradient id="body-rear-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e2d4a" />
        <stop offset="100%" stop-color="#0b1322" />
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
        <stop offset="20%" stop-color="#dc2626" />
        <stop offset="50%" stop-color="#f87171" />
        <stop offset="80%" stop-color="#dc2626" />
        <stop offset="100%" stop-color="#ef4444" />
      </linearGradient>
    </defs>

    <rect width="420" height="240" fill="#070c18" />
    <rect width="420" height="240" fill="url(#grid-rear)" />

    <path d="M 12 20 L 22 20 M 22 10 L 22 20" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 408 20 L 398 20 M 398 10 L 398 20" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 12 220 L 22 220 M 22 230 L 22 220" stroke="#2a3c5a" stroke-width="1.5" />
    <path d="M 408 220 L 398 220 M 398 230 L 398 220" stroke="#2a3c5a" stroke-width="1.5" />

    <line x1="25" y1="${groundY}" x2="395" y2="${groundY}" stroke="#1e2c47" stroke-width="2" />

    <rect x="55" y="158" width="33" height="47" rx="4" fill="#080e1a" stroke="#1e2c47" stroke-width="2" />
    <rect x="332" y="158" width="33" height="47" rx="4" fill="#080e1a" stroke="#1e2c47" stroke-width="2" />

    <path d="${rearBodyPath}" fill="url(#body-rear-grad)" stroke="#2a3f66" stroke-width="2" />
    <path d="M 207 66 L 210 52 L 214 66 Z" fill="#1b283d" stroke="#2a3f66" stroke-width="1.5" />

    <polygon ${rearWindowPoly} fill="url(#glass-grad)" stroke="#203352" stroke-width="1.5" />

    <rect x="50" y="132" width="320" height="9" rx="3" fill="url(#rear-lightbar)" opacity="0.9" />

    <rect x="${centerX - (apWPx / 2)}" y="${floorY - apHPx}" width="${apWPx}" height="${apHPx}" 
          fill="#060b16" stroke="#334b73" stroke-dasharray="5,4" stroke-width="1.8" rx="6" />

    <path d="M ${centerX - (apWPx / 2)} ${floorY} 
             L ${centerX - (archWPx / 2)} ${floorY} 
             C ${centerX - (archWPx / 2) + 6} ${floorY - 20}, ${centerX - (archWPx / 2) - 2} ${floorY - 36}, ${centerX - (apWPx / 2)} ${floorY - 38} Z" 
          fill="#111c2e" stroke="#38bdf8" stroke-width="1.5" />

    <path d="M ${centerX + (apWPx / 2)} ${floorY} 
             L ${centerX + (archWPx / 2)} ${floorY} 
             C ${centerX + (archWPx / 2) - 6} ${floorY - 20}, ${centerX + (archWPx / 2) + 2} ${floorY - 36}, ${centerX + (apWPx / 2)} ${floorY - 38} Z" 
          fill="#111c2e" stroke="#38bdf8" stroke-width="1.5" />

    <line x1="${centerX - (archWPx / 2)}" y1="${floorY + 16}" x2="${centerX + (archWPx / 2)}" y2="${floorY + 16}" stroke="#64748b" stroke-width="1" />
    <line x1="${centerX - (archWPx / 2)}" y1="${floorY + 10}" x2="${centerX - (archWPx / 2)}" y2="${floorY + 22}" stroke="#64748b" stroke-width="1" />
    <line x1="${centerX + (archWPx / 2)}" y1="${floorY + 10}" x2="${centerX + (archWPx / 2)}" y2="${floorY + 22}" stroke="#64748b" stroke-width="1" />
    <text x="${centerX}" y="${floorY + 28}" fill="#94a3b8" font-size="9.5" font-family="ui-monospace, monospace" font-weight="700" text-anchor="middle">
      ARCHES ${archWidth} cm
    </text>

    <rect x="${boxLeftX}" y="${floorY - boxHPx}" width="${boxWPx}" height="${boxHPx}" 
          fill="${boxFill}" stroke="${boxStroke}" stroke-width="2" rx="3" ${boxGlow} />

    <text x="${centerX}" y="${floorY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
      ${rot.w} × ${rot.h} cm
    </text>

    ${isArchColliding ? `
      <circle cx="${centerX - (archWPx / 2)}" cy="${floorY - (boxHPx / 2)}" r="6" fill="#ef4444" />
      <circle cx="${centerX + (archWPx / 2)}" cy="${floorY - (boxHPx / 2)}" r="6" fill="#ef4444" />
    ` : ''}
  `;
}

document.addEventListener('DOMContentLoaded', init);