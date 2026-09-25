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
    floor_length_seats_folded: 149,
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
    floor_length_seats_folded: 130,
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
    floor_length_seats_folded: 159,
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

// Angle Strategy & Ingress Controls
const strategyBadge = document.getElementById('strategy-badge');
const strategyHeading = document.getElementById('strategy-heading');
const chipIngress = document.getElementById('chip-ingress');
const chipStowed = document.getElementById('chip-stowed');
const btnSimulateIngress = document.getElementById('btn-simulate-ingress');
const animBtnLabel = document.getElementById('anim-btn-label');
const btnToggleAdvanced = document.getElementById('btn-toggle-advanced');
const advancedControlsPanel = document.getElementById('advanced-controls-panel');
const strategyPills = document.querySelectorAll('.strategy-pill');
const customAngleSlider = document.getElementById('custom-angle-slider');
const angleSliderLabel = document.getElementById('angle-slider-label');
const angleValueBadge = document.getElementById('angle-value-badge');
const angleStatusHint = document.getElementById('angle-status-hint');
const tickButtons = document.querySelectorAll('.tick-btn');

const specFloor = document.getElementById('spec-floor');
const specArches = document.getElementById('spec-arches');
const specRoof = document.getElementById('spec-roof');
const specAperture = document.getElementById('spec-aperture');
const specsCarName = document.getElementById('specs-car-name');
const hudBodyType = document.getElementById('hud-body-type');

const presetButtons = document.querySelectorAll('.preset-btn');
const view3dContainer = document.getElementById('view-3d-container');
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
      btnXRayToggle.textContent = xRayMode < 0.85 ? '👁️ See Inside' : '🚗 Solid Paint';
      if (selectedCar && lastFitResult) {
        update3DStudio(selectedCar, foldSeatsCheckbox.checked, lastFitResult);
      }
    });
  }

  if (btnToggleAdvanced && advancedControlsPanel) {
    btnToggleAdvanced.addEventListener('click', () => {
      const isCollapsed = advancedControlsPanel.classList.toggle('collapsed');
      btnToggleAdvanced.innerHTML = isCollapsed
        ? '⚙️ Adjust Angles (Optional) ▾'
        : '⚙️ Hide Angle Controls ▴';
      btnToggleAdvanced.classList.toggle('active', !isCollapsed);
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
  let bestThrough = null;
  let bestIngress = null;
  let failureReasons = [];

  const maxFloorSpan = floorLength + fwdBuffer;
  const centerMaxLen = floorLength + 68;

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
      if (rot.l > maxFloorSpan) {
        if (rot.w > 34) {
          failureReasons.push(`Too long for boot floor (${rot.l} cm vs ${maxFloorSpan} cm max with seats folded) and too wide (${rot.w} cm) to slide between front seats (34 cm gap limit).`);
        } else {
          failureReasons.push(`Too long for boot floor (${rot.l} cm vs ${maxFloorSpan} cm max with seats folded).`);
        }
      } else if (rot.l > usableLengthAtH && passesArch && passesRoof) {
        failureReasons.push(`Hits sloping rear window at ${rot.h} cm height (max length at this height is ~${Math.round(usableLengthAtH)} cm).`);
      } else if (!passesArch) {
        failureReasons.push(`Exceeds wheel arch width (${rot.w} cm vs ${archWidth} cm limit).`);
      } else if (!passesRoof) {
        failureReasons.push(`Exceeds interior roof height (${rot.h} cm vs ${roofHeight} cm limit).`);
      }
    }

    // 5. Center Through-Load Test (Slide between front bucket seats over center console)
    if (seatsFolded && ingress.canEnter && rot.w <= 34 && rot.h <= 26 && rot.l <= centerMaxLen) {
      const margin = Math.min(centerMaxLen - rot.l, 34 - rot.w, 26 - rot.h);
      if (!bestThrough || margin > bestThrough.margin) {
        bestThrough = {
          rot,
          margin,
          ingress,
          centerMaxLen
        };
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
  } else if (bestThrough) {
    overallOptimal = {
      mode: 'center',
      rot: bestThrough.rot,
      angle: 0,
      status: bestThrough.margin >= 4 ? 'comfortable' : 'tight',
      margin: bestThrough.margin,
      ingress: bestThrough.ingress,
      heading: 'Fits Between Front Seats (Center Through-Load)',
      instruction: `Extends through the center between the front seats over the armrest console (width: ${bestThrough.rot.w} cm clears 34 cm gap). Clears to dashboard with ${Math.round(bestThrough.margin)} cm buffer.`
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
      center: bestThrough,
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
      else if (activeResult.mode === 'center') angleSliderLabel.textContent = 'Through-Load:';
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
    } else if (activeAngleMode === 'center') {
      if (angleSliderLabel) angleSliderLabel.textContent = 'Through-Load:';
      if (angleStatusHint) angleStatusHint.textContent = 'Slide between front seats to dash';
      if (customAngleSlider) customAngleSlider.value = 0;
      if (angleValueBadge) angleValueBadge.textContent = '0°';

      const centerMaxLen = floorLength + 68;
      const ingress = checkApertureIngress(candidateRot, apWidth, apHeight);
      const fitsThrough = seatsFolded && ingress.canEnter && candidateRot.w <= 34 && candidateRot.h <= 26 && candidateRot.l <= centerMaxLen;

      if (fitsThrough) {
        const m = Math.min(centerMaxLen - candidateRot.l, 34 - candidateRot.w, 26 - candidateRot.h);
        activeResult = {
          mode: 'center',
          rot: candidateRot,
          angle: 0,
          status: m >= 4 ? 'comfortable' : 'tight',
          margin: m,
          ingress,
          heading: m >= 4 ? 'Fits Between Front Seats (Comfortable)' : 'Fits Between Front Seats (Tight)',
          instruction: `Slides through the 34 cm gap between the front bucket seats over the center console, clearing to the dashboard with ${Math.round(m * 10) / 10} cm margin.`
        };
      } else {
        let failReasons = [];
        if (!seatsFolded) failReasons.push('Requires rear seats to be folded flat');
        if (candidateRot.w > 34) failReasons.push(`Width (${candidateRot.w} cm) exceeds 34 cm gap between front seats`);
        if (candidateRot.h > 26) failReasons.push(`Height (${candidateRot.h} cm) exceeds 26 cm console clearance`);
        if (candidateRot.l > centerMaxLen) failReasons.push(`Length (${candidateRot.l} cm) exceeds dashboard clearance (~${centerMaxLen} cm)`);
        if (!ingress.canEnter) failReasons.push('Exceeds tailgate aperture opening');

        activeResult = {
          mode: 'center',
          rot: candidateRot,
          angle: 0,
          status: 'colliding',
          margin: -1,
          ingress,
          heading: 'Cannot Fit Through Center',
          instruction: failReasons.join('; ') + '.'
        };
      }
    }
  }

  lastFitResult = activeResult;

  // Update UI Elements with friendly, human-first copy
  if (activeResult.status === 'comfortable') {
    resultBanner.className = 'result-banner fits-comfortable';
    resultBanner.textContent = '🎉 Yes, It Fits Comfortably!';
  } else if (activeResult.status === 'tight') {
    resultBanner.className = 'result-banner fits-tight';
    resultBanner.textContent = '⚠️ Tight Fit – But It Fits!';
  } else if (activeResult.status === 'angled') {
    resultBanner.className = 'result-banner fits-angled';
    resultBanner.textContent = `📐 Fits With A Tilt (~${Math.round(activeResult.angle)}°)`;
  } else {
    resultBanner.className = 'result-banner will-not-fit';
    resultBanner.textContent = '❌ Won\'t Fit In This Car';
  }

  resultExplanation.textContent = activeResult.instruction;

  if (strategyBadge) {
    strategyBadge.textContent = activeAngleMode === 'auto' ? '💡 BEST FIT' : `⚙️ ${activeAngleMode.toUpperCase()}`;
  }
  if (strategyHeading) {
    strategyHeading.textContent = activeResult.heading;
  }

  // Update Status Chips (friendly plain-English)
  if (chipIngress && activeResult.ingress) {
    if (activeResult.ingress.canEnter) {
      chipIngress.className = 'strategy-chip clears';
      chipIngress.textContent = activeResult.ingress.direct
        ? '🚪 Boot Entrance: Clears easily'
        : `🚪 Boot Entrance: Clears (Tilted ~${Math.round(activeResult.ingress.rollAngle)}°)`;
    } else {
      chipIngress.className = 'strategy-chip colliding';
      chipIngress.textContent = '🚪 Boot Entrance: Too large to enter';
    }
  }

  if (chipStowed) {
    if (activeResult.status === 'comfortable' || activeResult.status === 'tight') {
      chipStowed.className = 'strategy-chip clears';
      chipStowed.textContent = `📦 Inside Boot: Fits Flat (+${Math.max(0, Math.round(activeResult.margin))} cm room)`;
    } else if (activeResult.status === 'angled') {
      chipStowed.className = 'strategy-chip angled';
      chipStowed.textContent = `📦 Inside Boot: Tilted ~${Math.round(activeResult.angle)}° (+${Math.max(0, Math.round(activeResult.margin))} cm)`;
    } else {
      chipStowed.className = 'strategy-chip colliding';
      chipStowed.textContent = '📦 Inside Boot: Exceeds boot space';
    }
  }

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
        if (animBtnLabel) animBtnLabel.textContent = 'Watch Again';
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
 * Procedural High-Fidelity 3D Wheel Assembly
 * (Hollow radial rubber tyre with sculpted tread shoulders, diamond-cut bi-tone alloy spokes,
 * concave wheel barrel, machined rim flange, 5 chrome lug bolts, ventilated disc rotor & red caliper)
 */
function createWheel3D(radius = 30, width = 22, isSUV = false) {
  const wheelGroup = new THREE.Group();

  const halfW = width / 2;
  const rimRadius = isSUV ? radius * 0.68 : radius * 0.74;

  // Materials
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x121722, // Deep matte vulcanized tire rubber
    roughness: 0.94,
    metalness: 0.05
  });

  const alloyMachinedMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Diamond-cut brilliant silver machined face
    metalness: 0.95,
    roughness: 0.14
  });

  const alloyDarkPocketMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Gloss black / anthracite spoke pocket contrast
    metalness: 0.85,
    roughness: 0.3
  });

  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x151e2e, // Dark metallic barrel cavity
    metalness: 0.88,
    roughness: 0.35,
    side: THREE.DoubleSide
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.98,
    roughness: 0.08
  });

  const rotorMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Drilled steel brake rotor
    metalness: 0.95,
    roughness: 0.22,
    side: THREE.DoubleSide
  });

  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Gloss Brembo race red
    roughness: 0.2,
    metalness: 0.3
  });

  // 1. TYRE: Continuous smooth vulcanized rubber tread & sidewalls (no floating torus ring!)
  const treadGeo = new THREE.CylinderGeometry(radius, radius, width, 40, 1, true);
  const tread = new THREE.Mesh(treadGeo, tireMat);
  tread.rotation.x = Math.PI / 2;
  wheelGroup.add(tread);

  // Outer Tyre Sidewall Face Ring (flush with tread at radius, leaves center open for alloy rim)
  const sidewallGeo = new THREE.RingGeometry(rimRadius, radius, 40);
  const sidewall = new THREE.Mesh(sidewallGeo, tireMat);
  sidewall.position.z = halfW;
  wheelGroup.add(sidewall);

  // Inner Tyre Sidewall Face Ring (back of wheel)
  const innerSidewall = new THREE.Mesh(sidewallGeo, tireMat);
  innerSidewall.position.z = -halfW;
  innerSidewall.rotation.y = Math.PI;
  wheelGroup.add(innerSidewall);

  // 2. MACHINED ALLOY WHEEL RIM LIP / FLANGE
  const rimFlangeGeo = new THREE.TorusGeometry(rimRadius, 1.1, 14, 40);
  const rimFlange = new THREE.Mesh(rimFlangeGeo, alloyMachinedMat);
  rimFlange.position.z = halfW - 0.2;
  wheelGroup.add(rimFlange);

  // Inner Rim Lip
  const innerRimFlange = new THREE.Mesh(rimFlangeGeo, barrelMat);
  innerRimFlange.position.z = -halfW + 0.2;
  wheelGroup.add(innerRimFlange);

  // 3. DEEP CONCAVE WHEEL BARREL
  const barrelGeo = new THREE.CylinderGeometry(rimRadius - 0.5, rimRadius - 0.8, width - 1.2, 36, 1, true);
  const barrel = new THREE.Mesh(barrelGeo, barrelMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0;
  wheelGroup.add(barrel);

  // 4. VENTILATED CROSS-DRILLED BRAKE ROTOR DISC (Visible through open spokes)
  const rotorRadius = rimRadius * 0.76;
  const rotorGeo = new THREE.CylinderGeometry(rotorRadius, rotorRadius, 1.6, 32);
  const rotor = new THREE.Mesh(rotorGeo, rotorMat);
  rotor.rotation.x = Math.PI / 2;
  rotor.position.z = halfW - 5.0;
  wheelGroup.add(rotor);

  // Rotor Center Hat (Iron bell hub)
  const hatGeo = new THREE.CylinderGeometry(rotorRadius * 0.44, rotorRadius * 0.44, 2.6, 24);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.6 });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.rotation.x = Math.PI / 2;
  hat.position.z = halfW - 4.5;
  wheelGroup.add(hat);

  // Sport Red Caliper: Curving naturally around the top-front perimeter of the rotor (~115° position)
  const caliperGroup = new THREE.Group();
  const calCenterAngle = Math.PI * 0.64;
  const calArcSpan = 0.38; // ~22° curvature hugging rotor outer rim

  // Curved caliper arch segments following rotor contour
  for (let s = 0; s < 4; s++) {
    const segT = (s / 3) - 0.5;
    const segAngle = calCenterAngle + (segT * calArcSpan);
    const segR = rotorRadius * 0.96;
    const segGeo = new THREE.BoxGeometry(3.2, 4.2, 3.6);
    const segMesh = new THREE.Mesh(segGeo, caliperMat);
    segMesh.position.set(Math.cos(segAngle) * segR, Math.sin(segAngle) * segR, halfW - 4.2);
    segMesh.rotation.z = segAngle + (Math.PI / 2);
    caliperGroup.add(segMesh);
  }

  // Dual Twin Hydraulic Piston Bosses on outer caliper face
  [-0.10, 0.10].forEach(pOffset => {
    const pAngle = calCenterAngle + pOffset;
    const pR = rotorRadius * 0.94;
    const pGeo = new THREE.CylinderGeometry(1.5, 1.5, 1.0, 16);
    const pMesh = new THREE.Mesh(pGeo, caliperMat);
    pMesh.rotation.x = Math.PI / 2;
    pMesh.position.set(Math.cos(pAngle) * pR, Math.sin(pAngle) * pR, halfW - 2.1);
    caliperGroup.add(pMesh);
  });

  // Dark Brake Pad Bridge / Retention Clip in the center recess
  const clipGeo = new THREE.BoxGeometry(1.2, 3.8, 2.0);
  const clipMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
  const clipMesh = new THREE.Mesh(clipGeo, clipMat);
  const clipR = rotorRadius * 0.96;
  clipMesh.position.set(Math.cos(calCenterAngle) * clipR, Math.sin(calCenterAngle) * clipR, halfW - 3.6);
  clipMesh.rotation.z = calCenterAngle + (Math.PI / 2);
  caliperGroup.add(clipMesh);

  wheelGroup.add(caliperGroup);

  // 5. DIAMOND-CUT BI-TONE ALLOY SPOKES (Sculpted 5-Twin Spoke Sport Design)
  const spokeGroup = new THREE.Group();
  const numSpokes = isSUV ? 6 : 5;

  for (let i = 0; i < numSpokes; i++) {
    const angle = (i * Math.PI * 2) / numSpokes;
    const pairGroup = new THREE.Group();
    pairGroup.rotation.z = angle;

    // Twin spoke pair angled slightly
    [-0.075, 0.075].forEach(offsetAngle => {
      const singleSpokeGroup = new THREE.Group();
      singleSpokeGroup.rotation.z = offsetAngle;

      const spokeLen = rimRadius - 2.0;

      // Machined Silver Top Face
      const spokeTopGeo = new THREE.BoxGeometry(2.4, spokeLen, 1.4);
      const spokeTop = new THREE.Mesh(spokeTopGeo, alloyMachinedMat);
      spokeTop.position.set(0, (spokeLen / 2) + 2.0, halfW - 0.7);
      // Subtle concave angle (spokes dip slightly toward center hub)
      spokeTop.rotation.x = -0.06;
      singleSpokeGroup.add(spokeTop);

      // Dark Contrast Pocket Underneath
      const spokeDarkGeo = new THREE.BoxGeometry(3.6, spokeLen + 0.5, 1.8);
      const spokeDark = new THREE.Mesh(spokeDarkGeo, alloyDarkPocketMat);
      spokeDark.position.set(0, (spokeLen / 2) + 2.0, halfW - 1.8);
      spokeDark.rotation.x = -0.06;
      singleSpokeGroup.add(spokeDark);

      pairGroup.add(singleSpokeGroup);
    });

    spokeGroup.add(pairGroup);
  }
  wheelGroup.add(spokeGroup);

  // 6. CENTER WHEEL HUB CAP & 5 CHROME LUG BOLTS
  const centerCapGeo = new THREE.CylinderGeometry(rimRadius * 0.28, rimRadius * 0.26, 2.4, 24);
  const centerCapMat = new THREE.MeshStandardMaterial({
    color: 0x090e17,
    roughness: 0.2,
    metalness: 0.8
  });
  const centerCap = new THREE.Mesh(centerCapGeo, centerCapMat);
  centerCap.rotation.x = Math.PI / 2;
  centerCap.position.z = halfW - 0.8;
  wheelGroup.add(centerCap);

  // Chrome Center Badge Ring
  const badgeRingGeo = new THREE.TorusGeometry(rimRadius * 0.16, 0.45, 12, 24);
  const badgeRing = new THREE.Mesh(badgeRingGeo, chromeMat);
  badgeRing.position.z = halfW + 0.3;
  wheelGroup.add(badgeRing);

  // 5 Hexagonal Chrome Lug Bolts in a 5-hole circular pattern
  const boltCircleR = rimRadius * 0.38;
  for (let b = 0; b < 5; b++) {
    const bAngle = (b * Math.PI * 2) / 5;
    const boltGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.4, 6);
    const bolt = new THREE.Mesh(boltGeo, chromeMat);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(Math.cos(bAngle) * boltCircleR, Math.sin(bAngle) * boltCircleR, halfW - 0.7);
    wheelGroup.add(bolt);
  }

  return wheelGroup;
}

/**
 * Creates front bucket seats with realistic contours, bolsters and headrests.
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
 * Creates modern dashboard cockpit, digital cluster binnacle, center infotainment,
 * center console tunnel, and sport 3-spoke steering wheel (visible through CAD cutaway).
 */
function createCockpit3D(cabinWidth, cowlX, cowlY, beltY, frontSeatsX, cabinFloorY, totalCarWidth) {
  const cockpitGroup = new THREE.Group();

  const dashMat = new THREE.MeshStandardMaterial({ color: 0x0c121d, roughness: 0.85 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.3 });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x0284c7,
    emissiveIntensity: 0.7,
    roughness: 0.1
  });

  // 1. Sculpted Instrument Panel Main Housing (compact 24 cm depth directly under windshield)
  const ipDepth = 24;
  const dashFaceX = cowlX + ipDepth;
  const ipHeight = 12;
  const ipWidth = cabinWidth - 8;
  const ipCenterX = (cowlX + dashFaceX) / 2;
  const ipCenterY = cowlY - 6;

  const ipGeo = new THREE.BoxGeometry(ipDepth, ipHeight, ipWidth);
  const ipMesh = new THREE.Mesh(ipGeo, dashMat);
  ipMesh.position.set(ipCenterX, ipCenterY, 0);
  addCadEdges(ipMesh, 0x38bdf8);
  cockpitGroup.add(ipMesh);

  // Slim Defroster Vent Strip at base of windshield
  const defrosterGeo = new THREE.BoxGeometry(4, 1.2, cabinWidth - 10);
  const defroster = new THREE.Mesh(defrosterGeo, trimMat);
  defroster.position.set(cowlX + 2, cowlY - 1.5, 0);
  cockpitGroup.add(defroster);

  // 2. UK Right Hand Drive (RHD): Driver on RIGHT side (-Z)
  const driverZ = -((totalCarWidth / 4) - 6);

  // Sculpted Instrument Cluster Binnacle
  const binnacleGeo = new THREE.BoxGeometry(12, 6.5, 20);
  const binnacle = new THREE.Mesh(binnacleGeo, dashMat);
  binnacle.position.set(dashFaceX - 6, ipCenterY + 7.5, driverZ);
  cockpitGroup.add(binnacle);

  // Glowing Digital Virtual Cockpit Display
  const gaugeGeo = new THREE.PlaneGeometry(15, 5.0);
  const gauge = new THREE.Mesh(gaugeGeo, screenMat);
  gauge.position.set(dashFaceX + 0.2, ipCenterY + 7.5, driverZ);
  gauge.rotation.y = Math.PI / 2;
  cockpitGroup.add(gauge);

  // Center Infotainment Floating Display (angled 12° toward UK driver)
  const centerScreenGeo = new THREE.BoxGeometry(2.5, 6.5, 18);
  const centerScreen = new THREE.Mesh(centerScreenGeo, screenMat);
  centerScreen.position.set(dashFaceX + 0.5, ipCenterY + 4, 0);
  centerScreen.rotation.y = -0.14;
  cockpitGroup.add(centerScreen);

  // Center Console Tunnel (running from dashboard center stack back between front seats)
  const tunnelLen = Math.max(16, Math.abs(frontSeatsX + 8 - dashFaceX));
  const tunnelGeo = new THREE.BoxGeometry(tunnelLen, 9, 15);
  const tunnel = new THREE.Mesh(tunnelGeo, trimMat);
  tunnel.position.set(dashFaceX + (tunnelLen / 2), cabinFloorY + 4.5, 0);
  cockpitGroup.add(tunnel);

  // Center Armrest between front seats
  const armrestGeo = new THREE.BoxGeometry(16, 4, 14);
  const armrest = new THREE.Mesh(armrestGeo, dashMat);
  armrest.position.set(frontSeatsX + 4, cabinFloorY + 10.5, 0);
  cockpitGroup.add(armrest);

  // Sport 3-Spoke Steering Wheel positioned in front of driver
  const wheelX = dashFaceX + 8;
  const wheelY = ipCenterY + 4.5;
  const columnGeo = new THREE.CylinderGeometry(2.2, 2.5, 12, 16);
  const column = new THREE.Mesh(columnGeo, dashMat);
  column.rotation.z = -Math.PI / 4;
  column.position.set(wheelX - 4.5, wheelY - 3.5, driverZ);
  cockpitGroup.add(column);

  const steerGroup = new THREE.Group();
  steerGroup.position.set(wheelX, wheelY, driverZ);
  steerGroup.rotation.y = Math.PI / 2;
  steerGroup.rotation.x = -0.38;

  const rimGeo = new THREE.TorusGeometry(10.5, 1.3, 12, 28);
  const rim = new THREE.Mesh(rimGeo, dashMat);
  steerGroup.add(rim);

  const hubGeo = new THREE.CylinderGeometry(3.2, 3.2, 2.2, 16);
  const hub = new THREE.Mesh(hubGeo, trimMat);
  hub.rotation.x = Math.PI / 2;
  steerGroup.add(hub);

  [-Math.PI / 6, Math.PI / 6, -Math.PI / 2].forEach(angle => {
    const spokeGeo = new THREE.BoxGeometry(2.0, 9.5, 1.4);
    const spoke = new THREE.Mesh(spokeGeo, trimMat);
    spoke.position.set(Math.sin(angle) * 4.8, Math.cos(angle) * 4.8, 0);
    spoke.rotation.z = -angle;
    steerGroup.add(spoke);
  });
  cockpitGroup.add(steerGroup);

  return cockpitGroup;
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
 * sculpted aerodynamic hood, jewel-like LED headlights, curved bumpers with lower air intakes,
 * detailed cockpit, side mirrors, interior carpet bay, toggleable boot, and multi-angle cargo placement.
 */
function update3DStudio(car, seatsFolded, fitResult) {
  if (!scene) return;

  // Reset active simulation when geometry updates to avoid orphan anim loops
  isIngressSimulating = false;
  if (btnSimulateIngress) btnSimulateIngress.classList.remove('playing');
  if (animBtnLabel) animBtnLabel.textContent = 'Watch It Load';

  if (car3DGroup) scene.remove(car3DGroup);
  if (cargo3DMesh) scene.remove(cargo3DMesh);
  if (cargoSimulationBaseGroup) scene.remove(cargoSimulationBaseGroup);

  car3DGroup = new THREE.Group();

  const totalLength = car.overall_length;
  const totalCarWidth = car.overall_width;
  const cabinWidth = totalCarWidth * 0.84;
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

  // AUTHENTIC AUTOMOTIVE ARCHITECTURE: Realistic front overhangs & wheelbases
  // (Prevents the cartoonish long bonnet / anteater look!)
  let frontOverhangRatio = 0.50;
  if (isSaloon) frontOverhangRatio = 0.43;      // Longitudinal engine: short front overhang (~80cm)
  else if (isEstate) frontOverhangRatio = 0.42; // Long rear cargo overhang (~84cm front, ~112cm rear)
  else if (isSUV) frontOverhangRatio = 0.46;    // Balanced SUV proportions (~83cm front, ~95cm rear)
  else if (isHatch) frontOverhangRatio = 0.51;  // Transverse FWD hatchback (~84cm front, ~81cm rear)

  const frontOverhang = Math.round((totalLength - car.wheelbase) * frontOverhangRatio);
  const frontWheelX = carFrontX + frontOverhang;
  const rearWheelX = frontWheelX + car.wheelbase;

  // Key vertical & longitudinal profile datum
  const beltY = sillY + 22;
  const roofTopY = car.overall_height;

  // PROPER PRODUCTION AUTOMOTIVE PROPORTIONS:
  // In all production passenger cars, the cowl (base of windshield) sits just behind the front axle line:
  // - Hatchback (FWD transverse): ~46 cm behind front axle line (realistic ~124-128 cm bonnet, ~30% of car length)
  // - Estate: ~48 cm behind front axle (sleek ~130 cm bonnet, ~28% of car length)
  // - SUV: ~48 cm behind front axle (upright ~132 cm bonnet, ~29% of car length)
  // - Saloon: ~56 cm behind front axle (classic longitudinal prestige bonnet ~136 cm, ~29% of car length)
  const cowlX = frontWheelX + (isSaloon ? 56 : (isSUV ? 48 : (isEstate ? 48 : 46)));
  const cowlY = beltY + 4;

  // Modern windscreen rake (~36°-40° from horizontal):
  // Rakes back ~38 to 44 cm horizontally from cowl to roof header
  const windshieldRun = isSaloon ? 44 : (isSUV ? 38 : (isEstate ? 40 : 38));
  const roofFrontX = cowlX + windshieldRun;

  // The dashboard sits directly at the base of the windshield (cowlX) and extends ~24 cm into the cabin
  const ipDepth = 24;
  const dashFaceX = cowlX + ipDepth;

  // Front seats sit in the front cabin with natural ergonomic reach to the steering wheel (~34 cm behind dash)
  const frontSeatsX = dashFaceX + 34;
  const cargoBedFrontX = rearSillX - currentFloorLen;

  let roofRearX, deckFrontX;
  if (isSaloon) {
    // Saloon: Swept fastback roofline down to trunk deck
    roofRearX = rearWheelX - 22;
    deckFrontX = rearWheelX + 16;
  } else if (isEstate) {
    // Estate: Long roof extending back towards the rear tailgate
    roofRearX = rearSillX - 10;
    deckFrontX = rearSillX;
  } else if (isSUV) {
    // SUV: Athletic roofline with rear spoiler overhang
    roofRearX = rearWheelX + 10;
    deckFrontX = rearSillX;
  } else {
    // Hatchback: Sporty compact roof tapering to rear roof spoiler
    roofRearX = rearWheelX - 4;
    deckFrontX = rearSillX;
  }

  // B-pillar is aligned directly beside the driver's seat
  const bPillarX = frontSeatsX + 16;
  const cPillarX = isEstate ? (bPillarX + (roofRearX - bPillarX) * 0.58) : (isSaloon ? deckFrontX : roofRearX);
  const dPillarX = isEstate ? roofRearX : null;

  // Materials: CAD Cutaway vs Showroom Paint
  const isGhost = xRayMode < 0.85;

  const bodyPaintMat = new THREE.MeshPhysicalMaterial({
    color: 0x142848, // Deep Automotive Royal Navy
    metalness: 0.88,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transparent: isGhost,
    opacity: isGhost ? 0.65 : 1.0,
    depthWrite: true,
    side: THREE.DoubleSide
  });

  const claddingMat = new THREE.MeshStandardMaterial({
    color: 0x090e17, // Matte charcoal protective SUV cladding
    roughness: 0.92,
    metalness: 0.08
  });

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x060910, // Piano black pillars
    roughness: 0.15,
    metalness: 0.7,
    transparent: isGhost,
    opacity: isGhost ? 0.85 : 1.0
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x081628, // Tinted automotive glass
    roughness: 0.06,
    metalness: 0.15,
    transparent: true,
    opacity: isGhost ? 0.28 : 0.45,
    depthWrite: false
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.96,
    roughness: 0.12
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8
  });

  const headlampMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 2.2,
    roughness: 0.1
  });

  const taillampMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 2.4,
    roughness: 0.15
  });

  // 1. FOUR WHEELS & WHEEL WELL LINERS
  const wheelWidth = 20;
  const wheelZOffset = (totalCarWidth / 2) - 12.5;
  const wheelPositions = [
    [frontWheelX, wheelY, wheelZOffset],
    [frontWheelX, wheelY, -wheelZOffset],
    [rearWheelX, wheelY, wheelZOffset],
    [rearWheelX, wheelY, -wheelZOffset]
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheel = createWheel3D(wheelRadius, wheelWidth, isSUV);
    wheel.position.set(wx, wy, wz);
    if (wz < 0) wheel.rotation.y = Math.PI;
    car3DGroup.add(wheel);

    // Dark Wheel Arch Well Liner (recessed inside wheel well)
    const linerGeo = new THREE.CylinderGeometry(wheelArchR + 0.2, wheelArchR + 0.2, 14, 24, 1, true, 0, Math.PI);
    const linerMat = new THREE.MeshStandardMaterial({
      color: 0x05080f,
      roughness: 0.96,
      metalness: 0.04,
      side: THREE.DoubleSide
    });
    const liner = new THREE.Mesh(linerGeo, linerMat);
    liner.rotation.z = Math.PI / 2;
    liner.rotation.y = Math.PI / 2;
    liner.position.set(wx, wy, wz > 0 ? wz - 3 : wz + 3);
    car3DGroup.add(liner);
  });

  // 2. SCULPTED AERODYNAMIC HOOD & NOSE CONE
  // Two-stage sculpted bonnet: gentle main slope + nose drop into bumper
  const noseBreakX = carFrontX + 16;
  const mainHoodLen = Math.abs(cowlX - noseBreakX);
  const mainHoodSlope = Math.atan2((cowlY - 1) - (sillY + 16), mainHoodLen);

  const mainHoodWidthRear = cabinWidth - 4;
  const mainHoodWidthFront = totalCarWidth * 0.74;
  const mainHoodAvgWidth = (mainHoodWidthRear + mainHoodWidthFront) / 2;

  // Main Bonnet Surface
  const mainHoodGeo = new THREE.BoxGeometry(mainHoodLen, 2.2, mainHoodAvgWidth);
  const mainHood = new THREE.Mesh(mainHoodGeo, bodyPaintMat);
  mainHood.position.set((cowlX + noseBreakX) / 2, ((cowlY - 1) + sillY + 16) / 2, 0);
  mainHood.rotation.z = mainHoodSlope;
  addCadEdges(mainHood, 0x38bdf8);
  car3DGroup.add(mainHood);

  // Athletic Center Power Bulge / Spine
  const spineGeo = new THREE.BoxGeometry(mainHoodLen - 6, 1.8, mainHoodAvgWidth * 0.42);
  const spine = new THREE.Mesh(spineGeo, bodyPaintMat);
  spine.position.set((cowlX + noseBreakX) / 2, (((cowlY - 1) + sillY + 16) / 2) + 1.0, 0);
  spine.rotation.z = mainHoodSlope;
  car3DGroup.add(spine);

  // Curved Nose Drop into Front Grille / Bumper
  const noseDropLen = Math.abs(noseBreakX - (carFrontX + 2));
  const noseDropSlope = Math.atan2((sillY + 16) - (sillY + 7), noseDropLen);
  const noseDropGeo = new THREE.BoxGeometry(noseDropLen, 2.2, mainHoodWidthFront);
  const noseDrop = new THREE.Mesh(noseDropGeo, bodyPaintMat);
  noseDrop.position.set((noseBreakX + carFrontX + 2) / 2, (sillY + 16 + sillY + 7) / 2, 0);
  noseDrop.rotation.z = noseDropSlope;
  addCadEdges(noseDrop, 0x38bdf8);
  car3DGroup.add(noseDrop);

  // Recessed Cowl Plenum Tray & Wiper Arms at base of windshield
  const cowlPlenumGeo = new THREE.BoxGeometry(7, 2.2, cabinWidth - 4);
  const cowlPlenum = new THREE.Mesh(cowlPlenumGeo, trimMat);
  cowlPlenum.position.set(cowlX + 2, cowlY - 1.2, 0);
  car3DGroup.add(cowlPlenum);

  [-1, 1].forEach(side => {
    const wiperGeo = new THREE.BoxGeometry(26, 0.9, 1.2);
    const wiper = new THREE.Mesh(wiperGeo, trimMat);
    wiper.position.set(cowlX + 3, cowlY + 0.4, side * ((cabinWidth / 4) - 2));
    wiper.rotation.y = side * 0.08;
    car3DGroup.add(wiper);
  });

  // 3. AERODYNAMIC FRONT BUMPER, LOWER AIR DAM & GRILLE
  const bumperHeight = isSUV ? 28 : 22;
  const bumperCenterWidth = totalCarWidth * 0.70;

  // Center Bumper Bar
  const frontBumperGeo = new THREE.BoxGeometry(6, bumperHeight, bumperCenterWidth);
  const frontBumper = new THREE.Mesh(frontBumperGeo, bodyPaintMat);
  frontBumper.position.set(carFrontX + 3, sillY - 2, 0);
  addCadEdges(frontBumper, 0x38bdf8);
  car3DGroup.add(frontBumper);

  // Swept Aerodynamic Bumper Corner Wings (curving back 40° towards front wheel arches)
  [-1, 1].forEach(side => {
    const cornerSpan = (totalCarWidth - bumperCenterWidth) / 2;
    const cornerGeo = new THREE.BoxGeometry(14, bumperHeight, cornerSpan);
    const corner = new THREE.Mesh(cornerGeo, bodyPaintMat);
    corner.position.set(carFrontX + 8, sillY - 2, side * ((bumperCenterWidth / 2) + (cornerSpan / 2)));
    corner.rotation.y = side * -0.32;
    addCadEdges(corner, 0x38bdf8);
    car3DGroup.add(corner);
  });

  // Lower Air Dam / Radiator Intake Mesh
  const lowerIntakeGeo = new THREE.BoxGeometry(4, 9, bumperCenterWidth - 24);
  const lowerIntake = new THREE.Mesh(lowerIntakeGeo, trimMat);
  lowerIntake.position.set(carFrontX + 4.5, sillY - 7, 0);
  car3DGroup.add(lowerIntake);

  // Lower Front Splitter Blade
  const splitterGeo = new THREE.BoxGeometry(9, 2.0, totalCarWidth - 12);
  const splitter = new THREE.Mesh(splitterGeo, trimMat);
  splitter.position.set(carFrontX + 5, sillY - 13.5, 0);
  car3DGroup.add(splitter);

  // Brand-Specific Grille Styling
  if (car.id.includes('tesla')) {
    // Tesla Model Y: Smooth aerodynamic grille-less nose
    const aeroCapGeo = new THREE.BoxGeometry(3, 8, bumperCenterWidth - 16);
    const aeroCap = new THREE.Mesh(aeroCapGeo, bodyPaintMat);
    aeroCap.position.set(carFrontX + 4.5, sillY + 4, 0);
    car3DGroup.add(aeroCap);
  } else if (car.id.includes('bmw')) {
    // BMW Twin Kidney Grille Bezels
    [-1, 1].forEach(side => {
      const kidneyGeo = new THREE.BoxGeometry(3.5, 9, 14);
      const kidney = new THREE.Mesh(kidneyGeo, chromeMat);
      kidney.position.set(carFrontX + 4.8, sillY + 4, side * 8.5);
      car3DGroup.add(kidney);

      const slatGeo = new THREE.BoxGeometry(3.8, 8, 12);
      const slat = new THREE.Mesh(slatGeo, trimMat);
      slat.position.set(carFrontX + 4.6, sillY + 4, side * 8.5);
      car3DGroup.add(slat);
    });
  } else if (car.id.includes('audi')) {
    // Audi Singleframe Grille
    const singleframeGeo = new THREE.BoxGeometry(3.5, 15, bumperCenterWidth - 28);
    const singleframe = new THREE.Mesh(singleframeGeo, trimMat);
    singleframe.position.set(carFrontX + 4.8, sillY + 1, 0);
    car3DGroup.add(singleframe);
    addCadEdges(singleframe, 0xe2e8f0);
  } else {
    // VW Golf Mk8 & Hatchbacks: Sleek horizontal grille strip with illuminated LED lightbar
    const grilleStripGeo = new THREE.BoxGeometry(3.5, 3.5, bumperCenterWidth - 12);
    const grilleStrip = new THREE.Mesh(grilleStripGeo, trimMat);
    grilleStrip.position.set(carFrontX + 4.8, sillY + 5, 0);
    car3DGroup.add(grilleStrip);

    const ledStripGeo = new THREE.BoxGeometry(3.6, 1.2, bumperCenterWidth - 16);
    const ledStrip = new THREE.Mesh(ledStripGeo, headlampMat);
    ledStrip.position.set(carFrontX + 5.0, sillY + 5, 0);
    car3DGroup.add(ledStrip);
  }

  // SUV Front Skid Plate
  if (isSUV) {
    const skidGeo = new THREE.BoxGeometry(10, 6, bumperCenterWidth - 36);
    const skid = new THREE.Mesh(skidGeo, chromeMat);
    skid.position.set(carFrontX + 4.5, sillY - 11, 0);
    car3DGroup.add(skid);
  }

  // 4. HIGH-TECH JEWEL LED HEADLIGHT CLUSTERS
  [-1, 1].forEach(side => {
    const headGroup = new THREE.Group();
    const headZ = side * ((totalCarWidth / 2) - 15);
    headGroup.position.set(carFrontX + 6, sillY + 7, headZ);
    headGroup.rotation.y = side * -0.24; // Swept back along fender curve

    // Outer Aerodynamic Clear Polycarbonate Lens
    const lensGeo = new THREE.BoxGeometry(14, 7, 22);
    const lens = new THREE.Mesh(lensGeo, glassMat);
    headGroup.add(lens);

    // Dark Inner Projector Housing
    const housingGeo = new THREE.BoxGeometry(11, 6, 20);
    const housing = new THREE.Mesh(housingGeo, trimMat);
    housing.position.set(-1, 0, 0);
    headGroup.add(housing);

    // Dual Glowing LED Projector Lenses
    [-5, 4].forEach(offsetZ => {
      const projGeo = new THREE.CylinderGeometry(2.0, 2.0, 3, 16);
      const proj = new THREE.Mesh(projGeo, headlampMat);
      proj.rotation.z = Math.PI / 2;
      proj.position.set(4, 0, offsetZ);
      headGroup.add(proj);
    });

    // Signature Glowing LED Daytime Running Light (DRL) Brow Strip
    const drlGeo = new THREE.BoxGeometry(12, 1.2, 19);
    const drl = new THREE.Mesh(drlGeo, headlampMat);
    drl.position.set(1.5, 2.6, 0);
    headGroup.add(drl);

    // Amber Turn Signal Corner Accent
    const amberGeo = new THREE.BoxGeometry(4, 3, 2.5);
    const amberMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.8
    });
    const amber = new THREE.Mesh(amberGeo, amberMat);
    amber.position.set(-2, 0, side * 9);
    headGroup.add(amber);

    addCadEdges(lens, 0x38bdf8);
    car3DGroup.add(headGroup);
  });

  // 5. AERODYNAMIC RAKED WINDSHIELD & A-PILLARS
  const windSpanX = Math.abs(roofFrontX - cowlX);
  const windSpanY = Math.abs(roofTopY - cowlY);
  const windLen = Math.hypot(windSpanX, windSpanY);
  const windAngle = Math.atan2(windSpanY, windSpanX);

  // Main Raked Windscreen Glass
  const windGeo = new THREE.BoxGeometry(windLen, 2.0, cabinWidth - 6);
  const windshield = new THREE.Mesh(windGeo, glassMat);
  windshield.position.set((cowlX + roofFrontX) / 2, (cowlY + roofTopY) / 2, 0);
  windshield.rotation.z = windAngle;
  car3DGroup.add(windshield);

  // Ceramic Blackout Perimeter Frit Border
  const fritGeo = new THREE.BoxGeometry(windLen - 4, 1.0, cabinWidth - 8);
  const fritMat = new THREE.MeshStandardMaterial({ color: 0x050810, roughness: 0.9 });
  const frit = new THREE.Mesh(fritGeo, fritMat);
  frit.position.set((cowlX + roofFrontX) / 2, (cowlY + roofTopY) / 2, 0);
  frit.rotation.z = windAngle;
  car3DGroup.add(frit);

  // Left & Right A-Pillars (Framing Windscreen and flowing into Roof Cantrails)
  [-wheelZOffset, wheelZOffset - 3].forEach(zPos => {
    const aPillarGeo = new THREE.BoxGeometry(windLen + 4, 5.0, 4.0);
    const aPillar = new THREE.Mesh(aPillarGeo, bodyPaintMat);
    aPillar.position.set((cowlX + roofFrontX) / 2, (cowlY + roofTopY) / 2, zPos + 1.5);
    aPillar.rotation.z = windAngle;
    addCadEdges(aPillar, 0x38bdf8);
    car3DGroup.add(aPillar);
  });

  // Interior Rearview Mirror mounted at top center of windscreen
  const rvmStemGeo = new THREE.BoxGeometry(2, 4, 2);
  const rvmStem = new THREE.Mesh(rvmStemGeo, trimMat);
  rvmStem.position.set(roofFrontX - 4, roofTopY - 4, 0);
  car3DGroup.add(rvmStem);

  const rvmGeo = new THREE.BoxGeometry(2.5, 4.5, 14);
  const rvm = new THREE.Mesh(rvmGeo, trimMat);
  rvm.position.set(roofFrontX - 3, roofTopY - 6.5, 0);
  car3DGroup.add(rvm);

  // 6. SCULPTED FLANKS & MOLDED WHEEL ARCH LIPS
  const flankShape = new THREE.Shape();
  flankShape.moveTo(carFrontX + 4, sillY - 12);
  flankShape.lineTo(carFrontX, sillY - 4);
  flankShape.lineTo(carFrontX, sillY + 6);
  flankShape.lineTo(carFrontX + 16, sillY + 16);
  flankShape.lineTo(cowlX, beltY + 2);
  flankShape.lineTo(cowlX + 4, beltY);

  if (isSaloon) {
    flankShape.lineTo(deckFrontX, beltY);
    flankShape.lineTo(rearBumperX - 4, beltY - 2);
  } else if (isEstate) {
    flankShape.lineTo(rearSillX + 4, beltY);
  } else if (isSUV) {
    flankShape.lineTo(rearSillX + 2, beltY + 2);
  } else {
    flankShape.lineTo(rearSillX + 4, beltY);
  }

  flankShape.lineTo(rearBumperX, sillY + 6);
  flankShape.lineTo(rearBumperX, sillY - 14);

  // Underside with circular Wheel Arch Cutouts
  flankShape.lineTo(rearWheelX + wheelArchR, sillY - 14);
  flankShape.lineTo(rearWheelX + wheelArchR, wheelY);
  flankShape.absarc(rearWheelX, wheelY, wheelArchR, 0, Math.PI, false);
  flankShape.lineTo(rearWheelX - wheelArchR, sillY - 14);

  // Rocker sill between front & rear wheels
  flankShape.lineTo(frontWheelX + wheelArchR, sillY - 14);
  flankShape.lineTo(frontWheelX + wheelArchR, wheelY);
  flankShape.absarc(frontWheelX, wheelY, wheelArchR, 0, Math.PI, false);
  flankShape.lineTo(frontWheelX - wheelArchR, sillY - 14);

  // Front chin
  flankShape.lineTo(carFrontX + 8, sillY - 14);
  flankShape.lineTo(carFrontX + 4, sillY - 12);

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

  // Sculpted Rocker Panel Sill between wheels (flush with flank)
  [-wheelZOffset, wheelZOffset - 3].forEach(zPos => {
    const rockerLen = Math.abs((rearWheelX - wheelArchR) - (frontWheelX + wheelArchR)) + 2;
    const rockerGeo = new THREE.BoxGeometry(rockerLen, isSUV ? 6.5 : 4.5, 3.0);
    const rocker = new THREE.Mesh(rockerGeo, isSUV ? claddingMat : bodyPaintMat);
    rocker.position.set((frontWheelX + rearWheelX) / 2, sillY - 12, zPos + 1.5);
    car3DGroup.add(rocker);
  });

  // 7. GREENHOUSE PILLARS & SIDE WINDOWS
  [-wheelZOffset, wheelZOffset - 3].forEach(zPos => {
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
      const cPillarGeo = new THREE.BoxGeometry(6.0, bHeight, 3.2);
      const cPillar = new THREE.Mesh(cPillarGeo, pillarMat);
      cPillar.position.set(cPillarX, beltY + (bHeight / 2), zPos + 1.5);
      car3DGroup.add(cPillar);

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

      // Panoramic Rear Cargo Quarter Window
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

      const rWinWidth = Math.abs(roofRearX - bPillarX) - 6;
      const rWinGeo = new THREE.BoxGeometry(rWinWidth, winHeight, 1.2);
      const rWin = new THREE.Mesh(rWinGeo, glassMat);
      rWin.position.set((bPillarX + roofRearX) / 2, beltY + (winHeight / 2) + 1, zPos + 1.5);
      car3DGroup.add(rWin);
    }
  });

  // 8. SIDE WING MIRRORS & DOOR HANDLES
  const leftMirror = createSideMirror3D(true, bodyPaintMat, trimMat);
  leftMirror.position.set(cowlX + 4, beltY + 2, (totalCarWidth / 2) - 4);
  car3DGroup.add(leftMirror);

  const rightMirror = createSideMirror3D(false, bodyPaintMat, trimMat);
  rightMirror.position.set(cowlX + 4, beltY + 2, -((totalCarWidth / 2) - 4));
  car3DGroup.add(rightMirror);

  [-wheelZOffset, wheelZOffset - 2].forEach(zPos => {
    [bPillarX - 22, bPillarX + 26].forEach(hx => {
      const handleGeo = new THREE.BoxGeometry(9, 2.2, 1.8);
      const handle = new THREE.Mesh(handleGeo, bodyPaintMat);
      handle.position.set(hx, beltY - 5, zPos + (zPos > 0 ? 3 : -3));
      car3DGroup.add(handle);
    });
  });

  // 9. ROOF PANEL & ROOF RAILS
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

  // 10. TOGGLEABLE REAR BOOT / TAILGATE ASSEMBLY
  tailgatePivot = new THREE.Group();
  const openAngle = getOpenTailgateAngle(bodyType);

  if (isSaloon) {
    // SALOON NOTCHBACK SPECIFICS:
    const rearWinLen = Math.hypot(deckFrontX - roofRearX, roofTopY - beltY);
    const rearWinAngle = Math.atan2(roofTopY - beltY, deckFrontX - roofRearX);
    const rearWinGeo = new THREE.BoxGeometry(rearWinLen - 4, 1.8, cabinWidth - 8);
    const rearWin = new THREE.Mesh(rearWinGeo, glassMat);
    rearWin.position.set((roofRearX + deckFrontX) / 2, (roofTopY + beltY) / 2, 0);
    rearWin.rotation.z = -rearWinAngle;
    car3DGroup.add(rearWin);

    const parcelGeo = new THREE.BoxGeometry(32, 2.5, cabinWidth - 6);
    const parcelShelf = new THREE.Mesh(parcelGeo, trimMat);
    parcelShelf.position.set(rearWheelX - 6, beltY + 1.25, 0);
    car3DGroup.add(parcelShelf);

    const finGeo = new THREE.ConeGeometry(2.5, 6, 4);
    const fin = new THREE.Mesh(finGeo, bodyPaintMat);
    fin.position.set(roofRearX - 8, roofTopY + 3, 0);
    fin.rotation.y = Math.PI / 4;
    car3DGroup.add(fin);

    tailgatePivot.position.set(deckFrontX, beltY, 0);

    const trunkLen = Math.abs(rearBumperX - deckFrontX) - 4;
    const trunkLidGeo = new THREE.BoxGeometry(trunkLen, 2.5, totalCarWidth - 14);
    const trunkLid = new THREE.Mesh(trunkLidGeo, bodyPaintMat);
    trunkLid.position.set(trunkLen / 2, 0, 0);
    addCadEdges(trunkLid, 0x38bdf8);
    tailgatePivot.add(trunkLid);

    const rearFaceGeo = new THREE.BoxGeometry(3, 16, totalCarWidth - 18);
    const rearFace = new THREE.Mesh(rearFaceGeo, bodyPaintMat);
    rearFace.position.set(trunkLen, -7, 0);
    tailgatePivot.add(rearFace);

    const tailBarGeo = new THREE.BoxGeometry(4, 5, totalCarWidth - 22);
    const tailBar = new THREE.Mesh(tailBarGeo, taillampMat);
    tailBar.position.set(trunkLen + 1, -2, 0);
    tailgatePivot.add(tailBar);

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

  // 11. APERTURE CAD BOUNDARY FRAME
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

  // 12. INTERIOR CARGO BAY, COCKPIT & SEATING ARCHITECTURE
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

  // Front Bucket Seats (UK Right Hand Drive: Driver at -Z, Passenger at +Z)
  const seatZOffset = (totalCarWidth / 4) - 6;
  const driverSeat = createSeat3D(44, 42);
  driverSeat.position.set(frontSeatsX, cabinFloorY, -seatZOffset); // Driver on RIGHT side (-Z)
  const passSeat = createSeat3D(44, 42);
  passSeat.position.set(frontSeatsX, cabinFloorY, seatZOffset); // Passenger on LEFT side (+Z)
  car3DGroup.add(driverSeat);
  car3DGroup.add(passSeat);

  // Cockpit Dashboard, Instrument Binnacle & Sport Steering Wheel
  const cockpit = createCockpit3D(cabinWidth, cowlX, cowlY, beltY, frontSeatsX, cabinFloorY, totalCarWidth);
  car3DGroup.add(cockpit);

  // Rear Folding Seats
  const rearSeatGroup = new THREE.Group();
  const rearSeatMat = new THREE.MeshStandardMaterial({ color: 0x111b2b, roughness: 0.75 });
  const rearHingeX = rearSillX - car.floor_length_seats_up;

  if (seatsFolded) {
    const foldedLen = Math.max(30, currentFloorLen - car.floor_length_seats_up);
    const foldedGeo = new THREE.BoxGeometry(foldedLen, 5, archW + 10);
    const foldedMesh = new THREE.Mesh(foldedGeo, rearSeatMat);
    foldedMesh.position.set(rearHingeX - (foldedLen / 2), sillY + 3.5, 0);
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

    } else if (fitResult.mode === 'center') {
      // Center through-load: rests flat on boot floor and glides between front bucket seats
      const posX = rearSillX - (rot.l / 2) - 4;
      cargo3DMesh.position.set(posX, sillY + (rot.h / 2) + 2.5, 0);
      cargoSimulationBaseGroup.add(cargo3DMesh);

    } else {
      // Standard Flat or Colliding
      if (fitResult.status === 'colliding' && rot.l > currentFloorLen) {
        // Stopped by the front seatbacks, so it visibly sticks out the back of the car!
        const posX = cargoBedFrontX + (rot.l / 2);
        cargo3DMesh.position.set(posX, sillY + (rot.h / 2) + 2.5, 0);
      } else {
        const posX = rearSillX - (rot.l / 2) - 4;
        cargo3DMesh.position.set(posX, sillY + (rot.h / 2) + 2.5, 0);
      }
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
    if (animBtnLabel) animBtnLabel.textContent = 'Watch It Load';
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
    if (animBtnLabel) animBtnLabel.textContent = 'Pause';
  }
  // Ensure tailgate is open for loading
  if (!isTailgateOpen) {
    if (btnBootToggle) btnBootToggle.click();
  }
}

function updateCargoSimulationFrame(p) {
  if (!cargoSimulationBaseGroup || !lastFitResult || !lastFitResult.rot) return;

  const rearBumperX = 70;
  const rearSillX = rearBumperX - (selectedCar.body_type === 'estate' ? 18 : (selectedCar.body_type === 'saloon' ? 24 : 22));
  const rotL = lastFitResult.rot.l;

  // Calculate positive start offset outside behind the tailgate
  const startOffsetX = (rearBumperX - rearSillX) + Math.min(85, rotL * 0.65) + 26;

  // Smooth monotonic ease-out progression (0 = outside, 1 = stowed, never overshoots 0)
  const clampedP = Math.max(0, Math.min(1, p));
  const t = 1 - Math.pow(1 - clampedP, 2.6);
  const currentX = startOffsetX * (1 - t);

  // Gentle 3.5 cm lift above sill while outside that smoothly settles to 0 on cargo floor
  const currentY = clampedP < 0.75 ? 3.5 * Math.cos((clampedP / 0.75) * (Math.PI / 2)) : 0;
  cargoSimulationBaseGroup.position.set(currentX, currentY, 0);

  // Dynamic Orientation Transitions during loading:
  if (lastFitResult.ingress && !lastFitResult.ingress.direct && lastFitResult.mode !== 'roll') {
    // If cargo needs to roll diagonally to clear aperture, tilt through opening and level out on floor
    const rollTarget = (lastFitResult.ingress.rollAngle * Math.PI) / 180;
    let simRoll = 0;
    if (clampedP < 0.3) {
      simRoll = rollTarget * (clampedP / 0.3);
    } else if (clampedP < 0.65) {
      simRoll = rollTarget;
    } else {
      const subP = (clampedP - 0.65) / 0.35;
      simRoll = rollTarget * (1 - subP);
    }
    cargoSimulationBaseGroup.rotation.x = simRoll;

  } else if (lastFitResult.mode === 'pitch') {
    // Pitch tilt: item enters level through the tailgate opening, then elevates onto seatback as it reaches front
    const pitchRad = (lastFitResult.angle * Math.PI) / 180;
    if (clampedP < 0.5) {
      cargoSimulationBaseGroup.rotation.z = pitchRad; // neutralizes pivot rotation so it glides in level
    } else {
      const subP = (clampedP - 0.5) / 0.5;
      cargoSimulationBaseGroup.rotation.z = pitchRad * (1 - subP);
    }
  } else {
    cargoSimulationBaseGroup.rotation.set(0, 0, 0);
  }
}

document.addEventListener('DOMContentLoaded', init);