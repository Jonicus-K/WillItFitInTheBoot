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
let currentSolverOutcome = null; // Comprehensive solver result across all modes
let activeAngleMode = 'auto'; // 'auto' | 'flat' | 'pitch' | 'yaw' | 'roll' | 'ingress'
let manualAngleSliderValue = null; // null: use solver recommended angle, number: user override
let isIngressSimulating = false; // Animated loading in progress
let ingressSimProgress = 0; // 0 to 1
let cargoSimulationBaseGroup = null; // Container for animated simulation mesh
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

// Angle Strategy & Ingress Controls
const strategyBadge = document.getElementById('strategy-badge');
const strategyHeading = document.getElementById('strategy-heading');
const chipIngress = document.getElementById('chip-ingress');
const chipStowed = document.getElementById('chip-stowed');
const btnSimulateIngress = document.getElementById('btn-simulate-ingress');
const animBtnLabel = document.getElementById('anim-btn-label');
const strategyPills = document.querySelectorAll('.strategy-pill');
const customAngleSlider = document.getElementById('custom-angle-slider');
const angleSliderLabel = document.getElementById('angle-slider-label');
const angleValueBadge = document.getElementById('angle-value-badge');
const angleStatusHint = document.getElementById('angle-status-hint');
const tickButtons = document.querySelectorAll('.tick-btn');

const sideSvg = document.getElementById('side-svg');
const rearSvg = document.getElementById('rear-svg');

const specFloor = document.getElementById('spec-floor');
const specArches = document.getElementById('spec-arches');
const specRoof = document.getElementById('spec-roof');
const specAperture = document.getElementById('spec-aperture');
const specsCarName = document.getElementById('specs-car-name');
const hudBodyType = document.getElementById('hud-body-type');

const presetButtons = document.querySelectorAll('.preset-btn');
const tabBtn3d = document.getElementById('tab-btn-3d');
const tabBtn2d = document.getElementById('tab-btn-2d');
const view3dContainer = document.getElementById('view-3d-container');
const view2dContainer = document.getElementById('view-2d-container');
const camButtons = document.querySelectorAll('.cam-btn[data-view]');
const btnXRayToggle = document.getElementById('btn-xray-toggle');
const btnBootToggle = document.getElementById('btn-boot-toggle');

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
      manualAngleSliderValue = null;
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
    manualAngleSliderValue = null;
    evaluateFitment();
  });

  foldSeatsCheckbox.addEventListener('change', () => {
    manualAngleSliderValue = null;
    evaluateFitment();
  });

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      clearActivePresets();
      btn.classList.add('active');
      cargoLengthInput.value = btn.dataset.length;
      cargoWidthInput.value = btn.dataset.width;
      cargoHeightInput.value = btn.dataset.height;
      manualAngleSliderValue = null;
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

  // Strategy Mode Pills
  strategyPills.forEach(pill => {
    pill.addEventListener('click', () => {
      strategyPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeAngleMode = pill.dataset.angleMode;
      manualAngleSliderValue = null; // Clear manual override to load mode's optimal angle
      if (activeAngleMode === 'ingress') {
        snapCamera('ingress');
        camButtons.forEach(b => b.classList.toggle('active', b.dataset.view === 'ingress'));
      }
      evaluateFitment();
    });
  });

  // Angle Slider
  if (customAngleSlider) {
    customAngleSlider.addEventListener('input', (e) => {
      manualAngleSliderValue = parseFloat(e.target.value) || 0;
      if (angleValueBadge) angleValueBadge.textContent = `${Math.round(manualAngleSliderValue)}°`;
      if (activeAngleMode === 'auto' || activeAngleMode === 'flat') {
        if (manualAngleSliderValue > 0) {
          activeAngleMode = 'pitch';
          strategyPills.forEach(p => p.classList.toggle('active', p.dataset.angleMode === 'pitch'));
        }
      }
      evaluateFitment();
    });
  }

  // Quick Angle Ticks
  tickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseFloat(btn.dataset.tick) || 0;
      manualAngleSliderValue = val;
      if (customAngleSlider) customAngleSlider.value = val;
      if (angleValueBadge) angleValueBadge.textContent = `${val}°`;
      if (val === 0) {
        activeAngleMode = 'flat';
        strategyPills.forEach(p => p.classList.toggle('active', p.dataset.angleMode === 'flat'));
      } else if (activeAngleMode === 'auto' || activeAngleMode === 'flat') {
        activeAngleMode = 'pitch';
        strategyPills.forEach(p => p.classList.toggle('active', p.dataset.angleMode === 'pitch'));
      }
      evaluateFitment();
    });
  });

  // Ingress Loading Simulation Button
  if (btnSimulateIngress) {
    btnSimulateIngress.addEventListener('click', () => {
      toggleIngressSimulation();
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

/**
 * Comprehensive Multi-Angle Loading & Aperture Ingress Solver
 */
function checkApertureIngress(rot, apW, apH) {
  // Check direct flat entry
  if (rot.w <= apW && rot.h <= apH) {
    return {
      direct: true,
      canEnter: true,
      rollAngle: 0,
      margin: Math.min(apW - rot.w, apH - rot.h)
    };
  }

  // Check if angling / rolling the item diagonally allows entry through tailgate aperture
  let bestRoll = null;
  for (let deg = 1; deg <= 89; deg++) {
    const rad = (deg * Math.PI) / 180;
    const projW = (rot.w * Math.cos(rad)) + (rot.h * Math.sin(rad));
    const projH = (rot.w * Math.sin(rad)) + (rot.h * Math.cos(rad));

    if (projW <= apW && projH <= apH) {
      const margin = Math.min(apW - projW, apH - projH);
      if (!bestRoll || margin > bestRoll.margin) {
        bestRoll = { deg, margin, projW, projH };
      }
    }
  }

  if (bestRoll) {
    return {
      direct: false,
      canEnter: true,
      rollAngle: bestRoll.deg,
      margin: bestRoll.margin,
      projW: bestRoll.projW,
      projH: bestRoll.projH
    };
  }

  return {
    direct: false,
    canEnter: false,
    rollAngle: 0,
    margin: Math.min(apW - rot.w, apH - rot.h)
  };
}

/**
 * Calculates realistic usable cargo length at a given height above the cargo floor.
 * Real vehicle tailgates have a vertical lower steel panel up to the beltline (waistline).
 * Rake angle (forward slope of rear windscreen glass) only intrudes above the beltline.
 * Additionally, folding rear seats down provides extra forward clearance buffer.
 */
function calculateUsableLength(floorLength, heightAboveFloor, tanRake, seatsFolded, roofHeight) {
  const beltH = Math.min(24, roofHeight * 0.35); // Lower tailgate vertical panel height above boot floor
  const fwdBuffer = seatsFolded ? 14 : 0; // Forward buffer into folded seatback / footwell area
  const rakeIntrusion = Math.max(0, heightAboveFloor - beltH) * tanRake;
  return Math.max(20, (floorLength + fwdBuffer) - rakeIntrusion);
}

function solveAllFitmentAngles(car, rawL, rawW, rawH, seatsFolded) {
  const floorLength = seatsFolded ? car.floor_length_seats_folded : car.floor_length_seats_up;
  const archWidth = car.wheel_arch_width;
  const roofHeight = car.roof_height;
  const apWidth = car.aperture_width;
  const apHeight = car.aperture_height;
  const rakeRad = (car.rake_angle_deg * Math.PI) / 180;
  const tanRake = Math.tan(rakeRad);
  const cabinWidth = car.overall_width * 0.82;
  const beltH = Math.min(24, roofHeight * 0.35);
  const fwdBuffer = seatsFolded ? 14 : 0;

  const rotations = getUniqueRotations(rawL, rawW, rawH);

  let bestFlat = null;
  let bestPitch = null;
  let bestYaw = null;
  let bestRoll = null;
  let bestIngress = null;
  let failureReasons = [];

  for (const rot of rotations) {
    const ingress = checkApertureIngress(rot, apWidth, apHeight);
    const usableLengthAtH = calculateUsableLength(floorLength, rot.h, tanRake, seatsFolded, roofHeight);

    // Track best aperture ingress pass-through
    if (ingress.canEnter) {
      if (!bestIngress || ingress.margin > bestIngress.margin) {
        bestIngress = {
          rot,
          angle: ingress.rollAngle,
          margin: ingress.margin,
          ingress
        };
      }
    }

    // 1. Flat Orthogonal Test
    const passesArch = rot.w <= archWidth;
    const passesRoof = rot.h <= roofHeight;
    const passesRake = rot.l <= usableLengthAtH;

    if (passesArch && passesRoof && passesRake && ingress.canEnter) {
      const margin = Math.min(usableLengthAtH - rot.l, archWidth - rot.w, roofHeight - rot.h);
      if (!bestFlat || margin > bestFlat.margin) {
        bestFlat = {
          rot,
          margin,
          ingress,
          usableLengthAtH
        };
      }
    } else {
      if (!passesRake && passesArch && passesRoof) {
        failureReasons.push(`Hits sloping rear window (max length at ${rot.h} cm height is ~${Math.round(usableLengthAtH)} cm).`);
      } else if (!passesArch) {
        failureReasons.push(`Exceeds wheel arch width (${rot.w} cm vs ${archWidth} cm limit).`);
      } else if (!passesRoof) {
        failureReasons.push(`Exceeds interior roof height (${rot.h} cm vs ${roofHeight} cm limit).`);
      }
    }

    // 2. Seatback Pitch Tilt Test (Front elevated on folded seatback)
    if (rot.w <= archWidth && ingress.canEnter) {
      for (let deg = 2; deg <= 35; deg += 0.5) {
        const rad = (deg * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        const topFrontH = (rot.l * sinA) + (rot.h * cosA);
        if (topFrontH > roofHeight) continue;

        const horizSpan = rot.l * cosA;
        const maxAllowedSpan = seatsFolded ? (floorLength + 14) : floorLength;
        if (horizSpan > maxAllowedSpan) continue;

        const rearTopH = rot.h * cosA;
        const rearTopShiftX = rot.h * sinA;
        const glassXAtRearTop = Math.max(0, rearTopH - beltH) * tanRake;
        const glassClearance = (floorLength + fwdBuffer - horizSpan) + rearTopShiftX - glassXAtRearTop;
        const roofClearance = roofHeight - topFrontH;

        if (glassClearance >= 0 && roofClearance >= 0) {
          const margin = Math.min(glassClearance, roofClearance, archWidth - rot.w);
          if (!bestPitch || margin > bestPitch.margin) {
            bestPitch = {
              rot,
              angle: Math.round(deg * 10) / 10,
              margin,
              topFrontH,
              horizSpan,
              ingress
            };
          }
        }
      }
    }

    // 3. Diagonal Floor Yaw Test (Corner-to-corner across boot floor)
    if (rot.h <= roofHeight && ingress.canEnter) {
      for (let deg = 2; deg <= 40; deg += 0.5) {
        const rad = (deg * Math.PI) / 180;
        const cosP = Math.cos(rad);
        const sinP = Math.sin(rad);

        const boundingL = (rot.l * cosP) + (rot.w * sinP);
        const boundingW = (rot.l * sinP) + (rot.w * cosP);
        const usableL = calculateUsableLength(floorLength, rot.h, tanRake, seatsFolded, roofHeight);

        // Allows lateral expansion into cabin width forward of wheel arches
        const allowedWidth = boundingL > 75 ? Math.min(cabinWidth - 6, archWidth + 18) : archWidth;

        if (boundingL <= usableL && boundingW <= allowedWidth) {
          const margin = Math.min(usableL - boundingL, allowedWidth - boundingW, roofHeight - rot.h);
          if (!bestYaw || margin > bestYaw.margin) {
            bestYaw = {
              rot,
              angle: Math.round(deg * 10) / 10,
              margin,
              boundingL,
              boundingW,
              ingress
            };
          }
        }
      }
    }

    // 4. Banked Sidewall Roll Test (Banked against wheel arch/sidewall)
    if (ingress.canEnter) {
      for (let deg = 4; deg <= 50; deg += 0.5) {
        const rad = (deg * Math.PI) / 180;
        const projW = (rot.w * Math.cos(rad)) + (rot.h * Math.sin(rad));
        const projH = (rot.w * Math.sin(rad)) + (rot.h * Math.cos(rad));
        const usableL = calculateUsableLength(floorLength, projH, tanRake, seatsFolded, roofHeight);

        if (projW <= archWidth && projH <= roofHeight && rot.l <= usableL) {
          const margin = Math.min(archWidth - projW, roofHeight - projH, usableL - rot.l);
          if (!bestRoll || margin > bestRoll.margin) {
            bestRoll = {
              rot,
              angle: Math.round(deg * 10) / 10,
              margin,
              projW,
              projH,
              ingress
            };
          }
        }
      }
    }
  }

  // Synthesize Overall Optimal Strategy
  let overallOptimal = null;

  if (bestFlat && bestFlat.margin >= 4) {
    overallOptimal = {
      mode: 'flat',
      rot: bestFlat.rot,
      angle: 0,
      status: 'comfortable',
      margin: bestFlat.margin,
      ingress: bestFlat.ingress,
      heading: 'Fits Straight & Flat (Comfortable)',
      instruction: `Clears all cargo boundaries with a generous ${Math.round(bestFlat.margin)} cm buffer (orientation: ${bestFlat.rot.l} × ${bestFlat.rot.w} × ${bestFlat.rot.h} cm).`
    };
  } else if (bestFlat && !bestFlat.ingress.direct) {
    overallOptimal = {
      mode: 'ingress',
      rot: bestFlat.rot,
      angle: bestFlat.ingress.rollAngle,
      status: 'angled',
      margin: bestFlat.margin,
      ingress: bestFlat.ingress,
      heading: `Tilted Ingress Required (~${bestFlat.ingress.rollAngle}° Roll)`,
      instruction: `Too wide for standard flat entry, but slips through the tailgate opening when tilted at a ~${bestFlat.ingress.rollAngle}° roll angle, then lays flat on the boot floor!`
    };
  } else if (bestFlat) {
    overallOptimal = {
      mode: 'flat',
      rot: bestFlat.rot,
      angle: 0,
      status: 'tight',
      margin: bestFlat.margin,
      ingress: bestFlat.ingress,
      heading: 'Fits Flat (Tight Margin)',
      instruction: `Fits flat with a tight clearance margin of ${Math.round(bestFlat.margin * 10) / 10} cm. Close tailgate gently.`
    };
  } else if (bestPitch) {
    overallOptimal = {
      mode: 'pitch',
      rot: bestPitch.rot,
      angle: bestPitch.angle,
      status: 'angled',
      margin: bestPitch.margin,
      ingress: bestPitch.ingress,
      heading: `Seatback Tilt Fit (~${bestPitch.angle}° Tilt)`,
      instruction: `Hits the rear window glass if laid flat, but fits cleanly by propping the front edge up onto the seatback (~${bestPitch.angle}° tilt), pulling the rear face clear of the glass.`
    };
  } else if (bestYaw) {
    overallOptimal = {
      mode: 'yaw',
      rot: bestYaw.rot,
      angle: bestYaw.angle,
      status: 'angled',
      margin: bestYaw.margin,
      ingress: bestYaw.ingress,
      heading: `Diagonal Floor Fit (~${bestYaw.angle}° Angle)`,
      instruction: `Too long to fit straight, but clears comfortably when positioned diagonally corner-to-corner across the cargo bay.`
    };
  } else if (bestRoll) {
    overallOptimal = {
      mode: 'roll',
      rot: bestRoll.rot,
      angle: bestRoll.angle,
      status: 'angled',
      margin: bestRoll.margin,
      ingress: bestRoll.ingress,
      heading: `Banked Sidewall Fit (~${bestRoll.angle}° Roll)`,
      instruction: `Exceeds wheel arch width when flat, but fits safely banked against the sidewall/wheel arch at ~${bestRoll.angle}°.`
    };
  } else {
    overallOptimal = {
      mode: 'colliding',
      rot: { l: rawL, w: rawW, h: rawH },
      angle: 0,
      status: 'colliding',
      margin: -1,
      ingress: checkApertureIngress({ l: rawL, w: rawW, h: rawH }, apWidth, apHeight),
      heading: 'Will Not Fit',
      instruction: failureReasons[0] || 'Object dimensions exceed maximum interior vehicle limits.'
    };
  }

  return {
    optimal: overallOptimal,
    modes: {
      flat: bestFlat,
      pitch: bestPitch,
      yaw: bestYaw,
      roll: bestRoll,
      ingress: bestIngress
    },
    carLimits: {
      floorLength,
      archWidth,
      roofHeight,
      apWidth,
      apHeight,
      tanRake
    }
  };
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

  if (specFloor) specFloor.textContent = `${floorLength} cm (${seatsFolded ? 'seats folded' : 'seats up'})`;
  if (specArches) specArches.textContent = `${archWidth} cm`;
  if (specRoof) specRoof.textContent = `${roofHeight} cm`;
  if (specAperture) specAperture.textContent = `${apWidth} × ${apHeight} cm`;
  if (specsCarName) specsCarName.textContent = selectedCar.name;
  if (hudBodyType) hudBodyType.textContent = selectedCar.body_type.toUpperCase();

  if (rawL <= 0 || rawW <= 0 || rawH <= 0) {
    resultBanner.className = 'result-banner will-not-fit';
    resultBanner.textContent = 'Invalid Dimensions';
    resultExplanation.textContent = 'Please enter positive dimensions for length, width, and height.';
    if (strategyHeading) strategyHeading.textContent = 'Enter dimensions above';
    return;
  }

  currentSolverOutcome = solveAllFitmentAngles(selectedCar, rawL, rawW, rawH, seatsFolded);
  const optimal = currentSolverOutcome.optimal;

  let activeResult = null;

  if (activeAngleMode === 'auto') {
    activeResult = optimal;
    const optAngle = Math.round(activeResult.angle || 0);
    if (customAngleSlider) customAngleSlider.value = optAngle;
    if (angleValueBadge) angleValueBadge.textContent = `${optAngle}°`;
    if (angleSliderLabel) {
      if (activeResult.mode === 'pitch') angleSliderLabel.textContent = 'Seatback Tilt:';
      else if (activeResult.mode === 'yaw') angleSliderLabel.textContent = 'Diagonal Yaw:';
      else if (activeResult.mode === 'roll') angleSliderLabel.textContent = 'Bank Roll:';
      else if (activeResult.mode === 'ingress') angleSliderLabel.textContent = 'Ingress Roll:';
      else angleSliderLabel.textContent = 'Loading Angle:';
    }
    if (angleStatusHint) angleStatusHint.textContent = `Auto optimal: ${activeResult.heading}`;
  } else {
    // Mode explicitly selected by user
    const targetModeData = currentSolverOutcome.modes[activeAngleMode];
    const candidateRot = (targetModeData && targetModeData.rot) || optimal.rot;

    let testAngle = 0;
    if (manualAngleSliderValue !== null) {
      testAngle = manualAngleSliderValue;
    } else if (targetModeData && targetModeData.angle !== undefined) {
      testAngle = targetModeData.angle;
    } else {
      // Sensible default starting angles for manual mode testing
      if (activeAngleMode === 'pitch') testAngle = 14;
      else if (activeAngleMode === 'yaw') testAngle = 18;
      else if (activeAngleMode === 'roll') testAngle = 20;
      else if (activeAngleMode === 'ingress') testAngle = (targetModeData && targetModeData.ingress && !targetModeData.ingress.direct) ? targetModeData.ingress.rollAngle : 0;
      else testAngle = 0;
    }

    if (customAngleSlider) customAngleSlider.value = Math.round(testAngle);
    if (angleValueBadge) angleValueBadge.textContent = `${Math.round(testAngle)}°`;

    if (activeAngleMode === 'flat') {
      if (angleSliderLabel) angleSliderLabel.textContent = 'Loading Angle:';
      if (angleStatusHint) angleStatusHint.textContent = 'Flat 0° on cargo floor';
      if (customAngleSlider) customAngleSlider.value = 0;
      if (angleValueBadge) angleValueBadge.textContent = '0°';

      const passesArch = candidateRot.w <= archWidth;
      const passesRoof = candidateRot.h <= roofHeight;
      const usableL = calculateUsableLength(floorLength, candidateRot.h, tanRake, seatsFolded, roofHeight);
      const passesRake = candidateRot.l <= usableL;
      const ingress = checkApertureIngress(candidateRot, apWidth, apHeight);

      if (passesArch && passesRoof && passesRake && ingress.canEnter) {
        const m = Math.min(usableL - candidateRot.l, archWidth - candidateRot.w, roofHeight - candidateRot.h);
        activeResult = {
          mode: 'flat',
          rot: candidateRot,
          angle: 0,
          status: m >= 4 ? 'comfortable' : 'tight',
          margin: m,
          ingress,
          heading: m >= 4 ? 'Fits Flat (Comfortable)' : 'Fits Flat (Tight)',
          instruction: `Laid flat on boot floor with ${Math.round(m * 10) / 10} cm clearance buffer.`
        };
      } else {
        let failReasons = [];
        if (!passesArch) failReasons.push(`Width (${candidateRot.w} cm) exceeds wheel arches (${archWidth} cm)`);
        if (!passesRoof) failReasons.push(`Height (${candidateRot.h} cm) exceeds roof ceiling (${roofHeight} cm)`);
        if (!passesRake) failReasons.push(`Length (${candidateRot.l} cm) exceeds usable cargo depth (~${Math.round(usableL)} cm)`);
        if (!ingress.canEnter) failReasons.push('Exceeds tailgate aperture frame opening');

        activeResult = {
          mode: 'flat',
          rot: candidateRot,
          angle: 0,
          status: 'colliding',
          margin: -1,
          ingress,
          heading: 'Collides When Laid Flat',
          instruction: failReasons.join('; ') + '.'
        };
      }

    } else if (activeAngleMode === 'pitch') {
      if (angleSliderLabel) angleSliderLabel.textContent = 'Seatback Tilt:';
      if (angleStatusHint) angleStatusHint.textContent = 'Elevate front edge onto seatback';

      const rad = (testAngle * Math.PI) / 180;
      const topFrontH = (candidateRot.l * Math.sin(rad)) + (candidateRot.h * Math.cos(rad));
      const horizSpan = candidateRot.l * Math.cos(rad);
      const maxAllowedSpan = seatsFolded ? (floorLength + 14) : floorLength;
      const rearTopH = candidateRot.h * Math.cos(rad);
      const rearTopShiftX = candidateRot.h * Math.sin(rad);
      const beltH = Math.min(24, roofHeight * 0.35);
      const glassXAtRearTop = Math.max(0, rearTopH - beltH) * tanRake;
      const fwdBuffer = seatsFolded ? 14 : 0;
      const glassClearance = (floorLength + fwdBuffer - horizSpan) + rearTopShiftX - glassXAtRearTop;
      const roofClearance = roofHeight - topFrontH;
      const ingress = checkApertureIngress(candidateRot, apWidth, apHeight);

      const passesArch = candidateRot.w <= archWidth;
      const passesRoof = roofClearance >= 0;
      const passesSpan = horizSpan <= maxAllowedSpan;
      const passesGlass = glassClearance >= 0;
      const passesIngress = ingress.canEnter;
      const clears = passesArch && passesRoof && passesSpan && passesGlass && passesIngress;

      let instruction = '';
      if (clears) {
        instruction = `Tilted ~${Math.round(testAngle)}° with front propped on seatback. Clears glass by ${Math.round(glassClearance * 10) / 10} cm, ceiling by ${Math.round(roofClearance * 10) / 10} cm.`;
      } else {
        let failReasons = [];
        if (!passesRoof) failReasons.push(`Hits ceiling (elevated front reaches ${Math.round(topFrontH)} cm vs ${roofHeight} cm roof limit)`);
        if (!passesGlass) failReasons.push('Rear edge contacts sloping rear window');
        if (!passesArch) failReasons.push(`Width (${candidateRot.w} cm) exceeds wheel arches (${archWidth} cm)`);
        if (!passesSpan) failReasons.push('Horizontal span exceeds cargo floor depth');
        if (!passesIngress) failReasons.push('Exceeds tailgate aperture frame');
        instruction = `At ${Math.round(testAngle)}° tilt: ${failReasons.join('; ')}.`;
      }

      activeResult = {
        mode: 'pitch',
        rot: candidateRot,
        angle: testAngle,
        status: clears ? 'angled' : 'colliding',
        margin: clears ? Math.min(glassClearance, roofClearance) : -1,
        ingress,
        heading: clears ? `Seatback Tilt (~${Math.round(testAngle)}° Tilt)` : `Tilt Colliding at ${Math.round(testAngle)}°`,
        instruction
      };

    } else if (activeAngleMode === 'yaw') {
      if (angleSliderLabel) angleSliderLabel.textContent = 'Diagonal Yaw:';
      if (angleStatusHint) angleStatusHint.textContent = 'Angle corner-to-corner across floor';

      const rad = (testAngle * Math.PI) / 180;
      const boundingL = (candidateRot.l * Math.cos(rad)) + (candidateRot.w * Math.sin(rad));
      const boundingW = (candidateRot.l * Math.sin(rad)) + (candidateRot.w * Math.cos(rad));
      const usableL = calculateUsableLength(floorLength, candidateRot.h, tanRake, seatsFolded, roofHeight);
      const cabinWidth = selectedCar.overall_width * 0.82;
      const allowedW = boundingL > 75 ? Math.min(cabinWidth - 6, archWidth + 18) : archWidth;
      const ingress = checkApertureIngress(candidateRot, apWidth, apHeight);

      const passesL = boundingL <= usableL;
      const passesW = boundingW <= allowedW;
      const passesRoof = candidateRot.h <= roofHeight;
      const passesIngress = ingress.canEnter;
      const clears = passesL && passesW && passesRoof && passesIngress;

      let instruction = '';
      if (clears) {
        instruction = `Angled ${Math.round(testAngle)}° diagonally across cargo floor with ${Math.round((usableL - boundingL) * 10) / 10} cm length margin and ${Math.round(allowedW - boundingW)} cm lateral clearance.`;
      } else {
        let failReasons = [];
        if (!passesL) failReasons.push(`Diagonal length span (${Math.round(boundingL)} cm) exceeds usable cargo depth (~${Math.round(usableL)} cm)`);
        if (!passesW) failReasons.push(`Diagonal width span (${Math.round(boundingW)} cm) exceeds bay width (${Math.round(allowedW)} cm)`);
        if (!passesRoof) failReasons.push(`Height (${candidateRot.h} cm) exceeds roof ceiling (${roofHeight} cm)`);
        if (!passesIngress) failReasons.push('Cannot enter tailgate aperture opening');
        instruction = `At ${Math.round(testAngle)}° diagonal angle: ${failReasons.join('; ')}.`;
      }

      activeResult = {
        mode: 'yaw',
        rot: candidateRot,
        angle: testAngle,
        status: clears ? 'angled' : 'colliding',
        margin: clears ? Math.min(usableL - boundingL, allowedW - boundingW, roofHeight - candidateRot.h) : -1,
        ingress,
        heading: clears ? `Diagonal Floor (~${Math.round(testAngle)}° Angle)` : `Diagonal Colliding at ${Math.round(testAngle)}°`,
        instruction
      };

    } else if (activeAngleMode === 'roll') {
      if (angleSliderLabel) angleSliderLabel.textContent = 'Bank Roll:';
      if (angleStatusHint) angleStatusHint.textContent = 'Lean against sidewall / wheel arch';

      const rad = (testAngle * Math.PI) / 180;
      const projW = (candidateRot.w * Math.cos(rad)) + (candidateRot.h * Math.sin(rad));
      const projH = (candidateRot.w * Math.sin(rad)) + (candidateRot.h * Math.cos(rad));
      const usableL = calculateUsableLength(floorLength, projH, tanRake, seatsFolded, roofHeight);
      const ingress = checkApertureIngress(candidateRot, apWidth, apHeight);

      const passesArch = projW <= archWidth;
      const passesRoof = projH <= roofHeight;
      const passesLength = candidateRot.l <= usableL;
      const passesIngress = ingress.canEnter;
      const clears = passesArch && passesRoof && passesLength && passesIngress;

      let instruction = '';
      if (clears) {
        instruction = `Banked at ~${Math.round(testAngle)}° against sidewall. Projected width is ${Math.round(projW)} cm (limit ${archWidth} cm), height is ${Math.round(projH)} cm (limit ${roofHeight} cm), with ${Math.round((usableL - candidateRot.l) * 10) / 10} cm length margin.`;
      } else {
        let failReasons = [];
        if (!passesArch) failReasons.push(`Banked width (${Math.round(projW)} cm) exceeds wheel arches (${archWidth} cm)`);
        if (!passesRoof) failReasons.push(`Banked height (${Math.round(projH)} cm) exceeds roof ceiling (${roofHeight} cm)`);
        if (!passesLength) failReasons.push(`Length (${candidateRot.l} cm) contacts sloping window glass at this height (limit ~${Math.round(usableL)} cm)`);
        if (!passesIngress) failReasons.push('Exceeds tailgate aperture frame opening');
        instruction = `At ${Math.round(testAngle)}° roll: ${failReasons.join('; ')}.`;
      }

      activeResult = {
        mode: 'roll',
        rot: candidateRot,
        angle: testAngle,
        status: clears ? 'angled' : 'colliding',
        margin: clears ? Math.min(archWidth - projW, roofHeight - projH, usableL - candidateRot.l) : -1,
        ingress,
        heading: clears ? `Banked Sidewall (~${Math.round(testAngle)}° Roll)` : `Banked Colliding at ${Math.round(testAngle)}°`,
        instruction
      };

    } else if (activeAngleMode === 'ingress') {
      if (angleSliderLabel) angleSliderLabel.textContent = 'Ingress Roll:';
      if (angleStatusHint) angleStatusHint.textContent = 'Clearance passing tailgate frame';

      const rad = (testAngle * Math.PI) / 180;
      const projW = (candidateRot.w * Math.cos(rad)) + (candidateRot.h * Math.sin(rad));
      const projH = (candidateRot.w * Math.sin(rad)) + (candidateRot.h * Math.cos(rad));
      const passesAperture = (projW <= apWidth && projH <= apHeight);
      const margin = passesAperture ? Math.min(apWidth - projW, apHeight - projH) : -Math.max(projW - apWidth, projH - apHeight);
      const ingress = {
        direct: testAngle === 0 && passesAperture,
        canEnter: passesAperture,
        rollAngle: testAngle,
        margin: Math.round(margin * 10) / 10
      };

      let instruction = '';
      if (passesAperture) {
        instruction = testAngle > 0
          ? `Slips through the ${apWidth} × ${apHeight} cm tailgate opening tilted at ~${Math.round(testAngle)}° roll with ${Math.round(margin)} cm clearance.`
          : `Passes directly through the ${apWidth} × ${apHeight} cm tailgate aperture without tilting with ${Math.round(margin)} cm clearance buffer.`;
      } else {
        let failReasons = [];
        if (projW > apWidth) failReasons.push(`Width (${Math.round(projW)} cm vs ${apWidth} cm opening width)`);
        if (projH > apHeight) failReasons.push(`Height (${Math.round(projH)} cm vs ${apHeight} cm opening height)`);
        instruction = `At ${Math.round(testAngle)}° ingress angle, item exceeds tailgate frame: ${failReasons.join(', ')}.`;
      }

      activeResult = {
        mode: 'ingress',
        rot: candidateRot,
        angle: testAngle,
        status: passesAperture ? (testAngle > 0 ? 'angled' : 'comfortable') : 'colliding',
        margin: Math.round(margin * 10) / 10,
        ingress,
        heading: passesAperture
          ? (testAngle > 0 ? `Hatch Entry Clears (~${Math.round(testAngle)}° Roll)` : `Direct Hatch Entry Clears (0°)`)
          : `Aperture Blocked at ${Math.round(testAngle)}°`,
        instruction
      };
    }
  }

  lastFitResult = activeResult;

  // Update UI Elements
  if (activeResult.status === 'comfortable') {
    resultBanner.className = 'result-banner fits-comfortable';
    resultBanner.textContent = 'Fits Comfortably';
    sideBadge.className = 'badge badge-clears';
    sideBadge.textContent = 'Clears';
    rearBadge.className = 'badge badge-clears';
    rearBadge.textContent = 'Clears';
  } else if (activeResult.status === 'tight') {
    resultBanner.className = 'result-banner fits-tight';
    resultBanner.textContent = 'Tight Fit';
    sideBadge.className = 'badge badge-clears';
    sideBadge.textContent = 'Clears';
    rearBadge.className = 'badge badge-clears';
    rearBadge.textContent = 'Clears';
  } else if (activeResult.status === 'angled') {
    resultBanner.className = 'result-banner fits-angled';
    resultBanner.textContent = `Fits at an Angle (~${Math.round(activeResult.angle)}°)`;
    sideBadge.className = 'badge badge-angled';
    sideBadge.textContent = `Angle ~${Math.round(activeResult.angle)}°`;
    rearBadge.className = 'badge badge-clears';
    rearBadge.textContent = 'Clears';
  } else {
    resultBanner.className = 'result-banner will-not-fit';
    resultBanner.textContent = 'Will Not Fit';
    sideBadge.className = 'badge badge-colliding';
    sideBadge.textContent = 'Colliding';
    rearBadge.className = 'badge badge-colliding';
    rearBadge.textContent = 'Colliding';
  }

  resultExplanation.textContent = activeResult.instruction;

  if (strategyBadge) {
    strategyBadge.textContent = activeAngleMode === 'auto' ? 'OPTIMAL STRATEGY' : `${activeAngleMode.toUpperCase()} STRATEGY`;
  }
  if (strategyHeading) {
    strategyHeading.textContent = activeResult.heading;
  }

  // Update Status Chips
  if (chipIngress && activeResult.ingress) {
    if (activeResult.ingress.canEnter) {
      chipIngress.className = 'strategy-chip clears';
      chipIngress.textContent = activeResult.ingress.direct
        ? '🚪 Hatch Entry: Direct (0°)'
        : `🚪 Hatch Entry: Clears (Tilted ~${Math.round(activeResult.ingress.rollAngle)}°)`;
    } else {
      chipIngress.className = 'strategy-chip colliding';
      chipIngress.textContent = '🚪 Hatch Entry: Blocked';
    }
  }

  if (chipStowed) {
    if (activeResult.status === 'comfortable' || activeResult.status === 'tight') {
      chipStowed.className = 'strategy-chip clears';
      chipStowed.textContent = `📦 Boot Stowed: Flat (+${Math.max(0, Math.round(activeResult.margin))} cm buffer)`;
    } else if (activeResult.status === 'angled') {
      chipStowed.className = 'strategy-chip angled';
      chipStowed.textContent = `📦 Boot Stowed: Angled ~${Math.round(activeResult.angle)}° (+${Math.max(0, Math.round(activeResult.margin))} cm)`;
    } else {
      chipStowed.className = 'strategy-chip colliding';
      chipStowed.textContent = '📦 Boot Stowed: Colliding';
    }
  }

  renderSideSvg(activeResult.rot, floorLength, roofHeight, tanRake, activeResult.mode, activeResult.angle, seatsFolded, selectedCar);
  renderRearSvg(activeResult.rot, archWidth, roofHeight, apWidth, apHeight, activeResult.status === 'colliding', selectedCar.body_type, activeResult.mode, activeResult.angle);
  update3DStudio(selectedCar, seatsFolded, activeResult);
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

  // Smooth Loading Ingress Animation
  if (isIngressSimulating) {
    ingressSimProgress += 0.007;
    if (ingressSimProgress >= 1.0) {
      ingressSimProgress = 1.0;
      isIngressSimulating = false;
      if (btnSimulateIngress) {
        btnSimulateIngress.classList.remove('playing');
        if (animBtnLabel) animBtnLabel.textContent = 'Replay Loading';
      }
    }
    updateCargoSimulationFrame(ingressSimProgress);
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
  } else if (view === 'ingress') {
    fallbackOrbit.theta = 0;
    fallbackOrbit.phi = 1.48;
  } else {
    fallbackOrbit.theta = 0.85;
    fallbackOrbit.phi = 1.18;
  }

  if (controls) {
    if (view === 'side') camera.position.set(-50, 42, 310);
    else if (view === 'rear') camera.position.set(230, 45, 0);
    else if (view === 'top') camera.position.set(-50, 360, 0);
    else if (view === 'ingress') {
      camera.position.set(135, 60, 0);
      targetCenter.set(30, 48, 0);
    } else camera.position.set(165, 110, 145);
    controls.target.copy(targetCenter);
    controls.update();
  } else {
    updateCameraFromSpherical();
  }
}

/**
 * Procedural Realistic 3D Wheel Assembly
 */
function createWheel3D(radius = 30, width = 22, isSUV = false) {
  const wheelGroup = new THREE.Group();

  // Rubber Tire with tread thickness
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 32);
  const tireMat = new THREE.MeshStandardMaterial({
    color: isSUV ? 0x0c1018 : 0x111622,
    roughness: 0.9,
    metalness: 0.05
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.rotation.x = Math.PI / 2;
  wheelGroup.add(tire);

  // Outer Silver Rim Lip
  const rimRadius = isSUV ? radius * 0.68 : radius * 0.74;
  const rimRingGeo = new THREE.TorusGeometry(rimRadius, 2.4, 16, 32);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.15
  });
  const rimRing = new THREE.Mesh(rimRingGeo, rimMat);
  wheelGroup.add(rimRing);

  // Multi-Spoke Alloy Design
  const spokeCount = isSUV ? 6 : 5;
  const spokeGeo = new THREE.BoxGeometry(3.2, rimRadius * 1.85, 3.2);
  for (let i = 0; i < spokeCount; i++) {
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.rotation.z = (i * Math.PI) / (spokeCount / 2);
    wheelGroup.add(spoke);
  }

  // Steel Brake Rotor Disc
  const discGeo = new THREE.CylinderGeometry(radius * 0.52, radius * 0.52, 2.2, 24);
  const discMat = new THREE.MeshStandardMaterial({ color: 0x8896a6, metalness: 0.92, roughness: 0.22 });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = Math.PI / 2;
  wheelGroup.add(disc);

  // Sport Red Caliper
  const caliperGeo = new THREE.BoxGeometry(7, 13, 5);
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(radius * 0.36, radius * 0.24, 0);
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
 * Creates aerodynamic side wing mirror with indicator strip and reflective glass.
 */
function createSideMirror3D(isLeft, bodyPaintMat, trimMat) {
  const mirrorGroup = new THREE.Group();

  // Mounting arm
  const stemGeo = new THREE.BoxGeometry(4.5, 3.0, 7.0);
  const stem = new THREE.Mesh(stemGeo, trimMat);
  stem.position.set(0, 0, isLeft ? 3.5 : -3.5);
  mirrorGroup.add(stem);

  // Aerodynamic painted mirror housing
  const housingGeo = new THREE.BoxGeometry(11, 7.5, 6);
  const housing = new THREE.Mesh(housingGeo, bodyPaintMat);
  housing.position.set(1, 1.5, isLeft ? 8.5 : -8.5);
  housing.rotation.y = isLeft ? -0.15 : 0.15;
  mirrorGroup.add(housing);

  // Mirror glass face
  const mirrorGlassGeo = new THREE.BoxGeometry(0.8, 6.2, 5.0);
  const mirrorGlassMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.98,
    roughness: 0.05
  });
  const mirrorFace = new THREE.Mesh(mirrorGlassGeo, mirrorGlassMat);
  mirrorFace.position.set(housing.position.x + 5.2, housing.position.y, housing.position.z);
  mirrorGroup.add(mirrorFace);

  // Amber LED turn signal strip
  const indicatorGeo = new THREE.BoxGeometry(6, 1.2, 0.8);
  const indicatorMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.2
  });
  const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
  indicator.position.set(housing.position.x - 2, housing.position.y, isLeft ? housing.position.z + 3.1 : housing.position.z - 3.1);
  mirrorGroup.add(indicator);

  return mirrorGroup;
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
 * Main 3D Studio Update: Generates 1:1 scale authentic CAD vehicle body types,
 * distinctive greenhouses (Estate D-pillars, Saloon 3-box trunk deck, SUV cladding),
 * side mirrors, interior carpet bay, toggleable boot, and multi-angle cargo placement.
 */
function update3DStudio(car, seatsFolded, fitResult) {
  if (!scene) return;

  // Reset active simulation when geometry updates to avoid orphan anim loops
  isIngressSimulating = false;
  if (btnSimulateIngress) btnSimulateIngress.classList.remove('playing');
  if (animBtnLabel) animBtnLabel.textContent = 'Simulate Loading';

  if (car3DGroup) scene.remove(car3DGroup);
  if (cargo3DMesh) scene.remove(cargo3DMesh);
  if (cargoSimulationBaseGroup) scene.remove(cargoSimulationBaseGroup);

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

  // Ground clearance and sill threshold
  const groundY = 0;
  const sillY = isSUV ? 58 : (isSaloon ? 44 : (isEstate ? 45 : 46));
  const cabinFloorY = sillY - 14;
  const wheelRadius = isSUV ? 35 : (isHatch ? 30 : 31.5);
  const wheelArchR = wheelRadius + (isSUV ? 5.5 : 4.5);
  const wheelY = wheelRadius;

  // FIXED VEHICLE DATUM: Rear bumper is at +X, front nose is at -X
  const rearBumperX = 70;
  const rearSillX = rearBumperX - (isEstate ? 18 : (isSaloon ? 24 : 22));
  const carFrontX = rearBumperX - totalLength;

  // Wheelbase alignment
  const rearWheelX = rearSillX - (isEstate ? 48 : (isSaloon ? 44 : 38));
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
    // Estate: Long flat roofline extending back to rear sill
    roofRearX = rearSillX - 8;
    deckFrontX = rearSillX;
  } else if (isSUV) {
    roofRearX = rearWheelX + 8;
    deckFrontX = rearSillX;
  } else {
    // Hatchback: Compact roof tapering to sporty rear roof spoiler
    roofRearX = rearWheelX - 6;
    deckFrontX = rearSillX;
  }

  const bPillarX = (roofFrontX + (isSaloon ? deckFrontX : (isEstate ? rearWheelX : roofRearX))) / 2 - 2;
  const cPillarX = isEstate ? (bPillarX + (roofRearX - bPillarX) * 0.58) : (isSaloon ? deckFrontX : roofRearX);
  const dPillarX = isEstate ? roofRearX : null;

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

  const claddingMat = new THREE.MeshStandardMaterial({
    color: 0x0a0f18, // Matte charcoal protective SUV cladding
    roughness: 0.9,
    metalness: 0.1
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

  // 1. FOUR WHEELS
  const wheelZOffset = (totalCarWidth / 2) - 2;
  const wheelPositions = [
    [frontWheelX, wheelY, wheelZOffset],
    [frontWheelX, wheelY, -wheelZOffset],
    [rearWheelX, wheelY, wheelZOffset],
    [rearWheelX, wheelY, -wheelZOffset]
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheel = createWheel3D(wheelRadius, 22, isSUV);
    wheel.position.set(wx, wy, wz);
    if (wz < 0) wheel.rotation.y = Math.PI;
    car3DGroup.add(wheel);
  });

  // 2. AUTHENTIC BODY-SPECIFIC FLANKS
  const flankShape = new THREE.Shape();
  flankShape.moveTo(carFrontX, sillY - 12);
  flankShape.lineTo(carFrontX, sillY + 4);
  flankShape.lineTo(carFrontX + 12, beltY - 2);
  flankShape.lineTo(cowlX, beltY);

  if (isSaloon) {
    // Saloon: Horizontal rear deck trunk notch
    flankShape.lineTo(deckFrontX, beltY);
    flankShape.lineTo(rearBumperX - 4, beltY - 2);
  } else if (isEstate) {
    // Estate: Long rear cargo flank
    flankShape.lineTo(rearSillX + 4, beltY);
  } else if (isSUV) {
    // SUV: Bold shoulder line
    flankShape.lineTo(rearSillX + 2, beltY + 2);
  } else {
    // Hatchback
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

  // SUV Protective Wheel Arch Cladding Flares
  if (isSUV) {
    [-wheelZOffset, wheelZOffset - 3].forEach(zPos => {
      [frontWheelX, rearWheelX].forEach(wx => {
        const archCladGeo = new THREE.TorusGeometry(wheelArchR + 1.5, 2.8, 12, 24, Math.PI);
        const archClad = new THREE.Mesh(archCladGeo, claddingMat);
        archClad.position.set(wx, wheelY, zPos + 1.5);
        archClad.rotation.z = Math.PI;
        car3DGroup.add(archClad);
      });

      // Rocker panel protective cladding
      const rockerGeo = new THREE.BoxGeometry(Math.abs(rearWheelX - frontWheelX) - (wheelArchR * 2), 6, 2.5);
      const rocker = new THREE.Mesh(rockerGeo, claddingMat);
      rocker.position.set((frontWheelX + rearWheelX) / 2, sillY - 12, zPos + 1.5);
      car3DGroup.add(rocker);
    });
  }

  // 3. GREENHOUSE PILLARS (Tailored to Body Type)
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

    // Front Door Window
    const fWinWidth = Math.abs(bPillarX - cowlX) - 5;
    const winHeight = roofTopY - beltY - 6;
    const fWinGeo = new THREE.BoxGeometry(fWinWidth, winHeight, 1.2);
    const fWin = new THREE.Mesh(fWinGeo, glassMat);
    fWin.position.set((cowlX + bPillarX) / 2 + 2, beltY + (winHeight / 2) + 1, zPos + 1.5);
    car3DGroup.add(fWin);

    if (isEstate) {
      // Estate: C-Pillar, D-Pillar, Rear Door Window AND Panoramic Cargo Quarter Window!
      // C-Pillar post
      const cPillarGeo = new THREE.BoxGeometry(6.0, bHeight, 3.2);
      const cPillar = new THREE.Mesh(cPillarGeo, pillarMat);
      cPillar.position.set(cPillarX, beltY + (bHeight / 2), zPos + 1.5);
      car3DGroup.add(cPillar);

      // Rear Door Window
      const rWinWidth = Math.abs(cPillarX - bPillarX) - 5;
      const rWinGeo = new THREE.BoxGeometry(rWinWidth, winHeight, 1.2);
      const rWin = new THREE.Mesh(rWinGeo, glassMat);
      rWin.position.set((bPillarX + cPillarX) / 2, beltY + (winHeight / 2) + 1, zPos + 1.5);
      car3DGroup.add(rWin);

      // D-Pillar at rear tailgate corner
      const dLen = Math.hypot(rearSillX - roofRearX, roofTopY - beltY);
      const dAngle = Math.atan2(roofTopY - beltY, roofRearX - rearSillX);
      const dPillarGeo = new THREE.BoxGeometry(dLen, 5.5, 3.5);
      const dPillar = new THREE.Mesh(dPillarGeo, bodyPaintMat);
      dPillar.position.set((roofRearX + rearSillX) / 2, (beltY + roofTopY) / 2, zPos + 1.5);
      dPillar.rotation.z = -dAngle;
      car3DGroup.add(dPillar);

      // Panoramic Rear Cargo Quarter Window (Unique to Estate!)
      const cargoWinWidth = Math.abs(roofRearX - cPillarX) - 6;
      const cargoWinGeo = new THREE.BoxGeometry(cargoWinWidth, winHeight - 2, 1.2);
      const cargoWin = new THREE.Mesh(cargoWinGeo, glassMat);
      cargoWin.position.set((cPillarX + roofRearX) / 2, beltY + (winHeight / 2), zPos + 1.5);
      car3DGroup.add(cargoWin);

    } else if (isSaloon) {
      // Saloon: Sloping C-pillar down to trunk deck
      const cLen = Math.hypot(deckFrontX - roofRearX, roofTopY - beltY);
      const cAngle = Math.atan2(roofTopY - beltY, roofRearX - deckFrontX);
      const cPillarGeo = new THREE.BoxGeometry(cLen, 5.5, 3.5);
      const cPillar = new THREE.Mesh(cPillarGeo, bodyPaintMat);
      cPillar.position.set((roofRearX + deckFrontX) / 2, (beltY + roofTopY) / 2, zPos + 1.5);
      cPillar.rotation.z = -cAngle;
      car3DGroup.add(cPillar);

      // Rear Door Window
      const rWinWidth = Math.abs(deckFrontX - bPillarX) - 6;
      const rWinGeo = new THREE.BoxGeometry(rWinWidth, winHeight, 1.2);
      const rWin = new THREE.Mesh(rWinGeo, glassMat);
      rWin.position.set((bPillarX + deckFrontX) / 2, beltY + (winHeight / 2) + 1, zPos + 1.5);
      car3DGroup.add(rWin);

    } else {
      // Hatchback / SUV
      const cLen = Math.hypot(rearSillX - roofRearX, roofTopY - beltY);
      const cAngle = Math.atan2(roofTopY - beltY, roofRearX - rearSillX);
      const cPillarGeo = new THREE.BoxGeometry(cLen, 5.5, 3.5);
      const cPillar = new THREE.Mesh(cPillarGeo, bodyPaintMat);
      cPillar.position.set((roofRearX + rearSillX) / 2, (beltY + roofTopY) / 2, zPos + 1.5);
      cPillar.rotation.z = -cAngle;
      car3DGroup.add(cPillar);

      // Rear Door Window
      const rWinWidth = Math.abs(roofRearX - bPillarX) - 6;
      const rWinGeo = new THREE.BoxGeometry(rWinWidth, winHeight, 1.2);
      const rWin = new THREE.Mesh(rWinGeo, glassMat);
      rWin.position.set((bPillarX + roofRearX) / 2, beltY + (winHeight / 2) + 1, zPos + 1.5);
      car3DGroup.add(rWin);
    }
  });

  // 4. SIDE WING MIRRORS
  const leftMirror = createSideMirror3D(true, bodyPaintMat, trimMat);
  leftMirror.position.set(cowlX + 4, beltY + 2, (totalCarWidth / 2) - 4);
  car3DGroup.add(leftMirror);

  const rightMirror = createSideMirror3D(false, bodyPaintMat, trimMat);
  rightMirror.position.set(cowlX + 4, beltY + 2, -((totalCarWidth / 2) - 4));
  car3DGroup.add(rightMirror);

  // 5. DOOR HANDLES
  [-wheelZOffset, wheelZOffset - 2].forEach(zPos => {
    [bPillarX - 22, bPillarX + 26].forEach(hx => {
      const handleGeo = new THREE.BoxGeometry(9, 2.2, 1.8);
      const handle = new THREE.Mesh(handleGeo, bodyPaintMat);
      handle.position.set(hx, beltY - 5, zPos + (zPos > 0 ? 3 : -3));
      car3DGroup.add(handle);
    });
  });

  // 6. FRONT BONNET / HOOD & WINDSHIELD
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

  // 7. ROOF PANEL (Panoramic Glass for Tesla Model Y)
  const roofLen = Math.abs(roofRearX - roofFrontX);
  const roofGeo = new THREE.BoxGeometry(roofLen, 2.2, cabinWidth - 4);
  const roofMesh = new THREE.Mesh(roofGeo, (car.id.includes('tesla') ? glassMat : bodyPaintMat));
  roofMesh.position.set((roofFrontX + roofRearX) / 2, roofTopY - 1.1, 0);
  addCadEdges(roofMesh, 0x38bdf8);
  car3DGroup.add(roofMesh);

  // Longitudinal Roof Rails (Estate & SUV)
  if (isEstate || isSUV) {
    [-((cabinWidth / 2) - 1), (cabinWidth / 2) - 1].forEach(rz => {
      const railGeo = new THREE.CylinderGeometry(1.6, 1.6, roofLen + (isEstate ? 16 : 8), 12);
      const rail = new THREE.Mesh(railGeo, chromeMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.set((roofFrontX + roofRearX) / 2, roofTopY + 3.2, rz);
      car3DGroup.add(rail);

      [-0.42, 0, 0.42].forEach(offsetPct => {
        const postGeo = new THREE.BoxGeometry(3, 3.5, 2.5);
        const post = new THREE.Mesh(postGeo, chromeMat);
        post.position.set((roofFrontX + roofRearX) / 2 + (roofLen * offsetPct), roofTopY + 1.5, rz);
        car3DGroup.add(post);
      });
    });
  }

  // 8. FRONT FASCIA, HEADLAMPS & SKID PLATES
  const frontBumperGeo = new THREE.BoxGeometry(8, isSUV ? 28 : 22, totalCarWidth - 4);
  const frontBumper = new THREE.Mesh(frontBumperGeo, bodyPaintMat);
  frontBumper.position.set(carFrontX + 4, sillY - 2, 0);
  car3DGroup.add(frontBumper);

  // Underbody Skid Plate for SUV
  if (isSUV) {
    const skidGeo = new THREE.BoxGeometry(10, 8, totalCarWidth - 40);
    const skid = new THREE.Mesh(skidGeo, chromeMat);
    skid.position.set(carFrontX + 4, sillY - 12, 0);
    car3DGroup.add(skid);
  }

  // Front Headlights with dual projector styling
  [-1, 1].forEach(dir => {
    const headGeo = new THREE.BoxGeometry(10, 7.5, 22);
    const head = new THREE.Mesh(headGeo, headlampMat);
    head.position.set(carFrontX + 6, sillY + 6, dir * ((totalCarWidth / 2) - 20));
    car3DGroup.add(head);
  });

  // 9. TOGGLEABLE REAR BOOT / TAILGATE ASSEMBLY
  tailgatePivot = new THREE.Group();
  const openAngle = getOpenTailgateAngle(bodyType);

  if (isSaloon) {
    // SALOON NOTCHBACK SPECIFICS:
    // Fixed rear glass window stays in place!
    const rearWinLen = Math.hypot(deckFrontX - roofRearX, roofTopY - beltY);
    const rearWinAngle = Math.atan2(roofTopY - beltY, deckFrontX - roofRearX);
    const rearWinGeo = new THREE.BoxGeometry(rearWinLen - 4, 1.8, cabinWidth - 8);
    const rearWin = new THREE.Mesh(rearWinGeo, glassMat);
    rearWin.position.set((roofRearX + deckFrontX) / 2, (roofTopY + beltY) / 2, 0);
    rearWin.rotation.z = -rearWinAngle;
    car3DGroup.add(rearWin);

    // Solid Interior Rear Parcel Shelf separating cabin from trunk
    const parcelGeo = new THREE.BoxGeometry(32, 2.5, cabinWidth - 6);
    const parcelShelf = new THREE.Mesh(parcelGeo, trimMat);
    parcelShelf.position.set(rearWheelX - 6, beltY + 1.25, 0);
    car3DGroup.add(parcelShelf);

    // Shark fin antenna on roof
    const finGeo = new THREE.ConeGeometry(2.5, 6, 4);
    const fin = new THREE.Mesh(finGeo, bodyPaintMat);
    fin.position.set(roofRearX - 8, roofTopY + 3, 0);
    fin.rotation.y = Math.PI / 4;
    car3DGroup.add(fin);

    // Trunk lid hinges at deck joint (deckFrontX, beltY, 0)
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
    // HATCHBACK, ESTATE & SUV: Hinges at (roofRearX, roofTopY, 0)
    tailgatePivot.position.set(roofRearX, roofTopY, 0);

    const hatchSpanX = Math.abs(rearBumperX - roofRearX) - 4;
    const hatchSpanY = Math.abs(roofTopY - (sillY + 8));
    const hatchDiagonal = Math.hypot(hatchSpanX, hatchSpanY);
    const hatchAngle = Math.atan2(hatchSpanY, hatchSpanX);

    // Roof Spoiler Lip
    const spoilerGeo = new THREE.BoxGeometry(isHatch ? 14 : 10, 3.5, cabinWidth - 4);
    const spoiler = new THREE.Mesh(spoilerGeo, bodyPaintMat);
    spoiler.position.set(4, 1.5, 0);
    tailgatePivot.add(spoiler);

    // High 3rd Brake Light
    const thirdBrakeGeo = new THREE.BoxGeometry(2, 2, 28);
    const thirdBrake = new THREE.Mesh(thirdBrakeGeo, taillampMat);
    thirdBrake.position.set(8, 2.5, 0);
    tailgatePivot.add(thirdBrake);

    // Rear Hatch Window (Glass)
    const glassLen = hatchDiagonal * (isEstate ? 0.58 : 0.52);
    const rearHatchGlassGeo = new THREE.BoxGeometry(glassLen, 1.8, cabinWidth - 8);
    const rearHatchGlass = new THREE.Mesh(rearHatchGlassGeo, glassMat);
    rearHatchGlass.position.set(hatchSpanX * 0.28, -hatchSpanY * 0.28, 0);
    rearHatchGlass.rotation.z = -hatchAngle;
    tailgatePivot.add(rearHatchGlass);

    // Lower Tailgate Sheet Metal
    const sheetLen = hatchDiagonal * (isEstate ? 0.42 : 0.48);
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

    // Hydraulic Gas Struts
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

  targetTailgateAngle = isTailgateOpen ? openAngle : 0;
  currentTailgateAngle = targetTailgateAngle;
  tailgatePivot.rotation.z = currentTailgateAngle;
  car3DGroup.add(tailgatePivot);

  // 10. APERTURE CAD BOUNDARY FRAME
  const apWidth = car.aperture_width;
  const apHeight = car.aperture_height;
  const isApertureColliding = fitResult && fitResult.ingress && !fitResult.ingress.canEnter;

  const apFrameGeo = new THREE.BoxGeometry(1.5, apHeight, apWidth);
  const apFrameMat = new THREE.LineBasicMaterial({
    color: isApertureColliding ? 0xef4444 : 0x38bdf8,
    linewidth: 2
  });
  const apFrame = new THREE.LineSegments(new THREE.EdgesGeometry(apFrameGeo), apFrameMat);
  apFrame.position.set(rearSillX, sillY + (apHeight / 2), 0);
  car3DGroup.add(apFrame);

  // 11. INTERIOR CARGO BAY & SEATING ARCHITECTURE
  // Cargo Floor Carpet
  const bootFloorGeo = new THREE.BoxGeometry(currentFloorLen, 2.5, archW);
  const bootFloorMat = new THREE.MeshStandardMaterial({
    color: 0x18263e,
    roughness: 0.85,
    transparent: true,
    opacity: 0.8
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

  // 12. PHYSICAL CARGO BOX (High-contrast 1:1 CAD scale, multi-angle positioning)
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

    // Stowed positions and pivots
    cargoSimulationBaseGroup = new THREE.Group();

    if (fitResult.mode === 'pitch') {
      // Propped on seatback: pivot at rear sill floor contact
      const pivot = new THREE.Group();
      pivot.position.set(rearSillX - 4, sillY + 2.5, 0);
      cargo3DMesh.position.set(-(rot.l / 2), rot.h / 2, 0);
      pivot.rotation.z = -(fitResult.angle * Math.PI) / 180;
      pivot.add(cargo3DMesh);
      cargoSimulationBaseGroup.add(pivot);

    } else if (fitResult.mode === 'yaw') {
      // Diagonal corner-to-corner across cargo floor: account for rotated length span
      const rad = (fitResult.angle * Math.PI) / 180;
      const halfExtX = (rot.l / 2) * Math.cos(rad) + (rot.w / 2) * Math.sin(Math.abs(rad));
      cargo3DMesh.position.set(rearSillX - 4 - halfExtX, sillY + (rot.h / 2) + 2.5, 0);
      cargo3DMesh.rotation.y = rad;
      cargoSimulationBaseGroup.add(cargo3DMesh);

    } else if (fitResult.mode === 'roll') {
      // Banked against sidewall: contact lift keeps bottom corner exactly on floor
      const rad = (fitResult.angle * Math.PI) / 180;
      const contactY = (rot.w / 2) * Math.sin(Math.abs(rad)) + (rot.h / 2) * Math.cos(rad);
      cargo3DMesh.position.set(rearSillX - (rot.l / 2) - 4, sillY + 2.5 + contactY, 0);
      cargo3DMesh.rotation.x = rad;
      cargoSimulationBaseGroup.add(cargo3DMesh);

    } else if (fitResult.mode === 'ingress') {
      // Demonstrating entry through the aperture opening: contact lift and positioned at tailgate
      const rad = (fitResult.angle * Math.PI) / 180;
      const contactY = (rot.w / 2) * Math.sin(Math.abs(rad)) + (rot.h / 2) * Math.cos(rad);
      cargo3DMesh.position.set(rearSillX + 16, sillY + 2.5 + contactY, 0);
      cargo3DMesh.rotation.x = rad;
      cargoSimulationBaseGroup.add(cargo3DMesh);

    } else {
      // Standard Flat
      const posX = rearSillX - (rot.l / 2) - 4;
      cargo3DMesh.position.set(posX, sillY + (rot.h / 2) + 2.5, 0);
      cargoSimulationBaseGroup.add(cargo3DMesh);
    }

    scene.add(cargoSimulationBaseGroup);
  }
}

/**
 * Animated Loading Simulation:
 * Shows the cargo item gliding from outside the tailgate, rotating to clear
 * the aperture at the required angle, sliding into the cargo bay, and settling
 * into its final stowed position.
 */
function toggleIngressSimulation() {
  if (isIngressSimulating) {
    isIngressSimulating = false;
    if (btnSimulateIngress) btnSimulateIngress.classList.remove('playing');
    if (animBtnLabel) animBtnLabel.textContent = 'Simulate Loading';
  } else {
    startIngressSimulation();
  }
}

function startIngressSimulation() {
  if (!lastFitResult || !cargoSimulationBaseGroup) return;
  isIngressSimulating = true;
  ingressSimProgress = 0;
  if (btnSimulateIngress) {
    btnSimulateIngress.classList.add('playing');
    if (animBtnLabel) animBtnLabel.textContent = 'Pause Loading';
  }
  // Ensure tailgate is open for loading
  if (!isTailgateOpen) {
    if (btnBootToggle) btnBootToggle.click();
  }
}

function updateCargoSimulationFrame(p) {
  if (!cargoSimulationBaseGroup || !lastFitResult || !lastFitResult.rot) return;

  const rearBumperX = 70;
  const rearSillX = rearBumperX - (selectedCar.body_type === 'estate' ? 18 : 22);
  const startX = rearBumperX + 68;
  const sillX = rearSillX;
  const stowedX = 0; // relative base group position

  if (p < 0.4) {
    // Phase 1: Approaching tailgate from outside
    const subP = p / 0.4;
    const currentX = startX + (sillX - startX) * subP;
    cargoSimulationBaseGroup.position.set(currentX, 0, 0);
    // Orient to ingress angle as approaching opening
    if (lastFitResult.ingress && !lastFitResult.ingress.direct) {
      cargoSimulationBaseGroup.rotation.x = ((lastFitResult.ingress.rollAngle * Math.PI) / 180) * subP;
    }
  } else if (p < 0.7) {
    // Phase 2: Passing cleanly through the tailgate aperture frame
    const subP = (p - 0.4) / 0.3;
    const currentX = sillX + (-24 - sillX) * subP;
    cargoSimulationBaseGroup.position.set(currentX, 0, 0);
  } else {
    // Phase 3: Moving into final stowed position and rotating to stowed angle
    const subP = (p - 0.7) / 0.3;
    const currentX = -24 + (stowedX - (-24)) * subP;
    cargoSimulationBaseGroup.position.set(currentX, 0, 0);
    if (lastFitResult.ingress && !lastFitResult.ingress.direct && lastFitResult.mode !== 'roll') {
      // Transition from ingress roll back to final mode
      cargoSimulationBaseGroup.rotation.x = ((lastFitResult.ingress.rollAngle * Math.PI) / 180) * (1 - subP);
    }
  }
}

/* ==========================================================================
   CAD 2D BLUEPRINT VECTOR VISUALIZERS (Static Chassis Datum)
   ========================================================================== */

function renderSideSvg(rot, floorLength, roofHeight, tanRake, mode, angle, seatsFolded, car) {
  const groundY = 205;
  const sillY = car.body_type === 'suv' ? 150 : 165;
  const floorY = sillY;
  const rearSillX = 490; // Fixed rear sill datum
  const scale = 1.45;
  const bodyType = car.body_type;

  const floorLenPx = floorLength * scale;
  const seatFrontX = rearSillX - floorLenPx;
  const roofY = floorY - (roofHeight * scale);
  const glassTopX = rearSillX - (roofHeight * tanRake * scale);

  const rad = (angle * Math.PI) / 180;
  const effectiveH = mode === 'roll' ? ((rot.w * Math.sin(rad)) + (rot.h * Math.cos(rad))) : rot.h;
  const boxLPx = rot.l * scale;
  const boxHPx = effectiveH * scale;

  let cargoMarkup = '';

  if (mode === 'pitch') {
    const pivotX = rearSillX - 8;
    const pivotY = floorY;
    const radA = (Math.max(1, angle) * Math.PI) / 180;
    const arcR = 55;
    const arcEndX = (pivotX - arcR * Math.cos(radA)).toFixed(1);
    const arcEndY = (pivotY - arcR * Math.sin(radA)).toFixed(1);
    cargoMarkup = `
      <g transform="rotate(${-angle}, ${pivotX}, ${pivotY})">
        <rect x="${pivotX - boxLPx}" y="${pivotY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
              fill="url(#box-grad-cyan)" stroke="#38bdf8" stroke-width="2" rx="3" filter="url(#glow-cyan)" />
        <text x="${pivotX - (boxLPx / 2)}" y="${pivotY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
          ${rot.l} × ${rot.h} cm
        </text>
        <line x1="${pivotX - boxLPx + 14}" y1="${pivotY - boxHPx}" x2="${pivotX - boxLPx + 14}" y2="${pivotY}" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5" />
        <line x1="${pivotX - 14}" y1="${pivotY - boxHPx}" x2="${pivotX - 14}" y2="${pivotY}" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5" />
      </g>
      <path d="M ${pivotX - arcR} ${pivotY} A ${arcR} ${arcR} 0 0 1 ${arcEndX} ${arcEndY}" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="3,2" />
      <text x="${pivotX - 60}" y="${pivotY - 14}" fill="#38bdf8" font-size="10.5" font-family="ui-monospace, monospace" font-weight="800" text-anchor="end">
        ~${Math.round(angle)}° tilt
      </text>
    `;
  } else if (mode === 'roll') {
    const boxX = Math.max(seatFrontX, rearSillX - boxLPx);
    cargoMarkup = `
      <rect x="${boxX}" y="${floorY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
            fill="url(#box-grad-cyan)" stroke="#38bdf8" stroke-width="2" rx="3" filter="url(#glow-cyan)" />
      <text x="${boxX + (boxLPx / 2)}" y="${floorY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
        ${rot.l} × ${Math.round(effectiveH)} cm
      </text>
      <rect x="${boxX + 6}" y="${floorY - boxHPx - 20}" width="96" height="16" rx="3" fill="#0c1a2e" stroke="#38bdf8" stroke-width="1" />
      <text x="${boxX + 54}" y="${floorY - boxHPx - 8}" fill="#38bdf8" font-size="9" font-family="ui-monospace, monospace" font-weight="700" text-anchor="middle">
        BANKED ~${Math.round(angle)}°
      </text>
    `;
  } else if (mode === 'yaw') {
    const boxX = Math.max(seatFrontX, rearSillX - boxLPx);
    cargoMarkup = `
      <rect x="${boxX}" y="${floorY - boxHPx}" width="${boxLPx}" height="${boxHPx}" 
            fill="url(#box-grad-cyan)" stroke="#38bdf8" stroke-width="2" rx="3" filter="url(#glow-cyan)" />
      <text x="${boxX + (boxLPx / 2)}" y="${floorY - (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
        ${rot.l} × ${rot.h} cm
      </text>
      <rect x="${boxX + 6}" y="${floorY - boxHPx - 20}" width="96" height="16" rx="3" fill="#0c1a2e" stroke="#38bdf8" stroke-width="1" />
      <text x="${boxX + 54}" y="${floorY - boxHPx - 8}" fill="#38bdf8" font-size="9" font-family="ui-monospace, monospace" font-weight="700" text-anchor="middle">
        DIAGONAL ~${angle}°
      </text>
    `;
  } else if (mode === 'ingress') {
    const ingressX = rearSillX - 10;
    cargoMarkup = `
      <rect x="${ingressX}" y="${floorY - boxHPx - 12}" width="${boxLPx}" height="${boxHPx}" 
            fill="url(#box-grad-cyan)" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,2" rx="3" filter="url(#glow-cyan)" />
      <text x="${ingressX + (boxLPx / 2)}" y="${floorY - boxHPx - 12 + (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
        ${rot.l} × ${rot.h} cm
      </text>
      <line x1="${ingressX + (boxLPx / 2)}" y1="${floorY - boxHPx - 24}" x2="${ingressX + (boxLPx / 2) - 40}" y2="${floorY - boxHPx - 24}" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-ingress)" />
      <text x="${ingressX + (boxLPx / 2) - 45}" y="${floorY - boxHPx - 21}" fill="#38bdf8" font-size="9.5" font-family="ui-monospace, monospace" font-weight="700" text-anchor="end">
        INGRESS ENTRY (~${angle}° ROLL)
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
        COLLISION
      </text>
    `;
  } else {
    // Flat fit
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

  // Authentic CAD Vector Body Silhouettes
  let bodyPath = '';
  let greenhousePath = '';
  let roofRail = '';
  let claddingSvg = '';

  if (bodyType === 'estate') {
    // Estate: Long flat roofline, 4 pillars, D-pillar, 3 windows, roof rails
    bodyPath = `
      M 45 192 L 40 176 L 42 160 L 55 145 L 165 124 L 230 70 L 468 70 L 488 74 
      L 485 84 L 506 142 L 515 152 L 510 178 L 488 192 
      L 484 178 A 34 34 0 0 0 416 178 L 416 190 L 159 190 L 159 178 A 34 34 0 0 0 91 178 L 91 192 Z`;
    greenhousePath = `
      M 172 122 L 234 75 L 468 75 L 480 110 L 480 122 Z`;
    roofRail = `<line x1="236" y1="65" x2="470" y2="65" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />`;

  } else if (bodyType === 'suv') {
    // SUV: High ground clearance, wheel cladding, skid plates, upright roof
    bodyPath = `
      M 45 186 L 40 162 L 44 142 L 60 130 L 165 110 L 225 48 L 442 48 L 472 54 
      L 468 64 L 500 132 L 518 142 L 512 172 L 488 186 
      L 484 172 A 38 38 0 0 0 408 172 L 408 186 L 167 186 L 167 172 A 38 38 0 0 0 91 172 L 91 186 Z`;
    greenhousePath = `
      M 172 108 L 230 54 L 440 54 L 470 94 L 470 110 Z`;
    roofRail = `<line x1="236" y1="44" x2="438" y2="44" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />`;
    claddingSvg = `
      <path d="M 86 172 A 42 42 0 0 1 172 172" fill="none" stroke="#0f172a" stroke-width="6" />
      <path d="M 404 172 A 42 42 0 0 1 488 172" fill="none" stroke="#0f172a" stroke-width="6" />
      <rect x="42" y="172" width="16" height="6" fill="#e2e8f0" rx="1" />
      <rect x="502" y="172" width="16" height="6" fill="#e2e8f0" rx="1" />
    `;

  } else if (bodyType === 'saloon') {
    // Saloon: 3-box notchback profile with clear stepped trunk deck and fixed rear glass
    bodyPath = `
      M 45 192 L 40 176 L 42 160 L 55 145 L 165 124 L 230 70 L 375 70 L 425 118 
      L 485 118 L 515 142 L 510 178 L 488 192 
      L 484 178 A 34 34 0 0 0 416 178 L 416 190 L 159 190 L 159 178 A 34 34 0 0 0 91 178 L 91 192 Z`;
    greenhousePath = `
      M 172 122 L 234 76 L 372 76 L 420 122 Z`;

  } else {
    // Hatchback: Compact sporty 2-box silhouette with raked hatch and roof spoiler
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
    ${claddingSvg}

    <circle cx="125" cy="${car.body_type === 'suv' ? 172 : 178}" r="${car.body_type === 'suv' ? 32 : 27}" fill="#080e1a" stroke="#1e2c47" stroke-width="3" />
    <circle cx="125" cy="${car.body_type === 'suv' ? 172 : 178}" r="${car.body_type === 'suv' ? 20 : 17}" fill="#111c2e" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="6,4" />
    <circle cx="125" cy="${car.body_type === 'suv' ? 172 : 178}" r="7" fill="#1e2c47" />

    <circle cx="450" cy="${car.body_type === 'suv' ? 172 : 178}" r="${car.body_type === 'suv' ? 32 : 27}" fill="#080e1a" stroke="#1e2c47" stroke-width="3" />
    <circle cx="450" cy="${car.body_type === 'suv' ? 172 : 178}" r="${car.body_type === 'suv' ? 20 : 17}" fill="#111c2e" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="6,4" />
    <circle cx="450" cy="${car.body_type === 'suv' ? 172 : 178}" r="7" fill="#1e2c47" />

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

function renderRearSvg(rot, archWidth, roofHeight, apWidth, apHeight, isColliding, bodyType, mode, angle) {
  const groundY = 205;
  const floorY = bodyType === 'suv' ? 150 : 165;
  const centerX = 210;
  const scale = 1.35;

  const archWPx = archWidth * scale;
  const apWPx = apWidth * scale;
  const apHPx = apHeight * scale;

  const boxWPx = rot.w * scale;
  const boxHPx = rot.h * scale;
  const boxLeftX = centerX - (boxWPx / 2);

  const boxStroke = isColliding ? '#ef4444' : '#22c55e';
  const boxFill = isColliding ? 'url(#box-rear-red)' : 'url(#box-rear-green)';
  const boxGlow = isColliding ? '' : 'filter="url(#glow-green)"';

  let rearBodyPath = '';
  let rearWindowPoly = '';
  let rearRails = '';

  if (bodyType === 'suv') {
    rearBodyPath = `
      M 88 186 L 46 162 L 44 120 L 60 110 L 105 44 L 315 44 L 360 110 L 376 120 L 374 162 L 332 186 Z`;
    rearWindowPoly = `points="114,50 306,50 345,105 75,105"`;
    rearRails = `
      <rect x="98" y="38" width="14" height="6" fill="#38bdf8" rx="2" />
      <rect x="308" y="38" width="14" height="6" fill="#38bdf8" rx="2" />
    `;
  } else if (bodyType === 'estate') {
    rearBodyPath = `
      M 88 192 L 48 168 L 46 130 L 62 120 L 108 60 L 312 60 L 358 120 L 374 130 L 372 168 L 332 192 Z`;
    rearWindowPoly = `points="118,66 302,66 342,115 78,115"`;
    rearRails = `
      <rect x="102" y="54" width="14" height="6" fill="#38bdf8" rx="2" />
      <rect x="304" y="54" width="14" height="6" fill="#38bdf8" rx="2" />
    `;
  } else if (bodyType === 'saloon') {
    rearBodyPath = `
      M 88 192 L 48 168 L 46 142 L 65 132 L 120 74 L 300 74 L 355 132 L 374 142 L 372 168 L 332 192 Z`;
    rearWindowPoly = `points="130,80 290,80 335,124 85,124"`;
  } else {
    // Hatchback
    rearBodyPath = `
      M 88 192 L 48 168 L 46 138 L 65 130 L 115 68 L 305 68 L 355 130 L 374 138 L 372 168 L 332 192 Z`;
    rearWindowPoly = `points="126,74 294,74 340,122 80,122"`;
  }

  // Tilted roll or ingress visualization
  let boxTransform = '';
  let rollLabel = '';
  let renderBoxY = floorY - boxHPx;

  if ((mode === 'roll' || mode === 'ingress') && angle > 0) {
    const rad = (angle * Math.PI) / 180;
    const contactHalfH = (boxWPx / 2) * Math.sin(rad) + (boxHPx / 2) * Math.cos(rad);
    const pivotY = floorY - contactHalfH;
    renderBoxY = pivotY - (boxHPx / 2);
    boxTransform = `transform="rotate(${angle}, ${centerX}, ${pivotY})"`;
    rollLabel = `
      <text x="${centerX}" y="${floorY - apHPx - 8}" fill="#38bdf8" font-size="10" font-family="ui-monospace, monospace" font-weight="800" text-anchor="middle">
        ${mode === 'ingress' ? 'INGRESS ROLL' : 'BANKED ROLL'} ~${Math.round(angle)}°
      </text>
    `;
  } else if (mode === 'yaw' && angle > 0) {
    rollLabel = `
      <text x="${centerX}" y="${floorY - apHPx - 8}" fill="#38bdf8" font-size="10" font-family="ui-monospace, monospace" font-weight="800" text-anchor="middle">
        DIAGONAL FLOOR ~${Math.round(angle)}°
      </text>
    `;
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

    <rect x="55" y="${bodyType === 'suv' ? 150 : 158}" width="33" height="${bodyType === 'suv' ? 44 : 47}" rx="4" fill="#080e1a" stroke="#1e2c47" stroke-width="2" />
    <rect x="332" y="${bodyType === 'suv' ? 150 : 158}" width="33" height="${bodyType === 'suv' ? 44 : 47}" rx="4" fill="#080e1a" stroke="#1e2c47" stroke-width="2" />

    <path d="${rearBodyPath}" fill="url(#body-rear-grad)" stroke="#2a3f66" stroke-width="2" />
    ${rearRails}

    <polygon ${rearWindowPoly} fill="url(#glass-grad)" stroke="#203352" stroke-width="1.5" />

    <rect x="50" y="${bodyType === 'suv' ? 124 : 132}" width="320" height="9" rx="3" fill="url(#rear-lightbar)" opacity="0.9" />

    <!-- Aperture Opening Boundary Frame -->
    <rect x="${centerX - (apWPx / 2)}" y="${floorY - apHPx}" width="${apWPx}" height="${apHPx}" 
          fill="#060b16" stroke="#38bdf8" stroke-dasharray="5,4" stroke-width="1.8" rx="6" />

    <!-- Wheel Arch Tubs Contour -->
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

    ${rollLabel}

    <g ${boxTransform}>
      <rect x="${boxLeftX}" y="${renderBoxY}" width="${boxWPx}" height="${boxHPx}" 
            fill="${boxFill}" stroke="${boxStroke}" stroke-width="2" rx="3" ${boxGlow} />

      <text x="${centerX}" y="${renderBoxY + (boxHPx / 2) + 4}" fill="#ffffff" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="middle">
        ${rot.w} × ${rot.h} cm
      </text>
    </g>

    ${isColliding ? `
      <circle cx="${centerX - (archWPx / 2)}" cy="${floorY - (boxHPx / 2)}" r="6" fill="#ef4444" />
      <circle cx="${centerX + (archWPx / 2)}" cy="${floorY - (boxHPx / 2)}" r="6" fill="#ef4444" />
    ` : ''}
  `;
}

document.addEventListener('DOMContentLoaded', init);