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
let xRayMode = 1.0; // 1.0 (Solid Showroom Paint) or 0.70 (Sleek Cutaway)
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
const btnShareLink = document.getElementById('btn-share-link');
const toastNotification = document.getElementById('toast-notification');

function showToast(message) {
  if (!toastNotification) return;
  toastNotification.textContent = message;
  toastNotification.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toastNotification.classList.remove('show');
  }, 2800);
}

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
let plinthGroup = null;
let gridHelper = null;
let flankFill = null;
let flankFillOpposite = null;

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

  // URL parameter support for direct deep-linking & SEO landing pages
  const urlParams = new URLSearchParams(window.location.search);
  const paramCar = urlParams.get('car');
  if (paramCar) {
    const cleanParam = paramCar.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundIdx = vehicles.findIndex(v => {
      const cleanId = (v.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanName = (v.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanId === cleanParam || cleanId.includes(cleanParam) || cleanParam.includes(cleanId) ||
             cleanName.includes(cleanParam);
    });
    if (foundIdx >= 0) {
      carSelect.value = String(foundIdx);
      selectedCar = vehicles[foundIdx];
    }
  }

  const paramItem = urlParams.get('item');
  if (paramItem) {
    const p = paramItem.toLowerCase();
    if (p.includes('65')) {
      cargoLengthInput.value = 160; cargoWidthInput.value = 98; cargoHeightInput.value = 18;
      highlightPreset('160', '98', '18');
    } else if (p.includes('55')) {
      cargoLengthInput.value = 140; cargoWidthInput.value = 85; cargoHeightInput.value = 16;
      highlightPreset('140', '85', '16');
    } else if (p.includes('wash')) {
      cargoLengthInput.value = 60; cargoWidthInput.value = 60; cargoHeightInput.value = 85;
      highlightPreset('60', '60', '85');
    } else if (p.includes('ikea') || p.includes('bookcase')) {
      cargoLengthInput.value = 205; cargoWidthInput.value = 30; cargoHeightInput.value = 13;
      highlightPreset('205', '30', '13');
    } else if (p.includes('suit') || p.includes('luggage')) {
      cargoLengthInput.value = 76; cargoWidthInput.value = 50; cargoHeightInput.value = 30;
      highlightPreset('76', '50', '30');
    } else if (p.includes('bike') || p.includes('bicycle')) {
      cargoLengthInput.value = 175; cargoWidthInput.value = 65; cargoHeightInput.value = 105;
      highlightPreset('175', '65', '105');
    }
  }

  if (urlParams.has('length')) cargoLengthInput.value = urlParams.get('length');
  else if (urlParams.has('l')) cargoLengthInput.value = urlParams.get('l');

  if (urlParams.has('width')) cargoWidthInput.value = urlParams.get('width');
  else if (urlParams.has('w')) cargoWidthInput.value = urlParams.get('w');

  if (urlParams.has('height')) cargoHeightInput.value = urlParams.get('height');
  else if (urlParams.has('h')) cargoHeightInput.value = urlParams.get('h');

  if (urlParams.has('seats') || urlParams.has('seatsFolded')) {
    const val = (urlParams.get('seats') || urlParams.get('seatsFolded')).toLowerCase();
    foldSeatsCheckbox.checked = (val === 'down' || val === 'folded' || val === '1' || val === 'true');
  }
  if (urlParams.has('boot')) {
    isTailgateOpen = urlParams.get('boot') === 'open' || urlParams.get('boot') === '1';
  }

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
      btnXRayToggle.textContent = xRayMode < 0.85 ? '🚗 Solid Paint' : '👁️ See Inside';
      btnXRayToggle.classList.toggle('active', xRayMode < 0.85);
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

  // Share Direct Fitment Link Button
  if (btnShareLink) {
    btnShareLink.addEventListener('click', () => {
      const shareUrl = new URL(window.location.origin + window.location.pathname);
      if (selectedCar && selectedCar.id) {
        shareUrl.searchParams.set('car', selectedCar.id);
      }
      shareUrl.searchParams.set('l', cargoLengthInput.value || 0);
      shareUrl.searchParams.set('w', cargoWidthInput.value || 0);
      shareUrl.searchParams.set('h', cargoHeightInput.value || 0);
      shareUrl.searchParams.set('seats', foldSeatsCheckbox.checked ? 'down' : 'up');

      const urlString = shareUrl.toString();
      try {
        window.history.replaceState({}, '', shareUrl.search);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(urlString).then(() => {
            showToast('🔗 Direct fitment link copied to clipboard!');
          }).catch(() => {
            prompt('Copy this fitment link:', urlString);
          });
        } else {
          prompt('Copy this fitment link:', urlString);
        }
      } catch (err) {
        prompt('Copy this fitment link:', urlString);
      }
    });
  }

  window.addEventListener('resize', onWindowResize);
}

function clearActivePresets() {
  presetButtons.forEach(btn => btn.classList.remove('active'));
}

function highlightPreset(l, w, h) {
  presetButtons.forEach(btn => {
    if (btn.dataset.length === String(l) && btn.dataset.width === String(w) && btn.dataset.height === String(h)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
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
        if (!seatsFolded) {
          if (rot.l <= car.floor_length_seats_folded) {
            failureReasons.push(`Too long for boot floor with seats up (${rot.l} cm vs ${floorLength} cm limit). Tip: Fold the rear seats flat to fit easily (up to ${car.floor_length_seats_folded} cm room)!`);
          } else {
            failureReasons.push(`Too long for boot floor with seats up (${rot.l} cm vs ${floorLength} cm limit, max ${car.floor_length_seats_folded} cm with seats folded).`);
          }
        } else {
          if (rot.w > 34) {
            failureReasons.push(`Too long for boot floor (${rot.l} cm vs ${maxFloorSpan} cm max with seats folded) and too wide (${rot.w} cm) to slide between front seats (34 cm gap limit).`);
          } else {
            failureReasons.push(`Too long for boot floor (${rot.l} cm vs ${maxFloorSpan} cm max with seats folded).`);
          }
        }
      } else if (rot.l > usableLengthAtH && passesArch && passesRoof) {
        if (!seatsFolded && rot.l <= calculateUsableLength(car.floor_length_seats_folded, rot.h, tanRake, true, roofHeight)) {
          failureReasons.push(`Hits sloping rear window with seats up (max length at ${rot.h} cm height is ~${Math.round(usableLengthAtH)} cm). Tip: Fold the rear seats flat to slide further forward!`);
        } else {
          failureReasons.push(`Hits sloping rear window at ${rot.h} cm height (max length at this height is ~${Math.round(usableLengthAtH)} cm).`);
        }
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
      instruction: `Fits easily with plenty of room to spare (about ${Math.round(bestFlat.margin)} cm extra length).`
    };
  } else if (bestFlat && !bestFlat.ingress.direct) {
    overallOptimal = {
      mode: 'ingress',
      rot: bestFlat.rot,
      angle: bestFlat.ingress.rollAngle,
      status: 'angled',
      margin: bestFlat.margin,
      ingress: bestFlat.ingress,
      heading: `Needs Angle To Load (~${bestFlat.ingress.rollAngle}° Roll)`,
      instruction: `A bit wide for the boot opening, but slides right in when tilted slightly (~${bestFlat.ingress.rollAngle}° roll), then sits flat on the floor.`
    };
  } else if (bestFlat) {
    overallOptimal = {
      mode: 'flat',
      rot: bestFlat.rot,
      angle: 0,
      status: 'tight',
      margin: bestFlat.margin,
      ingress: bestFlat.ingress,
      heading: 'Fits Flat (Snug Fit)',
      instruction: `It will fit, but it's a close fit with about ${Math.round(bestFlat.margin * 10) / 10} cm clearance. Take care closing the tailgate.`
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
      instruction: `Hits the rear window glass if laid completely flat, but fits nicely propped against the seatback (~${bestPitch.angle}° tilt).`
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
      instruction: `Too long to fit straight, but fits easily when angled diagonally across the cargo bay.`
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
      instruction: `Wider than the wheel arches when flat, but fits safely banked against the side wall at ~${bestRoll.angle}°.`
    };
  } else if (bestThrough) {
    overallOptimal = {
      mode: 'center',
      rot: bestThrough.rot,
      angle: 0,
      status: bestThrough.margin >= 4 ? 'comfortable' : 'tight',
      margin: bestThrough.margin,
      ingress: bestThrough.ingress,
      heading: 'Fits Between Front Seats',
      instruction: `Slides forward between the two front seats over the armrest console with ${Math.round(bestThrough.margin)} cm room.`
    };
  } else {
    const canFitFolded = !seatsFolded && (
      (rawL <= car.floor_length_seats_folded && rawW <= archWidth && rawH <= roofHeight) ||
      (rawW <= car.floor_length_seats_folded && rawL <= archWidth && rawH <= roofHeight)
    );
    overallOptimal = {
      mode: 'colliding',
      rot: { l: rawL, w: rawW, h: rawH },
      angle: 0,
      status: 'colliding',
      margin: -1,
      ingress: checkApertureIngress({ l: rawL, w: rawW, h: rawH }, apWidth, apHeight),
      heading: canFitFolded ? "Won't Fit (Seats Up) – Fold Seats Flat" : "Too Large For This Boot",
      instruction: canFitFolded 
        ? "This item won't fit with the rear seats up, but should fit easily once you fold the rear seats flat!"
        : "This item is too large for the interior space of this car."
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
    resultBanner.textContent = '⚠️ Tight Squeeze – But It Fits!';
  } else if (activeResult.status === 'angled') {
    resultBanner.className = 'result-banner fits-angled';
    resultBanner.textContent = `📐 Fits With A Tilt (~${Math.round(activeResult.angle)}°)`;
  } else {
    const canFitFolded = !seatsFolded && (
      (parseFloat(cargoLengthInput.value) || 0) <= selectedCar.floor_length_seats_folded
    );
    resultBanner.className = 'result-banner will-not-fit';
    resultBanner.textContent = canFitFolded 
      ? "❌ Won't Fit (Seats Up) – Fold Seats Flat To Fit!" 
      : "❌ Too Large For This Boot";
  }

  resultExplanation.textContent = activeResult.instruction;

  if (strategyBadge) {
    strategyBadge.textContent = activeAngleMode === 'auto' ? 'BEST FIT' : activeAngleMode.toUpperCase();
  }
  if (strategyHeading) {
    strategyHeading.textContent = activeResult.heading;
  }

  // Update Status Chips (friendly plain-English)
  if (chipIngress && activeResult.ingress) {
    if (activeResult.ingress.canEnter) {
      chipIngress.className = 'strategy-chip clears';
      chipIngress.textContent = activeResult.ingress.direct
        ? '✓ Boot Opening: Clears easily'
        : `✓ Boot Opening: Clears tilted (~${Math.round(activeResult.ingress.rollAngle)}°)`;
    } else {
      chipIngress.className = 'strategy-chip colliding';
      chipIngress.textContent = '✕ Boot Opening: Too big to enter';
    }
  }

  if (chipStowed) {
    if (activeResult.status === 'comfortable' || activeResult.status === 'tight') {
      chipStowed.className = 'strategy-chip clears';
      chipStowed.textContent = `✓ Boot Space: Fits flat (+${Math.max(0, Math.round(activeResult.margin))} cm room)`;
    } else if (activeResult.status === 'angled') {
      chipStowed.className = 'strategy-chip angled';
      chipStowed.textContent = `✓ Boot Space: Fits tilted ~${Math.round(activeResult.angle)}°`;
    } else {
      chipStowed.className = 'strategy-chip colliding';
      chipStowed.textContent = (!seatsFolded && (parseFloat(cargoLengthInput.value) || 0) <= selectedCar.floor_length_seats_folded)
        ? '✕ Boot Space: Needs seats folded flat'
        : '✕ Boot Space: Exceeds boot capacity';
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
  radius: 410,
  theta: 0.78,
  phi: 1.25
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
  scene.background = new THREE.Color(0x0e1726);

  camera = new THREE.PerspectiveCamera(36, width / height, 1, 5000);
  // Zoomed out to comfortably frame the complete car & open boot on initial load
  camera.position.set(245, 160, 245);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = (Math.PI / 2) + 0.04;
    controls.minDistance = 80;
    controls.maxDistance = 800;
    controls.target.set(-160, 55, 0);
  } else {
    initFallbackControls(canvas);
  }

  // Friendly Showroom Studio Lighting
  const ambientLight = new THREE.AmbientLight(0x475569, 1.6);
  scene.add(ambientLight);

  // Key Sun (Rear-Right 3/4)
  const keySun = new THREE.DirectionalLight(0xfffaf0, 2.0);
  keySun.position.set(240, 360, 200);
  scene.add(keySun);

  // Front Key Light (Front-Left 3/4, beautifully illuminating the hood, grille, and headlights)
  const frontKey = new THREE.DirectionalLight(0xf8fafc, 2.0);
  frontKey.position.set(-450, 260, 220);
  scene.add(frontKey);

  // Front Fill Light (Front-Right 3/4, softening shadows across the front bumper)
  const frontFill = new THREE.DirectionalLight(0x94a3b8, 1.1);
  frontFill.position.set(-450, 180, -220);
  scene.add(frontFill);

  // Low Ground Glint / Rim Light for Wheels & Lower Splitter
  const rimLight = new THREE.DirectionalLight(0x64748b, 0.6);
  rimLight.position.set(-200, 20, 300);
  scene.add(rimLight);

  const rearHighlight = new THREE.DirectionalLight(0x94a3b8, 0.9);
  rearHighlight.position.set(260, 120, 0);
  scene.add(rearHighlight);

  // Studio Flank Key/Fill Lights (Illuminates passenger doors, character lines, and handles)
  flankFill = new THREE.DirectionalLight(0xf1f5f9, 1.4);
  flankFill.position.set(-160, 140, 480);
  scene.add(flankFill);

  flankFillOpposite = new THREE.DirectionalLight(0x94a3b8, 0.9);
  flankFillOpposite.position.set(-160, 140, -480);
  scene.add(flankFillOpposite);

  const bootInteriorLight = new THREE.PointLight(0xffedd5, 1.8, 300);
  bootInteriorLight.position.set(20, 95, 0);
  scene.add(bootInteriorLight);

  // Precision Showroom Turntable Plinth (Centered dynamically under the active vehicle)
  plinthGroup = new THREE.Group();
  const plinthRadius = 310;
  const plinthGeo = new THREE.CylinderGeometry(plinthRadius, plinthRadius, 2.2, 72);
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Deep slate showroom turntable plinth
    roughness: 0.92,
    metalness: 0.05
  });
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.y = -1.1;
  plinthGroup.add(plinthMesh);

  // Brushed aluminum outer bevel trim ring
  const rimGeo = new THREE.CylinderGeometry(plinthRadius + 1.5, plinthRadius + 2.0, 2.0, 72, 1, true);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.45,
    metalness: 0.85
  });
  const plinthRim = new THREE.Mesh(rimGeo, rimMat);
  plinthRim.position.y = -1.1;
  plinthGroup.add(plinthRim);

  // Subtle concentric inner turntable ring
  const ringGeo = new THREE.RingGeometry(plinthRadius - 18, plinthRadius - 16.5, 72);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x1e293b,
    side: THREE.DoubleSide
  });
  const plinthRing = new THREE.Mesh(ringGeo, ringMat);
  plinthRing.rotation.x = -Math.PI / 2;
  plinthRing.position.y = 0.05;
  plinthGroup.add(plinthRing);

  plinthGroup.position.set(-160, 0, 0);
  scene.add(plinthGroup);

  gridHelper = new THREE.GridHelper(800, 32, 0x1e293b, 0x0f172a);
  gridHelper.position.set(-160, -0.5, 0);
  scene.add(gridHelper);

  if (window.ResizeObserver && canvas.parentElement) {
    const ro = new ResizeObserver(() => {
      onWindowResize();
    });
    ro.observe(canvas.parentElement);
  }

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

  const targetX = -75;
  const targetY = 55;
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

  const carCenterX = selectedCar ? (70 - selectedCar.overall_length + 70) / 2 : -160;
  const targetCenter = new THREE.Vector3(carCenterX, 55, 0);

  if (view === 'side') {
    fallbackOrbit.theta = Math.PI / 2;
    fallbackOrbit.phi = 1.48;
    fallbackOrbit.radius = 680;
  } else if (view === 'rear') {
    fallbackOrbit.theta = 0;
    fallbackOrbit.phi = 1.48;
    fallbackOrbit.radius = 340;
  } else if (view === 'top') {
    fallbackOrbit.theta = 0;
    fallbackOrbit.phi = 0.05;
    fallbackOrbit.radius = 720;
  } else if (view === 'ingress') {
    fallbackOrbit.theta = 0;
    fallbackOrbit.phi = 1.48;
    fallbackOrbit.radius = 160;
  } else {
    fallbackOrbit.theta = 0.78;
    fallbackOrbit.phi = 1.25;
    fallbackOrbit.radius = 480;
  }

  if (controls) {
    if (view === 'side') {
      camera.position.set(carCenterX, 60, 680);
      targetCenter.set(carCenterX, 60, 0);
    } else if (view === 'rear') {
      camera.position.set(260, 85, 0);
      targetCenter.set(carCenterX + 80, 65, 0);
    } else if (view === 'top') {
      camera.position.set(carCenterX, 720, 0);
      targetCenter.set(carCenterX, 50, 0);
    } else if (view === 'ingress') {
      camera.position.set(150, 90, 0);
      targetCenter.set(10, 65, 0);
    } else {
      camera.position.set(carCenterX + 350, 190, 260);
      targetCenter.set(carCenterX, 55, 0);
    }
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
 * Creates authentic front bucket seats with ergonomic contouring, lateral bolsters,
 * elevated seat base pedestal, and adjustable headrest on chrome support posts.
 */
function createSeat3D(width = 44, riserHeight = 22) {
  const seatGroup = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x121b2b, roughness: 0.75 });
  const bolsterMat = new THREE.MeshStandardMaterial({ color: 0x0c1320, roughness: 0.85 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.12 });

  // 1. Lower Seat Mounting Pedestal & Slider Rails (raising seat from bare floor pan)
  const riserGeo = new THREE.BoxGeometry(38, riserHeight, width - 6);
  const riser = new THREE.Mesh(riserGeo, bolsterMat);
  riser.position.set(0, riserHeight / 2, 0);
  seatGroup.add(riser);

  // Twin Chrome Seat Slider Runner Rails
  [-1, 1].forEach(side => {
    const railGeo = new THREE.BoxGeometry(42, 2.5, 2.5);
    const rail = new THREE.Mesh(railGeo, chromeMat);
    rail.position.set(0, 1.25, side * ((width / 2) - 4));
    seatGroup.add(rail);
  });

  // 2. Sculpted Ergonomic Seat Cushion (thigh support + lateral thigh bolsters)
  const cushionThick = 9;
  const cushionY = riserHeight + (cushionThick / 2);
  const cushionLen = 42;
  const cushionGeo = new THREE.BoxGeometry(cushionLen, cushionThick, width - 4);
  const cushion = new THREE.Mesh(cushionGeo, seatMat);
  cushion.position.set(0, cushionY, 0);
  seatGroup.add(cushion);

  // Lateral Thigh Bolsters on Cushion
  [-1, 1].forEach(side => {
    const bolsterGeo = new THREE.BoxGeometry(cushionLen - 2, 5, 4.5);
    const bolster = new THREE.Mesh(bolsterGeo, bolsterMat);
    bolster.position.set(0, cushionY + 3.5, side * ((width / 2) - 3.5));
    seatGroup.add(bolster);
  });

  // 3. Ergonomic Sport Seat Back (tall 58 cm backrest seamlessly aligned with base)
  const backHeight = 58;
  const backThick = 9.0;
  const reclineAngle = -0.12; // Natural recline towards rear (+X)
  // Backrest base rear face is perfectly flush with the rear edge of cushion (+21)
  const backBaseX = (cushionLen / 2) - (backThick / 2);
  const backBaseY = riserHeight + cushionThick;

  const backX = backBaseX + (backHeight / 2) * Math.sin(-reclineAngle);
  const backY = backBaseY + (backHeight / 2) * Math.cos(-reclineAngle) - 1;

  const backGeo = new THREE.BoxGeometry(backThick, backHeight, width - 6);
  const back = new THREE.Mesh(backGeo, seatMat);
  back.position.set(backX, backY, 0);
  back.rotation.z = reclineAngle;
  addCadEdges(back, 0x38bdf8);
  seatGroup.add(back);

  // Lateral Torso / Kidney Bolsters on Backrest
  [-1, 1].forEach(side => {
    const torsoBolsterGeo = new THREE.BoxGeometry(backThick + 2, backHeight * 0.72, 4.5);
    const torsoBolster = new THREE.Mesh(torsoBolsterGeo, bolsterMat);
    torsoBolster.position.set(backX - 0.5, backY - 3, side * ((width / 2) - 4.5));
    torsoBolster.rotation.z = reclineAngle;
    seatGroup.add(torsoBolster);
  });

  // 4. Adjustable Ergonomic Headrest on Dual Chrome Steel Posts
  const backTopX = backBaseX + backHeight * Math.sin(-reclineAngle);
  const backTopY = backBaseY + backHeight * Math.cos(-reclineAngle);

  // Dual Chrome Steel Posts extending out of backrest top angled naturally
  [-5, 5].forEach(offsetZ => {
    const postGeo = new THREE.CylinderGeometry(0.7, 0.7, 5.5, 12);
    const post = new THREE.Mesh(postGeo, chromeMat);
    post.position.set(backTopX - 1.5, backTopY + 2.0, offsetZ);
    post.rotation.z = -0.04;
    seatGroup.add(post);
  });

  // Ergonomic Headrest Pillow
  const headrestGeo = new THREE.BoxGeometry(8.5, 13.0, 21);
  const headrest = new THREE.Mesh(headrestGeo, seatMat);
  headrest.position.set(backTopX - 2.5, backTopY + 6.0, 0);
  headrest.rotation.z = -0.02; // Upright / slight forward ergonomic angle
  seatGroup.add(headrest);

  // Soft Front Padded Cushion Face
  const headPadGeo = new THREE.BoxGeometry(2.0, 11.0, 18);
  const headPad = new THREE.Mesh(headPadGeo, bolsterMat);
  headPad.position.set(backTopX - 6.5, backTopY + 6.0, 0);
  headPad.rotation.z = -0.02;
  seatGroup.add(headPad);

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
function createCockpit3D(cabinWidth, cowlX, cowlY, beltY, frontSeatsX, cabinFloorY, totalCarWidth, seatCushionY) {
  const cockpitGroup = new THREE.Group();

  const dashMat = new THREE.MeshStandardMaterial({ color: 0x0c121d, roughness: 0.82 });
  const dashTrimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.35 });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0284c7,
    emissiveIntensity: 0.85,
    roughness: 0.1
  });
  const chromeMatLocal = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.12 });

  const driverZ = -((totalCarWidth / 4) - 6);

  // 1. AUTHENTIC DASHBOARD DECK & INSTRUMENT PANEL
  // Modern automotive dashboard depth from base of windshield (cowl) to driver fascia is ~30 cm.
  const ipDepth = 30;
  const dashFrontX = cowlX;
  const dashFaceX = cowlX + ipDepth; // Driver-facing dashboard edge / fascia
  const dashCenterX = cowlX + (ipDepth / 2);
  const ipHeight = 16; // Sleek 16 cm sculpted dashboard fascia
  const ipWidth = cabinWidth - 6;
  const ipCenterY = cowlY - (ipHeight / 2);

  // Main Dashboard Sculpted Body
  const ipGeo = new THREE.BoxGeometry(ipDepth, ipHeight, ipWidth);
  const ipMesh = new THREE.Mesh(ipGeo, dashMat);
  ipMesh.position.set(dashCenterX, ipCenterY, 0);
  addCadEdges(ipMesh, 0x38bdf8);
  cockpitGroup.add(ipMesh);

  // Forward Firewall / Slanted Toe-board (seals front engine bulkhead to floor)
  const firewallHeight = ipCenterY - (ipHeight / 2) - cabinFloorY;
  if (firewallHeight > 2) {
    const firewallGeo = new THREE.BoxGeometry(8, firewallHeight, ipWidth - 4);
    const firewall = new THREE.Mesh(firewallGeo, dashMat);
    firewall.position.set(cowlX + 4, cabinFloorY + (firewallHeight / 2), 0);
    cockpitGroup.add(firewall);
  }

  // Slim Defroster Vent Strip at windshield base
  const defrosterGeo = new THREE.BoxGeometry(4.0, 1.2, ipWidth - 8);
  const defroster = new THREE.Mesh(defrosterGeo, dashTrimMat);
  defroster.position.set(cowlX + 2.5, cowlY + 0.6, 0);
  cockpitGroup.add(defroster);

  // Air Vent Horizon Strip along dashboard fascia
  const ventStripGeo = new THREE.BoxGeometry(1.2, 2.5, ipWidth - 10);
  const ventStrip = new THREE.Mesh(ventStripGeo, dashTrimMat);
  ventStrip.position.set(dashFaceX + 0.6, ipCenterY + 1.0, 0);
  cockpitGroup.add(ventStrip);

  // 2. ERGONOMIC STEERING WHEEL & SHROUD
  // Steering wheel hub extends ~14 cm directly forward from dashboard fascia
  const wheelX = dashFaceX + 14;
  const wheelY = seatCushionY + 22; // Comfortable driving height clearing knees

  // Steering Column Shroud: sleek 14 cm enclosure connecting dashboard fascia to steering wheel hub
  const colOriginX = dashFaceX - 1;
  const colOriginY = ipCenterY - 3;
  const colSpanX = wheelX - colOriginX; // ~15 cm
  const colSpanY = wheelY - colOriginY;
  const colLen = Math.hypot(colSpanX, colSpanY);
  const colAngle = Math.atan2(colSpanY, colSpanX);

  const colGeo = new THREE.BoxGeometry(colLen, 6.5, 7.5);
  const colMesh = new THREE.Mesh(colGeo, dashTrimMat);
  colMesh.position.set(colOriginX + (colSpanX / 2), colOriginY + (colSpanY / 2), driverZ);
  colMesh.rotation.z = colAngle;
  addCadEdges(colMesh, 0x38bdf8);
  cockpitGroup.add(colMesh);

  // Dual Turn Signal & Wiper Stalks on steering column
  [-4.5, 4.5].forEach(sz => {
    const stalkGeo = new THREE.CylinderGeometry(0.5, 0.5, 6.5, 8);
    const stalk = new THREE.Mesh(stalkGeo, chromeMatLocal);
    stalk.rotation.x = Math.PI / 2;
    stalk.position.set(wheelX - 3.5, wheelY + 0.5, driverZ + sz);
    cockpitGroup.add(stalk);
  });

  // Sport 3-Spoke Steering Wheel
  const steerGroup = new THREE.Group();
  steerGroup.position.set(wheelX, wheelY, driverZ);
  steerGroup.rotation.y = Math.PI / 2;
  steerGroup.rotation.x = -0.32; // ~18° natural driver rake

  const rimGeo = new THREE.TorusGeometry(11.5, 1.35, 14, 32);
  const rim = new THREE.Mesh(rimGeo, dashMat);
  steerGroup.add(rim);

  const hubGeo = new THREE.CylinderGeometry(3.5, 3.5, 2.6, 16);
  const hub = new THREE.Mesh(hubGeo, dashTrimMat);
  hub.rotation.x = Math.PI / 2;
  steerGroup.add(hub);

  // Chrome Emblem on Hub Center
  const emblemGeo = new THREE.CylinderGeometry(1.8, 1.8, 2.8, 16);
  const emblem = new THREE.Mesh(emblemGeo, chromeMatLocal);
  emblem.rotation.x = Math.PI / 2;
  steerGroup.add(emblem);

  [-Math.PI / 6, Math.PI / 6, -Math.PI / 2].forEach(angle => {
    const spokeGeo = new THREE.BoxGeometry(2.0, 10.0, 1.4);
    const spoke = new THREE.Mesh(spokeGeo, dashTrimMat);
    spoke.position.set(Math.sin(angle) * 5.0, Math.cos(angle) * 5.0, 0);
    spoke.rotation.z = -angle;
    steerGroup.add(spoke);
  });
  cockpitGroup.add(steerGroup);

  // 3. INTEGRATED DRIVER'S INSTRUMENT CLUSTER BINNACLE (on top of dashboard ahead of driver)
  const binnacleLen = 14;
  const binnacleHeight = 8.5;
  const binnacleWidth = 20;
  const binnacleGeo = new THREE.BoxGeometry(binnacleLen, binnacleHeight, binnacleWidth);
  const binnacle = new THREE.Mesh(binnacleGeo, dashMat);
  binnacle.position.set(dashFaceX - (binnacleLen / 2), cowlY + (binnacleHeight / 2) - 1, driverZ);
  addCadEdges(binnacle, 0x38bdf8);
  cockpitGroup.add(binnacle);

  // Glowing Virtual Cockpit Digital Instrument Display
  const gaugeGeo = new THREE.PlaneGeometry(15, 6.5);
  const gauge = new THREE.Mesh(gaugeGeo, screenMat);
  gauge.position.set(dashFaceX + 0.2, cowlY + (binnacleHeight / 2) - 1, driverZ);
  gauge.rotation.y = Math.PI / 2;
  cockpitGroup.add(gauge);

  // 4. CENTER WATERFALL STACK & FLOATING INFOTAINMENT TOUCHSCREEN
  const stackWidth = 18;
  const stackGeo = new THREE.BoxGeometry(8, ipHeight + 6, stackWidth);
  const stack = new THREE.Mesh(stackGeo, dashTrimMat);
  stack.position.set(dashFaceX - 3, ipCenterY - 3, 0);
  cockpitGroup.add(stack);

  // Floating Widescreen Center Touchscreen (angled slightly towards UK driver)
  const centerScreenGeo = new THREE.BoxGeometry(2.2, 8.5, 19);
  const centerScreen = new THREE.Mesh(centerScreenGeo, screenMat);
  centerScreen.position.set(dashFaceX + 1.8, ipCenterY + 4.5, 0);
  centerScreen.rotation.y = -0.15;
  cockpitGroup.add(centerScreen);

  // 5. CONTINUOUS CENTER CONSOLE TUNNEL
  const tunnelFrontX = dashFaceX - 2;
  const tunnelRearX = frontSeatsX + 16;
  const tunnelLen = Math.abs(tunnelRearX - tunnelFrontX);
  const tunnelHeight = Math.max(14, seatCushionY - cabinFloorY - 2);
  const tunnelGeo = new THREE.BoxGeometry(tunnelLen, tunnelHeight, 16);
  const tunnel = new THREE.Mesh(tunnelGeo, dashTrimMat);
  tunnel.position.set((tunnelFrontX + tunnelRearX) / 2, cabinFloorY + (tunnelHeight / 2), 0);
  addCadEdges(tunnel, 0x38bdf8);
  cockpitGroup.add(tunnel);

  // Modern Electronic Drive Selector on Tunnel Deck
  const shifterGeo = new THREE.BoxGeometry(4.5, 4.0, 3.5);
  const shifter = new THREE.Mesh(shifterGeo, dashMat);
  shifter.position.set(frontSeatsX - 10, cabinFloorY + tunnelHeight + 2, 0);
  cockpitGroup.add(shifter);

  // Dual Cupholder Inserts on Tunnel Deck
  [-3.0, 3.0].forEach(cz => {
    const cupRim = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.5, 1.0, 16),
      chromeMatLocal
    );
    cupRim.position.set(frontSeatsX - 3, cabinFloorY + tunnelHeight + 0.5, cz);
    cockpitGroup.add(cupRim);
  });

  // Padded Center Armrest between front seats
  const armrestLen = 22;
  const armrestHeight = 6.5;
  const armrestGeo = new THREE.BoxGeometry(armrestLen, armrestHeight, 15);
  const armrest = new THREE.Mesh(armrestGeo, dashMat);
  armrest.position.set(frontSeatsX + 4, cabinFloorY + tunnelHeight + (armrestHeight / 2) + 0.5, 0);
  cockpitGroup.add(armrest);

  // 6. DRIVER FOOTWELL PEDALS (Accelerator & Brake in driver's footwell)
  [-3.2, 3.2].forEach((pz, idx) => {
    const pedalGeo = new THREE.BoxGeometry(1.2, idx === 0 ? 5.5 : 4.0, 3.0);
    const pedal = new THREE.Mesh(pedalGeo, chromeMatLocal);
    pedal.position.set(cowlX + 12, cabinFloorY + 4.5, driverZ + pz);
    pedal.rotation.z = -0.35;
    cockpitGroup.add(pedal);
  });

  return cockpitGroup;
}

/**
 * Creates an upright semi-cylindrical wheel arch tub for the interior cargo bay.
 * Arches smoothly over the rear wheel in the XY plane with flat bottom on the cargo floor.
 */
function createRoundedWheelArchTub(radius = 22, depth = 16, isGhost = false) {
  const tubShape = new THREE.Shape();
  // Semicircular arch sitting on floor at Y=0, curving upwards in +Y to peak at (0, radius)
  tubShape.moveTo(-radius, 0);
  tubShape.absarc(0, 0, radius, Math.PI, 0, true);
  tubShape.lineTo(radius, 0);
  tubShape.closePath();

  const tubGeo = new THREE.ExtrudeGeometry(tubShape, {
    depth: depth,
    bevelEnabled: true,
    bevelSize: 0.6,
    bevelThickness: 0.6,
    bevelSegments: 2
  });

  const tubMat = new THREE.MeshStandardMaterial({
    color: 0x141f30, // Dark anthracite carpeted boot lining
    roughness: 0.88,
    metalness: 0.08,
    transparent: isGhost,
    opacity: isGhost ? 0.70 : 1.0
  });

  const tubMesh = new THREE.Mesh(tubGeo, tubMat);
  // Subtle carpet trim contour (soft darker tone, no bright glow through exterior flank)
  addCadEdges(tubMesh, 0x1e3a5f, 32);
  return tubMesh;
}

/**
 * Helper to add precision CAD edge highlight lines to a mesh
 */
function addCadEdges(mesh, color = 0x3b82f6, thresholdAngle = 30) {
  if (!mesh || !mesh.geometry) return;
  const edges = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.18
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
  const apWidth = car.aperture_width;
  const apHeight = car.aperture_height;
  const bodyType = car.body_type;
  let currentFloorLen = seatsFolded ? car.floor_length_seats_folded : car.floor_length_seats_up;

  const isSUV = bodyType === 'suv';
  const isSaloon = bodyType === 'saloon';
  const isEstate = bodyType === 'estate';
  const isHatch = bodyType === 'hatchback';

  // 1:1 REAL-WORLD AUTOMOTIVE VERTICAL PROPORTIONS & RATIOS
  // Total vehicle height defines the absolute roof datum
  const groundY = 0;
  const roofTopY = car.overall_height;

  // Realistic Wheel & Tyre radius
  const wheelRadius = isSUV ? 34.5 : (isHatch ? 30.5 : 31.5);
  const wheelArchR = wheelRadius + (isSUV ? 5.0 : 4.0);
  const wheelY = wheelRadius;

  // Rocker panel sill height (ground clearance):
  // Clean athletic ground clearance ~15-18 cm that covers the lower axle hubs
  const rockerY = Math.max(14, Math.round(wheelRadius * (isSUV ? 0.52 : 0.48)));

  // Beltline (shoulder line / bottom of side glass):
  // Standard modern automotive golden ratio: beltline sits at ~60-63% of overall car height.
  // This provides substantial, athletic door metal (~70-80 cm) and sleek, aerodynamic greenhouse glass (~50-58 cm).
  const beltY = Math.round(roofTopY * (isSUV ? 0.63 : (isSaloon ? 0.60 : 0.61)));
  const noseTopY = beltY - (isSUV ? 7 : 11);
  const cowlY = beltY + 3;

  // Boot sill load lip (distance from ground to cargo floor):
  // For Saloons, the trunk deck/shelf sits at beltY (not roofTopY), so sillY is beltY minus trunk aperture height
  // For Hatchback/Estate/SUV: car overall height minus interior boot height minus roof structure (~6 cm)
  const sillY = isSaloon
    ? Math.round(beltY - car.aperture_height - 2)
    : Math.max(58, Math.round(roofTopY - car.roof_height - 6));
  const cabinFloorY = rockerY + 8;
  const seatCushionY = Math.round(beltY - 32); // Authentic ergonomic seat height (~56cm above ground)

  // FIXED VEHICLE DATUM: Rear bumper is at +X, front nose is at -X
  const rearBumperX = 70;
  const rearSillX = rearBumperX - (isEstate ? 18 : (isSaloon ? 8 : 22));
  const carFrontX = rearBumperX - totalLength;
  const carCenterX = (carFrontX + rearBumperX) / 2;

  // Keep Showroom Turntable Plinth, Ground Grid, and Side Lights dead-central under any car
  if (plinthGroup) plinthGroup.position.x = carCenterX;
  if (gridHelper) gridHelper.position.x = carCenterX;
  if (flankFill) flankFill.position.x = carCenterX;
  if (flankFillOpposite) flankFillOpposite.position.x = carCenterX;

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

  // PROPER PRODUCTION AUTOMOTIVE PROPORTIONS:
  // Distance from front axle to cowl (windshield base):
  // Transverse engines (Hatchback/Estate/SUV) have athletic, compact bonnets (~48-54cm from axle).
  // Longitudinal engines (Saloon) have longer executive bonnets (~66-70cm from axle).
  const cowlOffset = isSaloon ? 68 : (isSUV ? 52 : (isEstate ? 54 : 50));
  const cowlX = frontWheelX + cowlOffset;

  // Modern windscreen rake (~36°-40° from horizontal):
  // Rakes back ~34 to 38 cm horizontally from cowl to roof header
  const windshieldRun = isSaloon ? 38 : (isSUV ? 34 : (isEstate ? 36 : 34));
  const roofFrontX = cowlX + windshieldRun;

  // Ergonomic driving position: dashboard is 30cm deep, steering column extends 14cm,
  // and driver sits 30cm behind steering wheel (total ~74cm from windshield cowl):
  const frontSeatsX = Math.round(cowlX + 74);
  const frontSeatBackX = frontSeatsX + 21; // Backrest rear face aligns with cushion rear at +21

  // SPECIFICATION-ANCHORED REAR SEATS & CARGO BED ARCHITECTURE:
  // Tandem passenger spacing: rear seats sit ~84cm behind front seats, providing ~24-26cm of realistic knee room:
  const rearHingeX = frontSeatsX + 84;
  const cargoBedFrontX = seatsFolded ? frontSeatBackX : rearHingeX;
  currentFloorLen = Math.abs(rearSillX - cargoBedFrontX);

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
    roofRearX = rearWheelX + 14;
    deckFrontX = rearSillX;
  } else {
    // Hatchback: Sporty compact roof tapering to rear roof spoiler
    roofRearX = rearWheelX + 8;
    deckFrontX = rearSillX;
  }

  // B-pillar is aligned directly beside the driver's seat
  const bPillarX = frontSeatsX + 15;
  const cPillarX = isEstate ? (bPillarX + (roofRearX - bPillarX) * 0.58) : (isSaloon ? deckFrontX : roofRearX);
  const dPillarX = isEstate ? roofRearX : null;
  const rearDoorEnd = isEstate
    ? cPillarX
    : (isSaloon ? (rearWheelX - 4) : (isSUV ? (rearWheelX + 2) : (rearWheelX - 2)));

  // Materials: CAD Cutaway vs Showroom Paint
  const isGhost = xRayMode < 0.85;

  const bodyPaintMat = new THREE.MeshPhysicalMaterial({
    color: 0x1b3252, // Handsome Metallic Slate Navy
    metalness: 0.86,
    roughness: 0.24,
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
    color: 0xffffff,
    metalness: 0.78,
    roughness: 0.18
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8
  });

  const doorSeamMat = new THREE.MeshStandardMaterial({
    color: 0x070c16, // Deep obsidian shadow seam / panel gap
    roughness: 0.95,
    metalness: 0.15,
    transparent: isGhost,
    opacity: isGhost ? 0.70 : 1.0
  });

  const headlampMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xf8fafc,
    emissiveIntensity: 0.85,
    roughness: 0.12
  });

  const headlampDrlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.25,
    roughness: 0.06
  });

  const headlampLensMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.04,
    metalness: 0.05,
    transmission: 0.94,
    transparent: true,
    opacity: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    depthWrite: false
  });

  const headlampBezelMat = new THREE.MeshStandardMaterial({
    color: 0x080d1a, // Gloss obsidian / smoked housing
    roughness: 0.25,
    metalness: 0.75
  });

  const headlampProjectorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe0f2fe,
    emissiveIntensity: 1.15,
    metalness: 0.85,
    roughness: 0.08
  });

  const amberMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.75,
    roughness: 0.20
  });

  const grilleMeshMat = new THREE.MeshStandardMaterial({
    color: 0x111827, // Dark honeycomb mesh texture
    roughness: 0.85,
    metalness: 0.25
  });

  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Crisp white registration plate
    roughness: 0.45,
    metalness: 0.05
  });

  const euroBlueMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // EU / UK blue band
    roughness: 0.40
  });

  const taillampMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Vibrant automotive ruby red
    emissive: 0x991b1b, // Glowing ruby LED signature
    emissiveIntensity: 0.85,
    roughness: 0.20,
    metalness: 0.20,
    transparent: isGhost,
    opacity: isGhost ? 0.85 : 1.0
  });

  const taillampBezelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Gloss dark obsidian / smoked housing
    roughness: 0.25,
    metalness: 0.60,
    transparent: isGhost,
    opacity: isGhost ? 0.85 : 1.0
  });

  const taillampLensMat = new THREE.MeshPhysicalMaterial({
    color: 0x991b1b, // High-gloss crystalline ruby lens
    roughness: 0.08,
    metalness: 0.15,
    transmission: 0.55,
    transparent: true,
    opacity: isGhost ? 0.55 : 0.85,
    depthWrite: false
  });

  const taillampClearMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // Crisp silver-white crystalline reverse / indicator light
    roughness: 0.15,
    metalness: 0.85
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
  });

  // 2. SCULPTED AERODYNAMIC HOOD & NOSE CONE
  // Gentle, aerodynamic bonnet slope flowing into sculpted nose beak and front fenders
  const noseBreakX = carFrontX + 16;
  const mainHoodLen = Math.abs(cowlX - noseBreakX);
  const mainHoodSlope = Math.atan2((cowlY - 1) - noseTopY, mainHoodLen);

  const mainHoodWidthRear = cabinWidth - 4;
  const mainHoodWidthFront = totalCarWidth * 0.72;
  const mainHoodAvgWidth = (mainHoodWidthRear + mainHoodWidthFront) / 2;

  // Main Bonnet Surface
  const mainHoodGeo = new THREE.BoxGeometry(mainHoodLen, 2.0, mainHoodAvgWidth);
  const mainHood = new THREE.Mesh(mainHoodGeo, bodyPaintMat);
  mainHood.position.set((cowlX + noseBreakX) / 2, ((cowlY - 1) + noseTopY) / 2, 0);
  mainHood.rotation.z = mainHoodSlope;
  addCadEdges(mainHood, 0x38bdf8);
  car3DGroup.add(mainHood);

  // Athletic Center Power Bulge / Spine
  const spineGeo = new THREE.BoxGeometry(mainHoodLen - 6, 1.2, mainHoodAvgWidth * 0.38);
  const spine = new THREE.Mesh(spineGeo, bodyPaintMat);
  spine.position.set((cowlX + noseBreakX) / 2, (((cowlY - 1) + noseTopY) / 2) + 0.7, 0);
  spine.rotation.z = mainHoodSlope;
  car3DGroup.add(spine);

  // Dynamic Aerodynamic Swage Character Creases on Bonnet
  [-mainHoodAvgWidth * 0.28, mainHoodAvgWidth * 0.28].forEach(sz => {
    const creaseGeo = new THREE.BoxGeometry(mainHoodLen - 4, 0.8, 1.2);
    const crease = new THREE.Mesh(creaseGeo, bodyPaintMat);
    crease.position.set((cowlX + noseBreakX) / 2, (((cowlY - 1) + noseTopY) / 2) + 0.4, sz);
    crease.rotation.z = mainHoodSlope;
    car3DGroup.add(crease);
  });

  // Aerodynamic Nose Beak / Header Cap flowing down into Grille
  const noseDropLen = Math.abs(noseBreakX - (carFrontX + 3.8));
  const noseDropSlope = Math.atan2(noseTopY - (noseTopY - 4.5), noseDropLen);
  const noseDropGeo = new THREE.BoxGeometry(noseDropLen, 2.0, mainHoodWidthFront);
  const noseDrop = new THREE.Mesh(noseDropGeo, bodyPaintMat);
  noseDrop.position.set((noseBreakX + carFrontX + 3.8) / 2, (noseTopY + (noseTopY - 4.5)) / 2, 0);
  noseDrop.rotation.z = noseDropSlope;
  car3DGroup.add(noseDrop);

  // Front Wings / Fender Top Shelves & Brow Panels
  [-1, 1].forEach(side => {
    // 1. Main Fender Top Shelf (cowlX to noseBreakX along main bonnet slope)
    const wingWidth = Math.max(2, (totalCarWidth / 2) - (mainHoodAvgWidth / 2));
    const wingCenterZ = side * ((mainHoodAvgWidth / 2) + (wingWidth / 2));
    const wingTopGeo = new THREE.BoxGeometry(mainHoodLen, 2.0, wingWidth);
    const wingTop = new THREE.Mesh(wingTopGeo, bodyPaintMat);
    wingTop.position.set((cowlX + noseBreakX) / 2, ((cowlY - 1) + noseTopY) / 2, wingCenterZ);
    wingTop.rotation.z = mainHoodSlope;
    addCadEdges(wingTop, 0x38bdf8);
    car3DGroup.add(wingTop);

    // 2. Front Fender Brow above Headlights (noseBreakX to carFrontX + 3.8)
    const browWidth = Math.max(2, (totalCarWidth / 2) - (mainHoodWidthFront / 2));
    const browCenterZ = side * ((mainHoodWidthFront / 2) + (browWidth / 2));
    const browGeo = new THREE.BoxGeometry(noseDropLen, 2.0, browWidth);
    const brow = new THREE.Mesh(browGeo, bodyPaintMat);
    brow.position.set((noseBreakX + carFrontX + 3.8) / 2, (noseTopY + (noseTopY - 4.5)) / 2, browCenterZ);
    brow.rotation.z = noseDropSlope;
    car3DGroup.add(brow);
  });

  // Recessed Cowl Plenum Tray & Wiper Arms at base of windshield
  const cowlPlenumGeo = new THREE.BoxGeometry(7, 2.0, cabinWidth - 4);
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

  // 3. SCULPTED AERODYNAMIC FRONT BUMPER, BRAND GRILLES & JEWEL LED HEADLIGHTS
  const halfW = totalCarWidth / 2;
  const getSweep = (z) => Math.pow(Math.abs(z) / halfW, 1.85) * 13.5;

  const grilleTopY = noseTopY - 4.5;
  const grilleBottomY = noseTopY - 18.5;
  const grilleH = grilleTopY - grilleBottomY; // 14.0 cm
  const grilleY = (grilleTopY + grilleBottomY) / 2;
  const grilleW = Math.min(62, Math.round(totalCarWidth * 0.35));
  const grilleX = carFrontX + 1.2;

  const bumperBeamTopY = grilleBottomY;
  const bumperBeamBottomY = rockerY + 11.0;
  const bumperBeamH = bumperBeamTopY - bumperBeamBottomY;
  const bumperBeamY = (bumperBeamTopY + bumperBeamBottomY) / 2;

  const lowerIntakeBottomY = rockerY + 2.8;
  const lowerIntakeTopY = bumperBeamBottomY;
  const lowerIntakeH = lowerIntakeTopY - lowerIntakeBottomY;
  const lowerIntakeY = (lowerIntakeTopY + lowerIntakeBottomY) / 2;
  const lowerIntakeW = Math.min(58, grilleW - 4);

  // A. CONTINUOUS SCULPTED AERODYNAMIC FRONT BUMPER FASCIA (Smooth Parametric Mesh)
  // Continuous curved apron across the entire width of the car: eliminates all disjointed blocks and gaps
  const bCols = 20;
  const bRows = 3;
  const bPositions = [];
  const bIndices = [];

  const bYLevels = [
    rockerY + 1.2,
    rockerY + 7.5,
    bumperBeamY,
    grilleBottomY
  ];
  const bXOffsets = [3.2, 1.0, -0.4, 1.2];

  for (let r = 0; r <= bRows; r++) {
    const yVal = bYLevels[r];
    const xOff = bXOffsets[r];
    for (let c = 0; c <= bCols; c++) {
      const tz = c / bCols;
      const zVal = -halfW + tz * (2 * halfW);
      const sweep = getSweep(zVal);
      const xVal = carFrontX + xOff + sweep;
      bPositions.push(xVal, yVal, zVal);
    }
  }

  for (let r = 0; r < bRows; r++) {
    for (let c = 0; c < bCols; c++) {
      const i0 = r * (bCols + 1) + c;
      const i1 = i0 + 1;
      const i2 = (r + 1) * (bCols + 1) + c;
      const i3 = i2 + 1;
      bIndices.push(i0, i1, i2, i1, i3, i2);
    }
  }

  const bumperGeo = new THREE.BufferGeometry();
  bumperGeo.setAttribute('position', new THREE.Float32BufferAttribute(bPositions, 3));
  bumperGeo.setIndex(bIndices);
  bumperGeo.computeVertexNormals();

  const bumperShell = new THREE.Mesh(bumperGeo, bodyPaintMat);
  bumperShell.material.side = THREE.DoubleSide;
  car3DGroup.add(bumperShell);

  // B. FRONT FENDER CORNER CHEEKS (Above grilleBottomY, flanking the headlights out to flanks)
  const headlampW = Math.min(36.0, (halfW - 8.0) - (grilleW / 2 + 1.0));
  const headlampH = grilleH - 1.0;
  const headlampLen = 7.0;
  const headlampCenterZ = (grilleW / 2) + (headlampW / 2) + 1.0;

  [-1, 1].forEach(side => {
    const fCornerInnerZ = (grilleW / 2) + headlampW + 1.0;
    const fCornerW = Math.max(2.0, halfW - fCornerInnerZ);
    const fCornerCenterZ = side * (fCornerInnerZ + (fCornerW / 2));
    const fSweep = getSweep(fCornerCenterZ);
    const fCornerGeo = new THREE.BoxGeometry(9.0, grilleH, fCornerW + 1.0);
    const fCorner = new THREE.Mesh(fCornerGeo, bodyPaintMat);
    fCorner.position.set(carFrontX + 3.0 + fSweep, grilleY, fCornerCenterZ);
    fCorner.rotation.y = side * 0.22;
    car3DGroup.add(fCorner);
  });

  // C. LOWER RADIATOR AIR INTAKE DAM (Recessed Honeycomb Mesh)
  const lowerIntakeGeo = new THREE.BoxGeometry(2.5, lowerIntakeH, lowerIntakeW);
  const lowerIntake = new THREE.Mesh(lowerIntakeGeo, grilleMeshMat);
  lowerIntake.position.set(carFrontX + 2.2, lowerIntakeY, 0);
  car3DGroup.add(lowerIntake);

  // Twin Horizontal Aerodynamic Louver Slats
  [-lowerIntakeH * 0.22, lowerIntakeH * 0.22].forEach(offY => {
    const slatGeo = new THREE.BoxGeometry(2.0, 1.0, lowerIntakeW - 2);
    const slat = new THREE.Mesh(slatGeo, chromeMat);
    slat.position.set(carFrontX + 1.6, lowerIntakeY + offY, 0);
    car3DGroup.add(slat);
  });

  // D. INTEGRATED AERODYNAMIC SIDE AIR CURTAINS & LED FOG LIGHTS
  [-1, 1].forEach(side => {
    const curZ = side * ((lowerIntakeW / 2) + 8.0);
    const curSweep = getSweep(curZ);
    const scoopX = carFrontX + 1.0 + curSweep;

    // Sleek vertical air duct recess (gloss black)
    const scoopGeo = new THREE.BoxGeometry(2.0, lowerIntakeH * 0.72, 3.8);
    const scoop = new THREE.Mesh(scoopGeo, trimMat);
    scoop.position.set(scoopX + 0.6, lowerIntakeY, curZ);
    scoop.rotation.y = side * 0.18;
    car3DGroup.add(scoop);

    // Aerodynamic strake blade
    const strakeGeo = new THREE.BoxGeometry(2.2, lowerIntakeH * 0.62, 0.8);
    const strake = new THREE.Mesh(strakeGeo, pillarMat);
    strake.position.set(scoopX + 0.3, lowerIntakeY, curZ + (side * 1.3));
    strake.rotation.y = side * 0.18;
    car3DGroup.add(strake);

    // Jewel LED Fog / Cornering Light Accent (Flush in air curtain)
    const fogGeo = new THREE.BoxGeometry(1.6, 1.4, 2.8);
    const fog = new THREE.Mesh(fogGeo, headlampMat);
    fog.position.set(scoopX - 0.2, lowerIntakeY - (lowerIntakeH * 0.18), curZ - (side * 0.6));
    fog.rotation.y = side * 0.18;
    car3DGroup.add(fog);
  });

  // E. AUTHENTIC FRONT REGISTRATION PLATE (UK / Euro standard white plate on slim plinth)
  const platePlinthGeo = new THREE.BoxGeometry(0.8, 9.2, 44);
  const platePlinth = new THREE.Mesh(platePlinthGeo, trimMat);
  platePlinth.position.set(carFrontX - 0.2, bumperBeamY, 0);
  car3DGroup.add(platePlinth);

  const plateGeo = new THREE.BoxGeometry(0.5, 8.4, 42);
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.set(carFrontX - 0.6, bumperBeamY, 0);
  car3DGroup.add(plate);

  const euroBandGeo = new THREE.BoxGeometry(0.6, 8.4, 4.2);
  const euroBand = new THREE.Mesh(euroBandGeo, euroBlueMat);
  euroBand.position.set(carFrontX - 0.65, bumperBeamY, -18.7);
  car3DGroup.add(euroBand);

  // F. FULL-WIDTH LOWER FRONT CHIN SPLITTER / SPOILER
  const splitterGeo = new THREE.BoxGeometry(6.0, 1.6, totalCarWidth - 4);
  const splitter = new THREE.Mesh(splitterGeo, trimMat);
  splitter.position.set(carFrontX + 5.5, rockerY + 0.8, 0);
  car3DGroup.add(splitter);

  // SUV Front Satin Silver Skid Plate
  if (isSUV) {
    const skidGeo = new THREE.BoxGeometry(5.0, 3.6, lowerIntakeW - 10);
    const skid = new THREE.Mesh(skidGeo, chromeMat);
    skid.position.set(carFrontX + 1.8, rockerY + 2.5, 0);
    car3DGroup.add(skid);
  }

  // G. BRAND-SPECIFIC UPPER GRILLE ARCHITECTURE
  if (car.id.includes('ford')) {
    // Ford Focus (Mk4): Iconic trapezoidal hexagonal grille with chrome rim and Ford blue oval
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, grilleW), chromeMat);
    frameTop.position.set(grilleX - 0.5, grilleY + (grilleH / 2) - 0.6, 0);
    car3DGroup.add(frameTop);

    const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, grilleW * 0.82), chromeMat);
    frameBottom.position.set(grilleX - 0.5, grilleY - (grilleH / 2) + 0.6, 0);
    car3DGroup.add(frameBottom);

    [-1, 1].forEach(side => {
      const armGeo = new THREE.BoxGeometry(1.8, grilleH - 1.0, 1.4);
      const arm = new THREE.Mesh(armGeo, chromeMat);
      arm.position.set(grilleX - 0.5, grilleY, side * (grilleW * 0.45));
      arm.rotation.x = side * 0.12;
      car3DGroup.add(arm);
    });

    const meshGeo = new THREE.BoxGeometry(1.2, grilleH - 1.6, grilleW - 2.0);
    const mesh = new THREE.Mesh(meshGeo, grilleMeshMat);
    mesh.position.set(grilleX + 0.1, grilleY, 0);
    car3DGroup.add(mesh);

    // 3 Horizontal Chrome Blades
    [-grilleH * 0.22, 0, grilleH * 0.22].forEach(by => {
      const bGeo = new THREE.BoxGeometry(1.8, 0.9, grilleW - 3.5);
      const b = new THREE.Mesh(bGeo, chromeMat);
      b.position.set(grilleX - 0.3, grilleY + by, 0);
      car3DGroup.add(b);
    });

    // Centered Ford Blue Oval Badge
    const ovalBorder = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.8, 24), chromeMat);
    ovalBorder.rotation.z = Math.PI / 2;
    ovalBorder.scale.set(1, 1, 1.65);
    ovalBorder.position.set(grilleX - 0.8, grilleY + (grilleH * 0.12), 0);
    car3DGroup.add(ovalBorder);

    const ovalMat = new THREE.MeshStandardMaterial({
      color: 0x003399,
      emissive: 0x001f5c,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.5
    });
    const ovalCenter = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.9, 24), ovalMat);
    ovalCenter.rotation.z = Math.PI / 2;
    ovalCenter.scale.set(1, 1, 1.65);
    ovalCenter.position.set(grilleX - 0.85, grilleY + (grilleH * 0.12), 0);
    car3DGroup.add(ovalCenter);

    const fordBar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 4.0), chromeMat);
    fordBar.position.set(grilleX - 1.0, grilleY + (grilleH * 0.12), 0);
    car3DGroup.add(fordBar);

  } else if (car.id.includes('tesla')) {
    // Tesla Model Y: Clean, aerodynamic grille-less nose with sculpted aero crease
    const aeroCapGeo = new THREE.BoxGeometry(2.0, grilleH, grilleW);
    const aeroCap = new THREE.Mesh(aeroCapGeo, bodyPaintMat);
    aeroCap.position.set(grilleX, grilleY, 0);
    car3DGroup.add(aeroCap);

    // Chrome Tesla 'T' Emblem
    const tBadgeGeo = new THREE.BoxGeometry(0.6, 3.0, 3.2);
    const tBadge = new THREE.Mesh(tBadgeGeo, chromeMat);
    tBadge.position.set(grilleX - 0.8, grilleY + 1.0, 0);
    car3DGroup.add(tBadge);

  } else if (car.id.includes('bmw')) {
    // BMW Twin Kidney Grille Bezels with Chrome Rim & Vertical Air Slats
    [-1, 1].forEach(side => {
      const kCenterZ = side * 8.6;
      const kW = 14.0;
      // Chrome surround frame
      const kTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, kW), chromeMat);
      kTop.position.set(grilleX - 0.5, grilleY + (grilleH / 2) - 0.5, kCenterZ);
      car3DGroup.add(kTop);

      const kBottom = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, kW), chromeMat);
      kBottom.position.set(grilleX - 0.5, grilleY - (grilleH / 2) + 0.5, kCenterZ);
      car3DGroup.add(kBottom);

      [-1, 1].forEach(kSide => {
        const kSideBezel = new THREE.Mesh(new THREE.BoxGeometry(1.8, grilleH, 1.0), chromeMat);
        kSideBezel.position.set(grilleX - 0.5, grilleY, kCenterZ + kSide * (kW / 2 - 0.5));
        car3DGroup.add(kSideBezel);
      });

      // Dark background mesh
      const slatMeshGeo = new THREE.BoxGeometry(1.4, grilleH - 1.6, kW - 1.6);
      const slatMesh = new THREE.Mesh(slatMeshGeo, trimMat);
      slatMesh.position.set(grilleX + 0.1, grilleY, kCenterZ);
      car3DGroup.add(slatMesh);

      // Vertical kidney slats
      [-4.0, -1.3, 1.3, 4.0].forEach(sz => {
        const vSlat = new THREE.Mesh(new THREE.BoxGeometry(1.8, grilleH - 2.0, 0.8), chromeMat);
        vSlat.position.set(grilleX - 0.4, grilleY, kCenterZ + sz);
        car3DGroup.add(vSlat);
      });
    });

    // Centered BMW Roundel Badge above kidneys on nose cap
    const bBadge = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.8, 24), chromeMat);
    bBadge.rotation.z = Math.PI / 2;
    bBadge.position.set(grilleX - 0.8, grilleY + (grilleH / 2) + 1.4, 0);
    car3DGroup.add(bBadge);

  } else if (car.id.includes('audi')) {
    // Audi Singleframe Grille with Satin Chrome Surround & Four Rings
    const singleframeGeo = new THREE.BoxGeometry(1.8, grilleH + 2, grilleW - 6);
    const singleframe = new THREE.Mesh(singleframeGeo, chromeMat);
    singleframe.position.set(grilleX - 0.2, grilleY - 1.0, 0);
    car3DGroup.add(singleframe);

    const singleMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, grilleH + 0.8, grilleW - 8), grilleMeshMat);
    singleMesh.position.set(grilleX + 0.1, grilleY - 1.0, 0);
    car3DGroup.add(singleMesh);

    // Audi Four Interlocking Rings
    [-3.0, -1.0, 1.0, 3.0].forEach(rx => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.25, 8, 16), chromeMat);
      ring.position.set(grilleX - 0.8, grilleY + 1.8, rx);
      ring.rotation.y = Math.PI / 2;
      car3DGroup.add(ring);
    });

  } else if (car.id.includes('skoda') || car.id.includes('octavia')) {
    // Škoda Octavia: Chrome-rimmed butterfly grille with vertical black slats
    const skodaFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, grilleH, grilleW), chromeMat);
    skodaFrame.position.set(grilleX - 0.2, grilleY, 0);
    car3DGroup.add(skodaFrame);

    const skodaMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, grilleH - 1.6, grilleW - 2), grilleMeshMat);
    skodaMesh.position.set(grilleX + 0.1, grilleY, 0);
    car3DGroup.add(skodaMesh);

    // Chrome Škoda Winged Arrow Badge
    const skBadge = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.8, 24), chromeMat);
    skBadge.rotation.z = Math.PI / 2;
    skBadge.position.set(grilleX - 0.8, grilleY + (grilleH / 2) + 1.2, 0);
    car3DGroup.add(skBadge);

  } else if (car.id.includes('nissan') || car.id.includes('qashqai')) {
    // Nissan Qashqai: Bold Chrome V-Motion Grille Surround
    const nissanMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, grilleH, grilleW), grilleMeshMat);
    nissanMesh.position.set(grilleX + 0.1, grilleY, 0);
    car3DGroup.add(nissanMesh);

    [-1, 1].forEach(side => {
      const vArm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, grilleW * 0.35), chromeMat);
      vArm.position.set(grilleX - 0.4, grilleY - (side === 1 ? 1 : 1), side * (grilleW * 0.22));
      vArm.rotation.x = side * 0.45;
      car3DGroup.add(vArm);
    });

    const nBadge = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.8, 24), chromeMat);
    nBadge.rotation.z = Math.PI / 2;
    nBadge.position.set(grilleX - 0.8, grilleY, 0);
    car3DGroup.add(nBadge);

  } else if (car.id.includes('vauxhall') || car.id.includes('corsa')) {
    // Vauxhall Corsa: 'Vauxhall Vizor' Full-Width Gloss Black Panel
    const vizor = new THREE.Mesh(new THREE.BoxGeometry(1.8, grilleH, grilleW), pillarMat);
    vizor.position.set(grilleX, grilleY, 0);
    car3DGroup.add(vizor);

    const vBadge = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.8, 24), chromeMat);
    vBadge.rotation.z = Math.PI / 2;
    vBadge.position.set(grilleX - 0.8, grilleY, 0);
    car3DGroup.add(vBadge);

  } else {
    // VW Golf Mk8 & Standard Hatchbacks: Sleek horizontal grille strip with illuminated LED lightbar
    const grilleStripGeo = new THREE.BoxGeometry(1.8, 3.4, grilleW);
    const grilleStrip = new THREE.Mesh(grilleStripGeo, pillarMat);
    grilleStrip.position.set(grilleX, grilleY, 0);
    car3DGroup.add(grilleStrip);

    const ledStripGeo = new THREE.BoxGeometry(2.0, 0.9, grilleW - 2);
    const ledStrip = new THREE.Mesh(ledStripGeo, headlampDrlMat);
    ledStrip.position.set(grilleX - 0.4, grilleY + 0.9, 0);
    car3DGroup.add(ledStrip);

    // Iconic VW Centered Front Badge Roundel
    const badgeGeo = new THREE.CylinderGeometry(2.8, 2.8, 0.8, 24);
    const badge = new THREE.Mesh(badgeGeo, chromeMat);
    badge.rotation.z = Math.PI / 2;
    badge.position.set(grilleX - 0.8, grilleY, 0);
    car3DGroup.add(badge);
  }

  // H. HIGH-TECH JEWEL LED HEADLIGHT CLUSTERS
  [-1, 1].forEach(side => {
    const headGroup = new THREE.Group();
    const headlampSweep = getSweep(headlampCenterZ);
    const headlampX = carFrontX + 2.0 + headlampSweep;
    const sweepInner = getSweep(headlampCenterZ - headlampW / 2);
    const sweepOuter = getSweep(headlampCenterZ + headlampW / 2);
    const headAngle = Math.atan2(sweepOuter - sweepInner, headlampW);

    headGroup.position.set(headlampX, grilleY, side * headlampCenterZ);
    headGroup.rotation.y = side * headAngle; // Swept back naturally matching bumper parabola

    // Dark Smoked Rear Housing Cavity Wall (thin backplate so cavity is hollow!)
    const backWallGeo = new THREE.BoxGeometry(0.6, headlampH - 0.4, headlampW - 0.6);
    const backWall = new THREE.Mesh(backWallGeo, headlampBezelMat);
    backWall.position.set((headlampLen / 2) - 0.4, 0, 0);
    headGroup.add(backWall);

    // Glowing LED Daytime Running Light (DRL) Signature Guide
    // Continuous top brow strip
    const drlTopGeo = new THREE.BoxGeometry(0.8, 0.7, headlampW - 1.2);
    const drlTop = new THREE.Mesh(drlTopGeo, headlampDrlMat);
    drlTop.position.set(-2.7, (headlampH / 2) - 0.7, 0);
    headGroup.add(drlTop);

    // Outer vertical return blade (forming signature L-shape hockey stick)
    const drlSideGeo = new THREE.BoxGeometry(0.8, headlampH * 0.55, 0.7);
    const drlSide = new THREE.Mesh(drlSideGeo, headlampDrlMat);
    drlSide.position.set(-2.7, -0.6, side * ((headlampW / 2) - 1.0));
    headGroup.add(drlSide);

    // Dual Jewelled LED Projector Eyes
    // Outer Low Beam Projector
    const projOuterRing = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.8, 24), chromeMat);
    projOuterRing.rotation.z = Math.PI / 2;
    projOuterRing.position.set(-2.3, -0.5, side * (headlampW * 0.22));
    headGroup.add(projOuterRing);

    const projOuter = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 1.2, 24), headlampProjectorMat);
    projOuter.rotation.z = Math.PI / 2;
    projOuter.position.set(-2.6, -0.5, side * (headlampW * 0.22));
    headGroup.add(projOuter);

    // Inner High Beam Projector
    const projInnerRing = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.8, 20), chromeMat);
    projInnerRing.rotation.z = Math.PI / 2;
    projInnerRing.position.set(-2.3, -0.5, -side * (headlampW * 0.22));
    headGroup.add(projInnerRing);

    const projInner = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.2, 20), headlampProjectorMat);
    projInner.rotation.z = Math.PI / 2;
    projInner.position.set(-2.6, -0.5, -side * (headlampW * 0.22));
    headGroup.add(projInner);

    // Amber Crystal Turn Indicator Accent
    const amberGeo = new THREE.BoxGeometry(1.4, 1.6, 2.4);
    const amber = new THREE.Mesh(amberGeo, amberMat);
    amber.position.set(-2.5, -1.8, side * ((headlampW / 2) - 1.5));
    headGroup.add(amber);

    // High-Gloss Transparent Polycarbonate Outer Lens
    const lensGeo = new THREE.BoxGeometry(0.5, headlampH, headlampW);
    const lens = new THREE.Mesh(lensGeo, headlampLensMat);
    lens.position.set(-(headlampLen / 2) + 0.3, 0, 0);
    headGroup.add(lens);

    car3DGroup.add(headGroup);
  });

  // 5. AERODYNAMIC RAKED WINDSHIELD & A-PILLARS
  const windSpanX = Math.abs(roofFrontX - cowlX);
  const windSpanY = Math.abs(roofTopY - cowlY);
  const windLen = Math.hypot(windSpanX, windSpanY);
  const windAngle = Math.atan2(windSpanY, windSpanX);

  // Main Raked Windscreen Glass (Transparent Tinted Automotive Glass)
  const windGeo = new THREE.BoxGeometry(windLen, 1.8, cabinWidth - 6);
  const windshield = new THREE.Mesh(windGeo, glassMat);
  windshield.position.set((cowlX + roofFrontX) / 2, (cowlY + roofTopY) / 2, 0);
  windshield.rotation.z = windAngle;
  addCadEdges(windshield, 0x38bdf8);
  car3DGroup.add(windshield);

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
  // Beltline at ~61-63% height provides substantial athletic door metal (70-80cm)
  // Rocker line at ~15-18cm ensures full underside closure and authentic wheel wells
  const flankShape = new THREE.Shape();
  // Start at lower front chin with aerodynamic curve swept back to wheel arch
  flankShape.moveTo(carFrontX + 16, rockerY + 1.2);
  flankShape.quadraticCurveTo(carFrontX + 13.5, rockerY + 6, carFrontX + 13.5, rockerY + 14);
  // Curve up along front fender corner seam
  flankShape.quadraticCurveTo(carFrontX + 13, noseTopY - 5, carFrontX + 15, noseTopY);
  // Flow aerodynamically from nose cone into bonnet and cowl
  flankShape.quadraticCurveTo(carFrontX + 15 + (Math.abs(cowlX - (carFrontX + 15)) * 0.45), noseTopY + (beltY - noseTopY) * 0.35, cowlX, beltY + 2);
  flankShape.lineTo(cowlX + 4, beltY);

  if (isSaloon) {
    flankShape.lineTo(deckFrontX, beltY);
    flankShape.lineTo(rearSillX, beltY);
    flankShape.quadraticCurveTo(rearBumperX - 2, beltY - 2, rearBumperX, sillY + 4);
  } else if (isEstate) {
    flankShape.lineTo(rearSillX + 4, beltY);
    flankShape.quadraticCurveTo(rearBumperX - 2, beltY - 1, rearBumperX, sillY + 4);
  } else if (isSUV) {
    flankShape.lineTo(rearSillX + 2, beltY + 2);
    flankShape.quadraticCurveTo(rearBumperX - 2, beltY, rearBumperX, sillY + 4);
  } else {
    // Hatchback: graceful curve over rear quarter into rounded rear bumper
    flankShape.lineTo(rearSillX + 4, beltY);
    flankShape.quadraticCurveTo(rearBumperX - 2, beltY - 1, rearBumperX, sillY + 4);
  }
  // Rounded lower rear valance
  flankShape.quadraticCurveTo(rearBumperX + 0.5, rockerY + 4, rearBumperX - 8, rockerY + 1.5);

  // Underside with circular Wheel Arch Cutouts
  flankShape.lineTo(rearWheelX + wheelArchR, rockerY);
  flankShape.lineTo(rearWheelX + wheelArchR, wheelY);
  flankShape.absarc(rearWheelX, wheelY, wheelArchR, 0, Math.PI, false);
  flankShape.lineTo(rearWheelX - wheelArchR, rockerY);

  // Rocker sill between front & rear wheels
  flankShape.lineTo(frontWheelX + wheelArchR, rockerY);
  flankShape.lineTo(frontWheelX + wheelArchR, wheelY);
  flankShape.absarc(frontWheelX, wheelY, wheelArchR, 0, Math.PI, false);
  flankShape.lineTo(frontWheelX - wheelArchR, rockerY);

  // Smooth front lower chin transition
  flankShape.quadraticCurveTo(carFrontX + 18, rockerY, carFrontX + 16, rockerY + 1.2);

  const flankExtrude = {
    depth: 4.5,
    bevelEnabled: true,
    bevelSize: 1.4,
    bevelThickness: 1.2,
    bevelSegments: 4
  };
  const flankGeo = new THREE.ExtrudeGeometry(flankShape, flankExtrude);

  const leftFlank = new THREE.Mesh(flankGeo, bodyPaintMat);
  leftFlank.position.z = (totalCarWidth / 2) - 4.5;
  addCadEdges(leftFlank, 0x38bdf8, 48);
  car3DGroup.add(leftFlank);

  const rightFlank = new THREE.Mesh(flankGeo, bodyPaintMat);
  rightFlank.position.z = -(totalCarWidth / 2);
  addCadEdges(rightFlank, 0x38bdf8, 48);
  car3DGroup.add(rightFlank);

  // Sculpted 3D Wheel Arch Eyebrow Blister Flares (adds authentic muscular fender curvature)
  [-1, 1].forEach(side => {
    const archZ = side * ((totalCarWidth / 2) - 1.8);
    // Front wheel arch flare
    const fFlareGeo = new THREE.TorusGeometry(wheelArchR + 0.6, 2.0, 8, 28, Math.PI);
    const fFlare = new THREE.Mesh(fFlareGeo, isSUV ? claddingMat : bodyPaintMat);
    fFlare.rotation.y = side > 0 ? 0 : Math.PI;
    fFlare.position.set(frontWheelX, wheelY, archZ);
    addCadEdges(fFlare, 0x38bdf8);
    car3DGroup.add(fFlare);

    // Rear wheel arch flare
    const rFlareGeo = new THREE.TorusGeometry(wheelArchR + 0.6, 2.2, 8, 28, Math.PI);
    const rFlare = new THREE.Mesh(rFlareGeo, isSUV ? claddingMat : bodyPaintMat);
    rFlare.rotation.y = side > 0 ? 0 : Math.PI;
    rFlare.position.set(rearWheelX, wheelY, archZ);
    addCadEdges(rFlare, 0x38bdf8);
    car3DGroup.add(rFlare);
  });

  // Continuous Beltline Shoulders & Rear Haunches (Connecting side glass line to outer flanks)
  [-1, 1].forEach(side => {
    // 1. Door Beltline Shoulder (from cowlX to rearWheelX / deckFrontX)
    const shoulderEnd = isSaloon ? deckFrontX : rearWheelX;
    const doorShoulderLen = Math.abs(shoulderEnd - cowlX);
    const shoulderWidth = Math.max(2, (totalCarWidth / 2) - (cabinWidth / 2 - 2));
    const shoulderCenterZ = side * ((cabinWidth / 2 - 2) + (shoulderWidth / 2));
    const doorShoulderGeo = new THREE.BoxGeometry(doorShoulderLen, 2.2, shoulderWidth);
    const doorShoulder = new THREE.Mesh(doorShoulderGeo, bodyPaintMat);
    doorShoulder.position.set((cowlX + shoulderEnd) / 2, beltY - 1.1, shoulderCenterZ);
    addCadEdges(doorShoulder, 0x38bdf8);
    car3DGroup.add(doorShoulder);

    // 2. Rear Quarter Haunch Shoulder (from rearWheelX to rearSillX, Hatch/Estate/SUV only)
    if (!isSaloon) {
      const haunchLen = Math.abs(rearSillX - rearWheelX);
      const haunchGeo = new THREE.BoxGeometry(haunchLen, 2.2, shoulderWidth);
      const haunch = new THREE.Mesh(haunchGeo, bodyPaintMat);
      haunch.position.set((rearWheelX + rearSillX) / 2, beltY - 1.1, shoulderCenterZ);
      addCadEdges(haunch, 0x38bdf8);
      car3DGroup.add(haunch);
    }
  });

  // Sculpted Rocker Panel Sill between wheels (flush with flank)
  [-wheelZOffset, wheelZOffset - 3].forEach(zPos => {
    const rockerLen = Math.abs((rearWheelX - wheelArchR) - (frontWheelX + wheelArchR)) + 2;
    const rockerGeo = new THREE.BoxGeometry(rockerLen, isSUV ? 6.5 : 4.5, 3.0);
    const rocker = new THREE.Mesh(rockerGeo, isSUV ? claddingMat : bodyPaintMat);
    rocker.position.set((frontWheelX + rearWheelX) / 2, rockerY + 2.2, zPos + 1.5);
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
    const bHeight = roofTopY - beltY - 3;
    const winHeight = roofTopY - beltY - 5;
    const bPillarGeo = new THREE.BoxGeometry(5.5, bHeight, 3.2);
    const bPillar = new THREE.Mesh(bPillarGeo, pillarMat);
    bPillar.position.set(bPillarX, beltY + (bHeight / 2), zPos + 1.5);
    car3DGroup.add(bPillar);

    // Front Door Window (Trapezoidal profile precisely raked along A-pillar)
    const fWinShape = new THREE.Shape();
    fWinShape.moveTo(cowlX + 4.0, beltY + 1.0);
    fWinShape.lineTo(bPillarX - 2.5, beltY + 1.0);
    fWinShape.lineTo(bPillarX - 2.5, roofTopY - 3.5);
    fWinShape.lineTo(roofFrontX + 2.5, roofTopY - 3.5);
    fWinShape.closePath();

    const fWinGeo = new THREE.ExtrudeGeometry(fWinShape, { depth: 1.2, bevelEnabled: false });
    const fWin = new THREE.Mesh(fWinGeo, glassMat);
    fWin.position.set(0, 0, zPos + 0.9);
    car3DGroup.add(fWin);

    if (isEstate) {
      // Estate: C-Pillar, D-Pillar, Rear Door Window, Panoramic Cargo Window, AND Solid D-Pillar Rear Corner!
      const cPillarGeo = new THREE.BoxGeometry(6.0, bHeight, 3.2);
      const cPillar = new THREE.Mesh(cPillarGeo, pillarMat);
      cPillar.position.set(cPillarX, beltY + (bHeight / 2), zPos + 1.5);
      car3DGroup.add(cPillar);

      const rWinWidth = Math.abs(cPillarX - bPillarX) - 5;
      const rWinGeo = new THREE.BoxGeometry(rWinWidth, winHeight, 1.2);
      const rWin = new THREE.Mesh(rWinGeo, glassMat);
      rWin.position.set((bPillarX + cPillarX) / 2, beltY + (winHeight / 2) + 0.5, zPos + 1.5);
      car3DGroup.add(rWin);

      // Panoramic Rear Cargo Quarter Window
      const cargoWinWidth = Math.abs(roofRearX - 4 - cPillarX) - 4;
      const cargoWinGeo = new THREE.BoxGeometry(cargoWinWidth, winHeight - 2, 1.2);
      const cargoWin = new THREE.Mesh(cargoWinGeo, glassMat);
      cargoWin.position.set((cPillarX + roofRearX - 4) / 2, beltY + (winHeight / 2), zPos + 1.5);
      car3DGroup.add(cargoWin);

      // Solid Rear Corner / D-Pillar Quarter Panel framing the tailgate
      const estateQShape = new THREE.Shape();
      estateQShape.moveTo(roofRearX - 4, beltY);
      estateQShape.lineTo(rearSillX, beltY);
      estateQShape.lineTo(roofRearX, roofTopY - 2.0);
      estateQShape.lineTo(roofRearX - 4, roofTopY - 2.0);
      estateQShape.closePath();

      const estateQGeo = new THREE.ExtrudeGeometry(estateQShape, {
        depth: 3.5,
        bevelEnabled: true,
        bevelSize: 0.4,
        bevelThickness: 0.4,
        bevelSegments: 1
      });
      const estateQMesh = new THREE.Mesh(estateQGeo, bodyPaintMat);
      estateQMesh.position.set(0, 0, zPos - 0.25);
      addCadEdges(estateQMesh, 0x38bdf8);
      car3DGroup.add(estateQMesh);

    } else if (isSaloon) {
      // Saloon: Rear Door Window, Quarter Glass, and Fastback C-Pillar flowing down to trunk deck
      const rWinWidth = Math.abs(rearWheelX - 4 - bPillarX) - 4;
      const rWinGeo = new THREE.BoxGeometry(rWinWidth, winHeight, 1.2);
      const rWin = new THREE.Mesh(rWinGeo, glassMat);
      rWin.position.set((bPillarX + rearWheelX - 4) / 2, beltY + (winHeight / 2) + 0.5, zPos + 1.5);
      car3DGroup.add(rWin);

      // Rear Quarter Window (Hofmeister Kink)
      const qWinWidth = Math.abs(deckFrontX - 3 - (rearWheelX - 4));
      const qWinGeo = new THREE.BoxGeometry(qWinWidth, winHeight - 4, 1.2);
      const qWin = new THREE.Mesh(qWinGeo, glassMat);
      qWin.position.set((rearWheelX - 4 + deckFrontX - 3) / 2, beltY + (winHeight / 2) - 1, zPos + 1.5);
      car3DGroup.add(qWin);

      // C-Pillar: Flows gracefully from trunk deck base up to swept roofline
      const cSpanX = Math.abs(deckFrontX - roofRearX);
      const cSpanY = roofTopY - beltY;
      const cLen = Math.hypot(cSpanX, cSpanY);
      const cAngle = Math.atan2(cSpanY, cSpanX);
      const cPillarGeo = new THREE.BoxGeometry(cLen, 5.0, 3.2);
      const cPillar = new THREE.Mesh(cPillarGeo, bodyPaintMat);
      cPillar.position.set((roofRearX + deckFrontX) / 2, (beltY + roofTopY) / 2, zPos + 1.5);
      cPillar.rotation.z = -cAngle;
      addCadEdges(cPillar, 0x38bdf8);
      car3DGroup.add(cPillar);

    } else if (isSUV) {
      // SUV: Rear Passenger Door Window, Quarter Window, and Solid D-Pillar Rear Corner
      const rWinWidth = Math.abs(rearDoorEnd - bPillarX) - 4;
      const rWinGeo = new THREE.BoxGeometry(rWinWidth, winHeight, 1.2);
      const rWin = new THREE.Mesh(rWinGeo, glassMat);
      rWin.position.set((bPillarX + rearDoorEnd) / 2, beltY + (winHeight / 2) + 0.5, zPos + 1.5);
      car3DGroup.add(rWin);

      // SUV Rear Quarter Window
      const qWinWidth = Math.abs(roofRearX - 4 - rearDoorEnd);
      const qWinGeo = new THREE.BoxGeometry(qWinWidth, winHeight - 3, 1.2);
      const qWin = new THREE.Mesh(qWinGeo, glassMat);
      qWin.position.set((rearDoorEnd + roofRearX - 4) / 2, beltY + (winHeight / 2) - 0.5, zPos + 1.5);
      car3DGroup.add(qWin);

      // Solid SUV Rear Corner / D-Pillar Panel framing the tailgate
      const suvQShape = new THREE.Shape();
      suvQShape.moveTo(roofRearX - 4, beltY);
      suvQShape.lineTo(rearSillX, beltY);
      suvQShape.lineTo(roofRearX, roofTopY - 2.0);
      suvQShape.lineTo(roofRearX - 4, roofTopY - 2.0);
      suvQShape.closePath();

      const suvQGeo = new THREE.ExtrudeGeometry(suvQShape, {
        depth: 3.5,
        bevelEnabled: true,
        bevelSize: 0.4,
        bevelThickness: 0.4,
        bevelSegments: 1
      });
      const suvQMesh = new THREE.Mesh(suvQGeo, bodyPaintMat);
      suvQMesh.position.set(0, 0, zPos - 0.25);
      addCadEdges(suvQMesh, 0x38bdf8);
      car3DGroup.add(suvQMesh);

    } else {
      // Hatchback (VW Golf Mk8, Vauxhall Corsa F):
      // Rear Passenger Door Window
      const rWinWidth = Math.abs(rearDoorEnd - bPillarX) - 4;
      const rWinGeo = new THREE.BoxGeometry(rWinWidth, winHeight, 1.2);
      const rWin = new THREE.Mesh(rWinGeo, glassMat);
      rWin.position.set((bPillarX + rearDoorEnd) / 2, beltY + (winHeight / 2) + 0.5, zPos + 1.5);
      car3DGroup.add(rWin);

      // Signature Solid Hatchback Rear Quarter Panel / Broad Sculpted C-Pillar
      const hatchQShape = new THREE.Shape();
      hatchQShape.moveTo(rearDoorEnd - 1, beltY);
      hatchQShape.quadraticCurveTo(rearSillX - 6, beltY + 1, rearSillX + 2, beltY);
      hatchQShape.quadraticCurveTo(rearSillX - 2, (beltY + roofTopY) / 2, roofRearX, roofTopY - 2.0);
      hatchQShape.lineTo(rearDoorEnd - 1, roofTopY - 2.0);
      hatchQShape.closePath();

      const hatchQGeo = new THREE.ExtrudeGeometry(hatchQShape, {
        depth: 3.5,
        bevelEnabled: true,
        bevelSize: 0.8,
        bevelThickness: 0.8,
        bevelSegments: 3
      });
      const hatchQMesh = new THREE.Mesh(hatchQGeo, bodyPaintMat);
      hatchQMesh.position.set(0, 0, zPos - 0.25);
      addCadEdges(hatchQMesh, 0x38bdf8);
      car3DGroup.add(hatchQMesh);
    }
  });

  // 8. SIDE WING MIRRORS, ARTICULATED PASSENGER DOORS, SHUT LINES & HANDLES
  const leftMirror = createSideMirror3D(true, bodyPaintMat, trimMat);
  leftMirror.position.set(cowlX + 4, beltY + 2, (totalCarWidth / 2) - 4);
  car3DGroup.add(leftMirror);

  const rightMirror = createSideMirror3D(false, bodyPaintMat, trimMat);
  rightMirror.position.set(cowlX + 4, beltY + 2, -((totalCarWidth / 2) - 4));
  car3DGroup.add(rightMirror);

  // Authentically Articulated Front & Rear Passenger Doors
  [-1, 1].forEach(side => {
    const zOuter = side * ((totalCarWidth / 2) + 1.2);
    const zSeam = side * ((totalCarWidth / 2) + 1.25);
    const zHandleWell = side * ((totalCarWidth / 2) + 1.28);
    const zHandleBar = side * ((totalCarWidth / 2) + 2.10);
    const zHandleChrome = side * ((totalCarWidth / 2) + 2.90);

    // A. FRONT DOOR LEADING SEAM (A-Pillar / Front Fender Seam)
    // Runs from the cowl base / front window corner down to the rocker sill
    const frontTopX = cowlX + 2.0;
    const frontBotX = cowlX + 0.8;
    const frontSeamH = beltY - rockerY;
    const frontRakeAngle = Math.atan2(frontTopX - frontBotX, frontSeamH);
    const frontSeamLen = Math.hypot(frontTopX - frontBotX, frontSeamH);
    const frontSeamGeo = new THREE.BoxGeometry(0.65, frontSeamLen, 0.45);
    const frontSeam = new THREE.Mesh(frontSeamGeo, doorSeamMat);
    frontSeam.position.set((frontTopX + frontBotX) / 2, (beltY + rockerY) / 2, zSeam);
    frontSeam.rotation.z = -frontRakeAngle;
    addCadEdges(frontSeam, 0x38bdf8, 20);
    car3DGroup.add(frontSeam);

    // B. CENTER B-PILLAR SEAM (Front-to-Rear Passenger Door Division)
    // Runs vertically from the window sill at bPillarX down to the rocker panel
    const bSeamH = beltY - rockerY;
    const bSeamGeo = new THREE.BoxGeometry(0.65, bSeamH, 0.45);
    const bSeam = new THREE.Mesh(bSeamGeo, doorSeamMat);
    bSeam.position.set(bPillarX, (beltY + rockerY) / 2, zSeam);
    addCadEdges(bSeam, 0x38bdf8, 20);
    car3DGroup.add(bSeam);

    // C. REAR DOOR TRAILING SHUT LINE & WHEEL ARCH DOGLEG
    // 1. Upper vertical segment from window sill down to rear wheel arch entry
    const archTopY = wheelY + wheelArchR + 1.2;
    const rSeamTopH = beltY - archTopY;
    if (rSeamTopH > 0) {
      const rSeamTopGeo = new THREE.BoxGeometry(0.65, rSeamTopH, 0.45);
      const rSeamTop = new THREE.Mesh(rSeamTopGeo, doorSeamMat);
      rSeamTop.position.set(rearDoorEnd, archTopY + (rSeamTopH / 2), zSeam);
      addCadEdges(rSeamTop, 0x38bdf8, 20);
      car3DGroup.add(rSeamTop);
    }

    // 2. Dogleg curve contouring around the front lip of the rear wheel arch down to the rocker sill
    const doglegFrontX = rearWheelX - wheelArchR - 2.0;
    const midX = rearDoorEnd - (rearDoorEnd - doglegFrontX) * 0.48;
    const midY = archTopY - (archTopY - rockerY) * 0.40;

    // Segment 1 (arch top to mid dogleg):
    const d1Len = Math.hypot(rearDoorEnd - midX, archTopY - midY);
    const d1Angle = Math.atan2(rearDoorEnd - midX, archTopY - midY);
    const d1Geo = new THREE.BoxGeometry(0.65, d1Len, 0.45);
    const d1Mesh = new THREE.Mesh(d1Geo, doorSeamMat);
    d1Mesh.position.set((rearDoorEnd + midX) / 2, (archTopY + midY) / 2, zSeam);
    d1Mesh.rotation.z = -d1Angle;
    addCadEdges(d1Mesh, 0x38bdf8, 20);
    car3DGroup.add(d1Mesh);

    // Segment 2 (mid dogleg down to rocker sill):
    const d2Len = Math.hypot(midX - doglegFrontX, midY - rockerY);
    const d2Angle = Math.atan2(midX - doglegFrontX, midY - rockerY);
    const d2Geo = new THREE.BoxGeometry(0.65, d2Len, 0.45);
    const d2Mesh = new THREE.Mesh(d2Geo, doorSeamMat);
    d2Mesh.position.set((midX + doglegFrontX) / 2, (midY + rockerY) / 2, zSeam);
    d2Mesh.rotation.z = -d2Angle;
    addCadEdges(d2Mesh, 0x38bdf8, 20);
    car3DGroup.add(d2Mesh);

    // D. LOWER DOOR ROCKER SILL SEAM (Horizontal bottom door gap)
    const rockerGapLen = Math.abs(doglegFrontX - frontBotX);
    const rockerGapGeo = new THREE.BoxGeometry(rockerGapLen, 0.55, 0.45);
    const rockerGap = new THREE.Mesh(rockerGapGeo, doorSeamMat);
    rockerGap.position.set((frontBotX + doglegFrontX) / 2, rockerY + 0.8, zSeam);
    addCadEdges(rockerGap, 0x38bdf8, 20);
    car3DGroup.add(rockerGap);

    // E. DOOR SURFACE SCULPTING (Character Creases)
    // 1. Upper Waistline Character Crease (Tornado Line / Shoulder Highlight)
    const waistlineLen = Math.abs(rearDoorEnd - (cowlX + 2.5));
    const waistlineGeo = new THREE.BoxGeometry(waistlineLen, 0.55, 0.55);
    const waistline = new THREE.Mesh(waistlineGeo, bodyPaintMat);
    waistline.position.set((cowlX + 2.5 + rearDoorEnd) / 2, beltY - 5.5, zOuter + (side * 0.15));
    addCadEdges(waistline, 0x38bdf8, 15);
    car3DGroup.add(waistline);

    // 2. Lower Door Dynamic Scallop / Sill Swage Blade
    const lowerBladeLen = Math.abs(doglegFrontX - 2.0 - (cowlX + 7.0));
    const lowerBladeGeo = new THREE.BoxGeometry(lowerBladeLen, 1.3, 0.5);
    const lowerBlade = new THREE.Mesh(lowerBladeGeo, isSUV ? claddingMat : bodyPaintMat);
    lowerBlade.position.set((cowlX + 7.0 + doglegFrontX - 2.0) / 2, rockerY + 7.5, zOuter + (side * 0.15));
    addCadEdges(lowerBlade, 0x38bdf8, 20);
    car3DGroup.add(lowerBlade);

    // F. HIGH-TECH ERGONOMIC DOOR HANDLES (Front & Rear Doors)
    const handleY = beltY - 5.5;
    const frontHandleX = bPillarX - 18;
    const rearHandleX = Math.min(bPillarX + 26, rearDoorEnd - 14);

    [
      { hx: frontHandleX, isFront: true },
      { hx: rearHandleX, isFront: false }
    ].forEach(({ hx, isFront }) => {
      // 1. Recessed Finger Cup Cavity (Escutcheon Well)
      const cupGeo = new THREE.BoxGeometry(11.5, 4.2, 0.45);
      const cup = new THREE.Mesh(cupGeo, trimMat);
      cup.position.set(hx, handleY, zHandleWell);
      addCadEdges(cup, 0x1e293b, 15);
      car3DGroup.add(cup);

      // 2. Body-Color Aerodynamic Pull Bar (Grab Handle)
      const barGeo = new THREE.BoxGeometry(9.6, 2.0, 1.6);
      const bar = new THREE.Mesh(barGeo, bodyPaintMat);
      bar.position.set(hx, handleY, zHandleBar);
      addCadEdges(bar, 0x38bdf8, 15);
      car3DGroup.add(bar);

      // 3. High-Tech Chrome Accent / Touch-to-Unlock Sensor Strip
      const chromeGeo = new THREE.BoxGeometry(5.0, 0.35, 0.35);
      const chromeStrip = new THREE.Mesh(chromeGeo, chromeMat);
      chromeStrip.position.set(hx, handleY + 0.8, zHandleChrome);
      car3DGroup.add(chromeStrip);

      // 4. Subtle Mechanical Key Lock Cylinder on Front Driver's Door
      if (isFront) {
        const lockGeo = new THREE.BoxGeometry(1.2, 1.2, 0.35);
        const lockMesh = new THREE.Mesh(lockGeo, chromeMat);
        lockMesh.position.set(hx + (side > 0 ? 3.6 : -3.6), handleY, zHandleBar + (side * 0.1));
        car3DGroup.add(lockMesh);
      }
    });

    // G. GREENHOUSE WEATHERSTRIPS & DOOR FRAME SASHES
    // Beltline window weatherstrip running along glass base
    const greenhouseGlassLen = Math.abs(rearSillX - (cowlX + 2.5));
    const scraperGeo = new THREE.BoxGeometry(greenhouseGlassLen, 0.75, 0.9);
    const scraper = new THREE.Mesh(scraperGeo, trimMat);
    scraper.position.set((cowlX + 2.5 + rearSillX) / 2, beltY + 0.4, side * ((cabinWidth / 2) + 0.7));
    car3DGroup.add(scraper);

    // Rear door division bar (separating roll-down door glass from fixed rear quarter glass)
    const bHeight = roofTopY - beltY - 3;
    const winHeight = roofTopY - beltY - 5;
    const divGeo = new THREE.BoxGeometry(1.6, winHeight, 1.4);
    const divBar = new THREE.Mesh(divGeo, pillarMat);
    divBar.position.set(rearDoorEnd, beltY + (winHeight / 2) + 0.5, side * ((cabinWidth / 2) + 0.7));
    addCadEdges(divBar, 0x38bdf8, 20);
    car3DGroup.add(divBar);
  });

  // 9. ROOF PANEL & INTEGRATED SPOILER
  const roofLen = Math.abs(roofRearX - roofFrontX);
  const roofGeo = new THREE.BoxGeometry(roofLen, 2.2, cabinWidth - 4);
  const roofMesh = new THREE.Mesh(roofGeo, (car.id.includes('tesla') ? glassMat : bodyPaintMat));
  roofMesh.position.set((roofFrontX + roofRearX) / 2, roofTopY - 1.1, 0);
  addCadEdges(roofMesh, 0x38bdf8);
  car3DGroup.add(roofMesh);

  // Aerodynamic Rear Roof Spoiler with High-Mount Stop Lamp (HMSL)
  const spoilerLen = 10;
  const spoilerGeo = new THREE.BoxGeometry(spoilerLen, 2.2, cabinWidth - 6);
  const spoiler = new THREE.Mesh(spoilerGeo, bodyPaintMat);
  spoiler.position.set(roofRearX + (spoilerLen / 2) - 2, roofTopY - 0.5, 0);
  spoiler.rotation.z = -0.06;
  addCadEdges(spoiler, 0x38bdf8);
  car3DGroup.add(spoiler);

  // High-Mount LED Brake Light Strip on Spoiler
  const hmslGeo = new THREE.BoxGeometry(spoilerLen - 2, 1.0, cabinWidth * 0.35);
  const hmsl = new THREE.Mesh(hmslGeo, taillampMat);
  hmsl.position.set(roofRearX + (spoilerLen / 2) - 1, roofTopY - 0.5, 0);
  car3DGroup.add(hmsl);

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
  let outerLightX = rearBumperX - 6;
  let outerLightY = beltY - 1.5;
  const rearFaceHeight = Math.abs(beltY - (sillY + 4));
  let lowerLen = Math.hypot(rearBumperX - rearSillX, (beltY + 1) - (sillY + 4));
  let lowerAngle = isSaloon ? 0 : Math.atan2((beltY + 1) - (sillY + 4), rearBumperX - rearSillX);
  let cornerPanelLen = lowerLen + 1;
  let cornerPanelX = rearBumperX - 6;
  let cornerPanelY = (sillY + 4) + (rearFaceHeight / 2);
  let cornerPanelAngle = isSaloon ? 0 : -lowerAngle;
  let saloonLidW = Math.min(totalCarWidth - 44, Math.max(apWidth + 14, 108));
  let deckSideW = Math.max(8, ((totalCarWidth - 4) - saloonLidW) / 2);

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

    const trunkLen = Math.abs(rearSillX - deckFrontX);
    const trunkLidGeo = new THREE.BoxGeometry(trunkLen, 2.5, saloonLidW);
    const trunkLid = new THREE.Mesh(trunkLidGeo, bodyPaintMat);
    trunkLid.position.set(trunkLen / 2, 0, 0);
    addCadEdges(trunkLid, 0x38bdf8);
    tailgatePivot.add(trunkLid);

    // Fixed Rear Quarter Deck Shoulders on either side of the trunk lid
    [-1, 1].forEach(side => {
      const deckSideZ = side * ((saloonLidW / 2) + (deckSideW / 2));
      const deckSideGeo = new THREE.BoxGeometry(trunkLen, 2.4, deckSideW);
      const deckSide = new THREE.Mesh(deckSideGeo, bodyPaintMat);
      deckSide.position.set((deckFrontX + rearSillX) / 2, beltY - 1.2, deckSideZ);
      addCadEdges(deckSide, 0x38bdf8);
      car3DGroup.add(deckSide);
    });

    // Vertical Trunk Lid Rear Drop Face (Lifts with trunk lid)
    const rearFaceGeo = new THREE.BoxGeometry(2.5, rearFaceHeight, saloonLidW - 2);
    const rearFace = new THREE.Mesh(rearFaceGeo, bodyPaintMat);
    rearFace.position.set(trunkLen, -(rearFaceHeight / 2), 0);
    tailgatePivot.add(rearFace);

    // Inner Trunk Taillight Clusters (Lifts with trunk lid)
    const saloonLampH = Math.min(6.5, rearFaceHeight * 0.35);
    const saloonInnerLightGroup = new THREE.Group();
    saloonInnerLightGroup.position.set(trunkLen + 1.4, -(rearFaceHeight * 0.32), 0);
    const innerLightW = Math.min(18, (saloonLidW / 2) * 0.36);
    [-1, 1].forEach(side => {
      const lightZ = side * ((saloonLidW / 2) - (innerLightW / 2) - 2);

      const podGeo = new THREE.BoxGeometry(1.2, saloonLampH, innerLightW);
      const pod = new THREE.Mesh(podGeo, taillampBezelMat);
      pod.position.set(-0.4, 0, lightZ);
      saloonInnerLightGroup.add(pod);

      const bladeGeo = new THREE.BoxGeometry(0.4, saloonLampH * 0.45, innerLightW - 0.8);
      const blade = new THREE.Mesh(bladeGeo, taillampMat);
      blade.position.set(0.1, saloonLampH * 0.16, lightZ);
      saloonInnerLightGroup.add(blade);

      const indGeo = new THREE.BoxGeometry(0.3, saloonLampH * 0.25, innerLightW - 1.2);
      const ind = new THREE.Mesh(indGeo, taillampClearMat);
      ind.position.set(0.1, -saloonLampH * 0.22, lightZ);
      saloonInnerLightGroup.add(ind);

      const lensGeo = new THREE.BoxGeometry(0.5, saloonLampH + 0.2, innerLightW + 0.2);
      const lens = new THREE.Mesh(lensGeo, taillampLensMat);
      lens.position.set(0.3, 0, lightZ);
      saloonInnerLightGroup.add(lens);
    });

    // Center Chrome Garnish bridging the inner taillights
    const garnishW = Math.max(4, saloonLidW - (innerLightW * 2) - 8);
    const garnishGeo = new THREE.BoxGeometry(0.5, 1.2, garnishW);
    const garnish = new THREE.Mesh(garnishGeo, chromeMat);
    garnish.position.set(0.1, saloonLampH * 0.16, 0);
    saloonInnerLightGroup.add(garnish);

    // Recessed Rear License Plate Plinth & UK Yellow Plate on Saloon Trunk Lid
    const plateH = Math.min(6.5, rearFaceHeight * 0.36);
    const platePlinthGeo = new THREE.BoxGeometry(0.8, plateH + 1.2, 36);
    const platePlinth = new THREE.Mesh(platePlinthGeo, trimMat);
    platePlinth.position.set(trunkLen + 1.1, -(rearFaceHeight * 0.72), 0);
    tailgatePivot.add(platePlinth);

    const rPlateGeo = new THREE.BoxGeometry(0.6, plateH, 34);
    const rPlateMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.35
    });
    const rPlate = new THREE.Mesh(rPlateGeo, rPlateMat);
    rPlate.position.set(trunkLen + 1.5, -(rearFaceHeight * 0.72), 0);
    tailgatePivot.add(rPlate);

    tailgatePivot.add(saloonInnerLightGroup);

    // Compact realistic trunk lid hinge brackets
    [-1, 1].forEach(side => {
      const hingeGeo = new THREE.BoxGeometry(4.0, 1.8, 1.8);
      const hinge = new THREE.Mesh(hingeGeo, trimMat);
      hinge.position.set(2, -1, side * ((saloonLidW / 2) - 3));
      tailgatePivot.add(hinge);
    });

    outerLightX = rearSillX + 1.4;
    outerLightY = beltY - (rearFaceHeight * 0.32);
    cornerPanelLen = 2.5;
    cornerPanelX = rearSillX;
    cornerPanelY = (sillY + 4) + (rearFaceHeight / 2);
    cornerPanelAngle = 0;

  } else {
    // HATCHBACK, ESTATE & SUV: Hinges at (roofRearX, roofTopY, 0)
    tailgatePivot.position.set(roofRearX, roofTopY, 0);

    // Dynamic Hatch Geometry Points relative to roof hinge:
    // 1. Waistline / rear glass base (where raked window meets lower boot lid):
    const waistX = (rearSillX + 1) - roofRearX;
    const waistY = (beltY + 1) - roofTopY;

    // 2. Bottom boot sill (where lower boot lid meets rear bumper loading lip):
    const sillPointX = (rearBumperX - 2) - roofRearX;
    const sillPointY = (sillY + 4) - roofTopY;

    // Upper Tailgate (Raked Rear Windshield Glass & Cantrails):
    const glassLen = Math.hypot(waistX, waistY);
    const glassAngle = Math.atan2(-waistY, waistX);
    const hatchWidth = cabinWidth - 6;

    // Aerodynamic Rear Roof Spoiler with 3rd High-Mount Brake Light
    const spoilerLen = isHatch ? 13 : 9;
    const spoilerGeo = new THREE.BoxGeometry(spoilerLen, 3.2, hatchWidth + 2);
    const spoiler = new THREE.Mesh(spoilerGeo, bodyPaintMat);
    spoiler.position.set((spoilerLen / 2) - 1, 1.2, 0);
    tailgatePivot.add(spoiler);

    const thirdBrakeGeo = new THREE.BoxGeometry(1.8, 1.6, 26);
    const thirdBrake = new THREE.Mesh(thirdBrakeGeo, taillampMat);
    thirdBrake.position.set(spoilerLen - 2, 1.8, 0);
    tailgatePivot.add(thirdBrake);

    // Rear Windshield Glass (raked along C-pillar line)
    const rearGlassGeo = new THREE.BoxGeometry(glassLen - 3, 1.8, hatchWidth - 4);
    const rearGlass = new THREE.Mesh(rearGlassGeo, glassMat);
    rearGlass.position.set(waistX / 2, waistY / 2, 0);
    rearGlass.rotation.z = -glassAngle;
    tailgatePivot.add(rearGlass);

    // Side cantrails framing the glass (closes gap to C-pillar)
    [-1, 1].forEach(side => {
      const cantrailGeo = new THREE.BoxGeometry(glassLen, 2.4, 2.5);
      const cantrail = new THREE.Mesh(cantrailGeo, bodyPaintMat);
      cantrail.position.set(waistX / 2, waistY / 2, side * ((hatchWidth / 2) - 1.25));
      cantrail.rotation.z = -glassAngle;
      tailgatePivot.add(cantrail);
    });

    // Lower Tailgate Body Panel (dropping down from waistline to bumper loading sill):
    const lowerSpanX = sillPointX - waistX;
    const lowerSpanY = sillPointY - waistY;
    lowerLen = Math.hypot(lowerSpanX, lowerSpanY);
    lowerAngle = Math.atan2(-lowerSpanY, lowerSpanX);

    // Main Lower Tailgate Sheet Metal Panel (matches rear quarter panel curvature)
    const lowerPanelGeo = new THREE.BoxGeometry(lowerLen + 0.5, 3.0, hatchWidth);
    const lowerPanel = new THREE.Mesh(lowerPanelGeo, bodyPaintMat);
    lowerPanel.position.set(waistX + (lowerSpanX / 2), waistY + (lowerSpanY / 2), 0);
    lowerPanel.rotation.z = -lowerAngle;
    addCadEdges(lowerPanel, 0x38bdf8);
    tailgatePivot.add(lowerPanel);

    // Modern Automotive Split Tailgate Taillights & Full-Width Connecting LED Lightbar:
    // Placed ~28% down the slope below the rear glass waistline
    const lightOffsetFrac = 0.28;
    const innerLightGroup = new THREE.Group();
    innerLightGroup.position.set(
      waistX + (lowerSpanX * lightOffsetFrac),
      waistY + (lowerSpanY * lightOffsetFrac),
      0
    );
    innerLightGroup.rotation.z = -lowerAngle;

    const halfHatchW = hatchWidth / 2;
    const innerLightW = Math.min(20, halfHatchW * 0.38);
    const lampHeight = Math.min(7.5, Math.max(5.0, lowerLen * 0.26));

    [-1, 1].forEach(side => {
      // Inner Light Pod Housing (Mounts flush on tailgate lid, aligns with outer cluster when closed)
      const podZ = side * (halfHatchW - (innerLightW / 2) - 0.8);

      const podGeo = new THREE.BoxGeometry(lampHeight, 1.2, innerLightW);
      const pod = new THREE.Mesh(podGeo, taillampBezelMat);
      pod.position.set(0, 1.1, podZ);
      innerLightGroup.add(pod);

      // Ruby LED Blade Segment
      const bladeGeo = new THREE.BoxGeometry(lampHeight * 0.45, 0.4, innerLightW - 0.6);
      const blade = new THREE.Mesh(bladeGeo, taillampMat);
      blade.position.set(lampHeight * 0.16, 1.6, podZ);
      innerLightGroup.add(blade);

      // Crystalline Reverse / Indicator Inset
      const indGeo = new THREE.BoxGeometry(lampHeight * 0.25, 0.3, innerLightW - 1.2);
      const ind = new THREE.Mesh(indGeo, taillampClearMat);
      ind.position.set(-lampHeight * 0.22, 1.6, podZ);
      innerLightGroup.add(ind);

      // High-Gloss Protective Ruby Outer Lens
      const lensGeo = new THREE.BoxGeometry(lampHeight + 0.2, 0.5, innerLightW + 0.2);
      const lens = new THREE.Mesh(lensGeo, taillampLensMat);
      lens.position.set(0, 1.8, podZ);
      innerLightGroup.add(lens);
    });

    // Sleek Illuminated Center LED Lightbar bridging both inner clusters
    const centerBarW = Math.max(4, (halfHatchW - innerLightW - 1.6) * 2);
    const centerBezelGeo = new THREE.BoxGeometry(1.6, 0.8, centerBarW);
    const centerBezel = new THREE.Mesh(centerBezelGeo, taillampBezelMat);
    centerBezel.position.set(lampHeight * 0.16, 1.1, 0);
    innerLightGroup.add(centerBezel);

    const centerLedGeo = new THREE.BoxGeometry(1.2, 0.4, centerBarW - 0.4);
    const centerLed = new THREE.Mesh(centerLedGeo, taillampMat);
    centerLed.position.set(lampHeight * 0.16, 1.5, 0);
    innerLightGroup.add(centerLed);

    tailgatePivot.add(innerLightGroup);

    // Centered Brand Emblem (VW Roundel Boot Release Handle)
    const badgeGeo = new THREE.CylinderGeometry(3.2, 3.2, 1.2, 24);
    const badge = new THREE.Mesh(badgeGeo, chromeMat);
    badge.position.set(waistX + (lowerSpanX * 0.46) + 1.2, waistY + (lowerSpanY * 0.46), 0);
    badge.rotation.z = -lowerAngle + (Math.PI / 2);
    tailgatePivot.add(badge);

    // Recessed Rear License Plate Plinth & UK Yellow Plate
    const plateCavityGeo = new THREE.BoxGeometry(Math.max(3.5, lowerLen * 0.36), 1.8, 38);
    const plateCavity = new THREE.Mesh(plateCavityGeo, trimMat);
    plateCavity.position.set(waistX + (lowerSpanX * 0.74) + 0.6, waistY + (lowerSpanY * 0.74) - 0.2, 0);
    plateCavity.rotation.z = -lowerAngle;
    tailgatePivot.add(plateCavity);

    const rPlateGeo = new THREE.BoxGeometry(Math.max(3.0, lowerLen * 0.30), 0.8, 36);
    const rPlateMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Authentic UK rear yellow registration plate
      roughness: 0.35
    });
    const rPlate = new THREE.Mesh(rPlateGeo, rPlateMat);
    rPlate.position.set(waistX + (lowerSpanX * 0.74) + 1.2, waistY + (lowerSpanY * 0.74) - 0.2, 0);
    rPlate.rotation.z = -lowerAngle;
    tailgatePivot.add(rPlate);

    // Tailgate Hinge Mounting Brackets
    [-1, 1].forEach(side => {
      const hingeGeo = new THREE.BoxGeometry(8, 3.2, 3.0);
      const hinge = new THREE.Mesh(hingeGeo, trimMat);
      hinge.position.set(0, -1, side * ((hatchWidth / 2) - 4));
      tailgatePivot.add(hinge);
    });

    outerLightX = roofRearX + waistX + (lowerSpanX * lightOffsetFrac);
    outerLightY = roofTopY + waistY + (lowerSpanY * lightOffsetFrac);
    cornerPanelLen = lowerLen + 0.5;
    cornerPanelX = roofRearX + waistX + (lowerSpanX / 2);
    cornerPanelY = roofTopY + waistY + (lowerSpanY / 2);
    cornerPanelAngle = -lowerAngle;
  }

  targetTailgateAngle = isTailgateOpen ? openAngle : 0;
  currentTailgateAngle = targetTailgateAngle;
  tailgatePivot.rotation.z = currentTailgateAngle;
  car3DGroup.add(tailgatePivot);

  // Transverse Rear Bumper Apron below tailgate
  const rearBumperHeight = Math.max(14, (sillY + 4) - rockerY);
  const rearBumperGeo = new THREE.BoxGeometry(rearBumperX - rearSillX + 4, rearBumperHeight, totalCarWidth - 4);
  const rearBumperMesh = new THREE.Mesh(rearBumperGeo, bodyPaintMat);
  rearBumperMesh.position.set((rearSillX + rearBumperX) / 2, rockerY + (rearBumperHeight / 2), 0);
  addCadEdges(rearBumperMesh, 0x38bdf8);
  car3DGroup.add(rearBumperMesh);

  // Upper Bumper Step / Scuff Loading Protection Sill (Hatchback, Estate & SUV only)
  if (!isSaloon) {
    const bumperStepGeo = new THREE.BoxGeometry(6, 1.4, cabinWidth - 8);
    const bumperStep = new THREE.Mesh(bumperStepGeo, trimMat);
    bumperStep.position.set(rearBumperX - 3, sillY + 4.2, 0);
    car3DGroup.add(bumperStep);
  }

  // Rear Quarter Haunch Transition Panels & Outer Taillights (Mounted on body)
  const halfTailgateW = isSaloon ? (saloonLidW / 2) : ((cabinWidth - 6) / 2);
  const quarterSpanW = isSaloon ? deckSideW : Math.max(3, (totalCarWidth / 2) - halfTailgateW);
  const outerLightW = Math.max(4, Math.min(20, quarterSpanW - 1.6));
  const lampHeight = isSaloon ? Math.min(6.5, rearFaceHeight * 0.35) : Math.min(7.5, Math.max(5.0, lowerLen * 0.26));

  [-1, 1].forEach(side => {
    const quarterCenterZ = side * (halfTailgateW + (quarterSpanW / 2));
    const outerClusterZ = side * (halfTailgateW + 0.8 + (outerLightW / 2));

    // 1. Sleek Lower Quarter Haunch Sheet Metal (Flush with lower tailgate, clean CAD edges)
    const cornerGeo = isSaloon
      ? new THREE.BoxGeometry(2.5, rearFaceHeight, quarterSpanW)
      : new THREE.BoxGeometry(cornerPanelLen, 3.0, quarterSpanW);
    const corner = new THREE.Mesh(cornerGeo, bodyPaintMat);
    corner.position.set(cornerPanelX, cornerPanelY, quarterCenterZ);
    corner.rotation.z = cornerPanelAngle;
    addCadEdges(corner, 0x38bdf8);
    car3DGroup.add(corner);

    // 2. High-Tech Jewel Outer Taillight Cluster (Flush on quarter shoulder, perfectly aligned with tailgate)
    const outerCluster = new THREE.Group();
    outerCluster.position.set(outerLightX, outerLightY, outerClusterZ);
    outerCluster.rotation.z = cornerPanelAngle;

    if (isSaloon) {
      const bezelGeo = new THREE.BoxGeometry(1.2, lampHeight, outerLightW);
      const bezel = new THREE.Mesh(bezelGeo, taillampBezelMat);
      bezel.position.set(-0.4, 0, 0);
      outerCluster.add(bezel);

      const rubyBladeGeo = new THREE.BoxGeometry(0.4, lampHeight * 0.45, outerLightW - 0.4);
      const rubyBlade = new THREE.Mesh(rubyBladeGeo, taillampMat);
      rubyBlade.position.set(0.1, lampHeight * 0.16, 0);
      outerCluster.add(rubyBlade);

      const indGeo = new THREE.BoxGeometry(0.3, lampHeight * 0.25, outerLightW - 0.8);
      const indMesh = new THREE.Mesh(indGeo, taillampClearMat);
      indMesh.position.set(0.1, -lampHeight * 0.22, 0);
      outerCluster.add(indMesh);

      const coverGeo = new THREE.BoxGeometry(0.5, lampHeight + 0.2, outerLightW + 0.2);
      const cover = new THREE.Mesh(coverGeo, taillampLensMat);
      cover.position.set(0.3, 0, 0);
      outerCluster.add(cover);

    } else {
      // Dark Smoked Housing / Bezel (protrudes only 0.2cm proud of sheet metal)
      const bezelGeo = new THREE.BoxGeometry(lampHeight, 1.2, outerLightW);
      const bezel = new THREE.Mesh(bezelGeo, taillampBezelMat);
      bezel.position.set(0, 1.1, 0);
      outerCluster.add(bezel);

      // Primary Illuminated Ruby LED Blade
      const rubyBladeGeo = new THREE.BoxGeometry(lampHeight * 0.45, 0.4, outerLightW - 0.4);
      const rubyBlade = new THREE.Mesh(rubyBladeGeo, taillampMat);
      rubyBlade.position.set(lampHeight * 0.16, 1.6, 0);
      outerCluster.add(rubyBlade);

      // Aerodynamic wrap-around wing along the outer side fender
      const wrapWingGeo = new THREE.BoxGeometry(lampHeight * 0.70, 0.4, 0.8);
      const wrapWing = new THREE.Mesh(wrapWingGeo, taillampMat);
      wrapWing.position.set(lampHeight * 0.10, 1.6, side * ((outerLightW / 2) - 0.4));
      outerCluster.add(wrapWing);

      // Crystalline Reversing / Indicator Accent Strip
      const indGeo = new THREE.BoxGeometry(lampHeight * 0.25, 0.3, outerLightW - 0.8);
      const indMesh = new THREE.Mesh(indGeo, taillampClearMat);
      indMesh.position.set(-lampHeight * 0.22, 1.6, 0);
      outerCluster.add(indMesh);

      // High-Gloss Protective Ruby Polycarbonate Outer Lens
      const coverGeo = new THREE.BoxGeometry(lampHeight + 0.2, 0.5, outerLightW + 0.2);
      const cover = new THREE.Mesh(coverGeo, taillampLensMat);
      cover.position.set(0, 1.8, 0);
      outerCluster.add(cover);
    }

    car3DGroup.add(outerCluster);
  });

  // Lower Rear Diffuser / Valance with twin chrome exhaust tips
  const diffuserGeo = new THREE.BoxGeometry(8, 5, totalCarWidth * 0.65);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, isSUV ? claddingMat : trimMat);
  diffuserMesh.position.set(rearBumperX - 1, rockerY + 2.5, 0);
  car3DGroup.add(diffuserMesh);

  [-1, 1].forEach(side => {
    const exhaustGeo = new THREE.CylinderGeometry(2.0, 2.0, 3.5, 16);
    const exhaust = new THREE.Mesh(exhaustGeo, chromeMat);
    exhaust.rotation.z = Math.PI / 2;
    exhaust.position.set(rearBumperX + 1.2, rockerY + 3.5, side * 24);
    car3DGroup.add(exhaust);
  });

  // 11. APERTURE CAD BOUNDARY GATE (Intelligent Ingress Indicator)
  // Shows the loading clearance portal when actively inspecting entrance or when colliding!
  const isApertureColliding = fitResult && fitResult.ingress && !fitResult.ingress.canEnter;
  const isIngressMode = activeAngleMode === 'ingress';

  const apSpanX = Math.abs(rearSillX - roofRearX);
  const apSpanY = Math.max(1, roofTopY - (sillY + 2.0));
  const apTilt = isSaloon ? 0 : Math.atan2(apSpanX, apSpanY);

  const apCenterDist = apHeight / 2;
  const apCenterX = rearSillX - apCenterDist * Math.sin(apTilt);
  const apCenterY = (sillY + 2.0) + apCenterDist * Math.cos(apTilt);

  // Display the aperture frame only when colliding or in Boot View:
  // This completely eliminates the awkward 'huge bezels' wireframe box when an item fits easily!
  if (isApertureColliding || isIngressMode) {
    const apFrameMat = new THREE.LineBasicMaterial({
      color: isApertureColliding ? 0xef4444 : 0x38bdf8,
      linewidth: 2.5
    });
    
    // 4-Point raked perimeter line flush at entrance
    const apPoints = [
      new THREE.Vector3(0, -apHeight / 2, -apWidth / 2),
      new THREE.Vector3(0, -apHeight / 2, apWidth / 2),
      new THREE.Vector3(0, apHeight / 2, apWidth / 2),
      new THREE.Vector3(0, apHeight / 2, -apWidth / 2)
    ];
    const apGeo = new THREE.BufferGeometry().setFromPoints(apPoints);
    const apLine = new THREE.LineLoop(apGeo, apFrameMat);
    apLine.position.set(apCenterX, apCenterY, 0);
    apLine.rotation.z = apTilt;
    car3DGroup.add(apLine);

    if (isApertureColliding) {
      // Semi-transparent red laser collision barrier
      const barrierGeo = new THREE.PlaneGeometry(apWidth, apHeight);
      const barrierMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide
      });
      const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
      barrierMesh.position.set(apCenterX, apCenterY, 0);
      barrierMesh.rotation.y = Math.PI / 2;
      barrierMesh.rotation.x = apTilt;
      car3DGroup.add(barrierMesh);
    }
  }

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

  // Interior Rounded Wheel Arch Tubs (framing the cargo bay strictly inside the boot)
  // Guaranteed clear boundary: bounded strictly between archW/2 and the inner cabin trim
  // NEVER reaches or overlaps the outer wheel face or tyre!
  const innerArchZ = archW / 2;
  const outerArchZ = halfTailgateW;
  const tubThickness = Math.max(8, outerArchZ - innerArchZ);
  const tubRadius = Math.max(16, Math.min(22, Math.round(wheelArchR * 0.60)));

  const leftTub = createRoundedWheelArchTub(tubRadius, tubThickness, isGhost);
  leftTub.position.set(rearWheelX, sillY + 1.25, innerArchZ);

  const rightTub = createRoundedWheelArchTub(tubRadius, tubThickness, isGhost);
  rightTub.position.set(rearWheelX, sillY + 1.25, -outerArchZ);

  car3DGroup.add(leftTub);
  car3DGroup.add(rightTub);

  // Interior Boot Trim Carpet Side Liners & Floor Trays (Seamlessly seals cargo compartment)
  const sideLinerMat = new THREE.MeshStandardMaterial({
    color: 0x121b2b,
    roughness: 0.90,
    transparent: isGhost,
    opacity: isGhost ? 0.65 : 1.0
  });

  [-1, 1].forEach(side => {
    // 1. Boot Floor Side Tray (behind wheel arches from rearWheelX + tubRadius to rearSillX)
    const trayLen = Math.max(4, rearSillX - (rearWheelX + tubRadius));
    const trayWidth = Math.max(2, halfTailgateW - (archW / 2));
    const trayCenterZ = side * ((archW / 2) + (trayWidth / 2));
    const trayGeo = new THREE.BoxGeometry(trayLen, 2.5, trayWidth);
    const trayMesh = new THREE.Mesh(trayGeo, bootFloorMat);
    trayMesh.position.set(rearSillX - (trayLen / 2), sillY + 1.25, trayCenterZ);
    car3DGroup.add(trayMesh);

    // 2. Vertical Boot Interior Carpet Side Wall (from cargo bed front to rearSillX, sillY to beltY)
    const wallHeight = Math.max(10, beltY - (sillY + 1.25));
    const wallLen = currentFloorLen;
    const wallZ = side * halfTailgateW;
    const wallGeo = new THREE.BoxGeometry(wallLen, wallHeight, 2.0);
    const wallMesh = new THREE.Mesh(wallGeo, sideLinerMat);
    wallMesh.position.set(rearSillX - (wallLen / 2), sillY + 1.25 + (wallHeight / 2), wallZ);
    // Note: Rendered with clean carpet material and NO wireframe lines to blend seamlessly into interior
    car3DGroup.add(wallMesh);
  });



  // Front Bucket Seats (UK Right Hand Drive: Driver at -Z, Passenger at +Z)
  const seatZOffset = (totalCarWidth / 4) - 6;
  const driverSeat = createSeat3D(44, 22);
  driverSeat.position.set(frontSeatsX, cabinFloorY, -seatZOffset); // Driver on RIGHT side (-Z)
  const passSeat = createSeat3D(44, 22);
  passSeat.position.set(frontSeatsX, cabinFloorY, seatZOffset); // Passenger on LEFT side (+Z)
  car3DGroup.add(driverSeat);
  car3DGroup.add(passSeat);

  // Cockpit Dashboard, Instrument Binnacle & Sport Steering Wheel
  const cockpit = createCockpit3D(cabinWidth, cowlX, cowlY, beltY, frontSeatsX, cabinFloorY, totalCarWidth, seatCushionY);
  car3DGroup.add(cockpit);

  // 13. REAR PASSENGER SEATS / FOLDED CARGO FLAT ARCHITECTURE
  const rearSeatGroup = new THREE.Group();
  const rearSeatMat = new THREE.MeshStandardMaterial({ color: 0x121b2b, roughness: 0.72 });
  const rearBolsterMat = new THREE.MeshStandardMaterial({ color: 0x0c1320, roughness: 0.85 });
  const carpetBackMat = new THREE.MeshStandardMaterial({ color: 0x162234, roughness: 0.90 });
  const chromeMatLocal = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.92, roughness: 0.14 });
  const rearSeatWidth = cabinWidth - 6;

  if (seatsFolded) {
    // FOLDED REAR SEATS FLAT (60/40 Split Heavy-Duty Cargo Deck with Luggage Skid Rails)
    const foldedLen = Math.max(38, Math.abs(rearHingeX - cargoBedFrontX));
    const foldedY = sillY + 2.5;
    const split60Width = rearSeatWidth * 0.60;
    const split40Width = rearSeatWidth * 0.40;
    const splitGap = 1.0;

    // 60% Left Folded Backrest (Passenger side, +Z)
    const left60Geo = new THREE.BoxGeometry(foldedLen, 5.5, split60Width - splitGap);
    const left60 = new THREE.Mesh(left60Geo, carpetBackMat);
    const leftZ = (rearSeatWidth / 2) - (split60Width / 2);
    left60.position.set(rearHingeX - (foldedLen / 2), foldedY, leftZ);
    addCadEdges(left60, 0x38bdf8);
    rearSeatGroup.add(left60);

    // 40% Right Folded Backrest (Driver side, -Z)
    const right40Geo = new THREE.BoxGeometry(foldedLen, 5.5, split40Width - splitGap);
    const right40 = new THREE.Mesh(right40Geo, carpetBackMat);
    const rightZ = -(rearSeatWidth / 2) + (split40Width / 2);
    right40.position.set(rearHingeX - (foldedLen / 2), foldedY, rightZ);
    addCadEdges(right40, 0x38bdf8);
    rearSeatGroup.add(right40);

    // Longitudinal Luggage Skid Rails (anti-scratch cargo ribs along deck floor)
    [
      -(rearSeatWidth / 2) + (split40Width * 0.3),
      -(rearSeatWidth / 2) + (split40Width * 0.7),
      (rearSeatWidth / 2) - (split60Width * 0.25),
      (rearSeatWidth / 2) - (split60Width * 0.55),
      (rearSeatWidth / 2) - (split60Width * 0.85)
    ].forEach(ribZ => {
      const ribGeo = new THREE.BoxGeometry(foldedLen - 10, 0.8, 1.8);
      const rib = new THREE.Mesh(ribGeo, chromeMatLocal);
      rib.position.set(rearHingeX - (foldedLen / 2), foldedY + 2.8, ribZ);
      rearSeatGroup.add(rib);
    });

    // Chrome Seatback Split Latch Releases on Shoulder
    [-split40Width / 2, split60Width / 2].forEach(offsetZ => {
      const latchGeo = new THREE.BoxGeometry(4.5, 1.2, 5.0);
      const latch = new THREE.Mesh(latchGeo, chromeMatLocal);
      latch.position.set(rearHingeX - 4, foldedY + 3.0, offsetZ);
      rearSeatGroup.add(latch);

      // Red unlatched indicator flag
      const redFlagGeo = new THREE.BoxGeometry(1.2, 0.5, 2.0);
      const redFlag = new THREE.Mesh(redFlagGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      redFlag.position.set(rearHingeX - 4, foldedY + 3.5, offsetZ);
      rearSeatGroup.add(redFlag);
    });

    // Folded Headrests nestled at the front edge into passenger footwell
    [-1, 1].forEach(side => {
      const headFoldGeo = new THREE.BoxGeometry(8, 12, 18);
      const headFold = new THREE.Mesh(headFoldGeo, rearSeatMat);
      headFold.position.set(rearHingeX - foldedLen + 4, foldedY - 2.5, side * (rearSeatWidth * 0.28));
      rearSeatGroup.add(headFold);
    });

    // Twin Metallic Pivot Hinges at rear floor juncture
    [-rearSeatWidth * 0.35, 0, rearSeatWidth * 0.35].forEach(hz => {
      const hingeGeo = new THREE.CylinderGeometry(1.6, 1.6, 4.0, 12);
      const hinge = new THREE.Mesh(hingeGeo, chromeMatLocal);
      hinge.rotation.z = Math.PI / 2;
      hinge.position.set(rearHingeX, foldedY - 0.5, hz);
      rearSeatGroup.add(hinge);
    });

  } else {
    // SEATS UPRIGHT: REAL AUTOMOTIVE BENCH (Elevated Theater Seating with authentic boot partition backing)
    const rearCushionY = seatCushionY + 2; // e.g. 58 cm
    const benchHeight = Math.max(16, rearCushionY - cabinFloorY - 5);
    const benchLen = 44;
    const cushionCenterX = rearHingeX - (benchLen / 2) - 1;

    // 1. Lower Cushion Foundation Platform
    const benchBaseGeo = new THREE.BoxGeometry(benchLen, benchHeight, rearSeatWidth - 2);
    const benchBase = new THREE.Mesh(benchBaseGeo, rearBolsterMat);
    benchBase.position.set(cushionCenterX, cabinFloorY + (benchHeight / 2), 0);
    rearSeatGroup.add(benchBase);

    // 2. Sculpted Passenger Bench Top with 3 Passenger Seating Wells
    const benchCushionGeo = new THREE.BoxGeometry(benchLen + 2, 6, rearSeatWidth);
    const benchCushion = new THREE.Mesh(benchCushionGeo, rearSeatMat);
    benchCushion.position.set(cushionCenterX, rearCushionY - 2, 0);
    rearSeatGroup.add(benchCushion);

    // Lateral Thigh Bolsters on outer edges
    [-1, 1].forEach(side => {
      const rBolsterGeo = new THREE.BoxGeometry(benchLen - 2, 5.5, 5.5);
      const rBolster = new THREE.Mesh(rBolsterGeo, rearBolsterMat);
      rBolster.position.set(cushionCenterX, rearCushionY + 1.0, side * ((rearSeatWidth / 2) - 3.2));
      rearSeatGroup.add(rBolster);
    });

    // Thigh support front waterfall curved lip
    const waterfallGeo = new THREE.CylinderGeometry(4.0, 4.0, rearSeatWidth - 4, 16, 1, false, 0, Math.PI / 2);
    const waterfall = new THREE.Mesh(waterfallGeo, rearSeatMat);
    waterfall.rotation.z = Math.PI / 2;
    waterfall.rotation.y = Math.PI / 2;
    waterfall.position.set(cushionCenterX - (benchLen / 2), rearCushionY - 3.0, 0);
    rearSeatGroup.add(waterfall);

    // 3. 60/40 Split Contoured Backrest with 12° natural recline
    const rBackHeight = 54;
    const rBackThick = 9;
    const rBackRecline = -0.14; // Reclines towards rear (+X)
    const rBackBaseX = rearHingeX - 2;
    const rBackBaseY = rearCushionY - 1;
    const rBackX = rBackBaseX + (rBackHeight / 2) * Math.sin(-rBackRecline);
    const rBackY = rBackBaseY + (rBackHeight / 2) * Math.cos(-rBackRecline);

    const split60Width = rearSeatWidth * 0.59;
    const split40Width = rearSeatWidth * 0.39;
    const leftZ = (rearSeatWidth / 2) - (split60Width / 2);
    const rightZ = -(rearSeatWidth / 2) + (split40Width / 2);

    // 60% Left Section (Passenger side)
    const leftBackGeo = new THREE.BoxGeometry(rBackThick, rBackHeight, split60Width);
    const leftBack = new THREE.Mesh(leftBackGeo, rearSeatMat);
    leftBack.position.set(rBackX, rBackY, leftZ);
    leftBack.rotation.z = rBackRecline;
    addCadEdges(leftBack, 0x38bdf8);
    rearSeatGroup.add(leftBack);

    // 40% Right Section (Driver side)
    const rightBackGeo = new THREE.BoxGeometry(rBackThick, rBackHeight, split40Width);
    const rightBack = new THREE.Mesh(rightBackGeo, rearSeatMat);
    rightBack.position.set(rBackX, rBackY, rightZ);
    rightBack.rotation.z = rBackRecline;
    addCadEdges(rightBack, 0x38bdf8);
    rearSeatGroup.add(rightBack);

    // Carpeted Protective Boot-Facing Backing Panels (visible through open boot)
    const leftCarpetGeo = new THREE.BoxGeometry(1.2, rBackHeight - 2, split60Width - 2);
    const leftCarpet = new THREE.Mesh(leftCarpetGeo, carpetBackMat);
    leftCarpet.position.set(rBackX + (rBackThick / 2) + 0.6, rBackY, leftZ);
    leftCarpet.rotation.z = rBackRecline;
    rearSeatGroup.add(leftCarpet);

    const rightCarpetGeo = new THREE.BoxGeometry(1.2, rBackHeight - 2, split40Width - 2);
    const rightCarpet = new THREE.Mesh(rightCarpetGeo, carpetBackMat);
    rightCarpet.position.set(rBackX + (rBackThick / 2) + 0.6, rBackY, rightZ);
    rightCarpet.rotation.z = rBackRecline;
    rearSeatGroup.add(rightCarpet);

    // Center Fold-Down Armrest with Dual Cupholders
    const armrestGeo = new THREE.BoxGeometry(rBackThick + 1.2, rBackHeight * 0.62, 14.5);
    const armrest = new THREE.Mesh(armrestGeo, rearBolsterMat);
    armrest.position.set(rBackX - 0.6, rBackY - 3, 0);
    armrest.rotation.z = rBackRecline;
    rearSeatGroup.add(armrest);

    // Cupholder recesses in armrest
    [-3.2, 3.2].forEach(cz => {
      const cupGeo = new THREE.CylinderGeometry(2.0, 1.8, 1.2, 16);
      const cup = new THREE.Mesh(cupGeo, new THREE.MeshStandardMaterial({ color: 0x060910, roughness: 0.9 }));
      cup.position.set(rBackX - 5.0, rBackY - 2, cz);
      cup.rotation.z = rBackRecline;
      rearSeatGroup.add(cup);
    });

    // 4. Three Ergonomic Headrests (Left, Center Low-Profile, Right) on Chrome Steel Posts
    const rHeadTopY = rBackBaseY + rBackHeight * Math.cos(-rBackRecline);
    const rHeadTopX = rBackBaseX + rBackHeight * Math.sin(-rBackRecline);

    [
      { z: -rearSeatWidth * 0.30, w: 20, h: 12, d: 8.5, center: false },
      { z: 0,                     w: 16, h: 9.5, d: 7.0, center: true },
      { z:  rearSeatWidth * 0.30, w: 20, h: 12, d: 8.5, center: false }
    ].forEach(h => {
      // Dual Chrome Steel Support Posts
      [-3.5, 3.5].forEach(postOffset => {
        const postGeo = new THREE.CylinderGeometry(0.65, 0.65, 5.0, 10);
        const post = new THREE.Mesh(postGeo, chromeMatLocal);
        post.position.set(rHeadTopX - 1.5, rHeadTopY + 1.8, h.z + postOffset);
        post.rotation.z = -0.04;
        rearSeatGroup.add(post);
      });

      // Sculpted Headrest Cushion (naturally upright & forward of seat top)
      const headGeo = new THREE.BoxGeometry(h.d, h.h, h.w);
      const head = new THREE.Mesh(headGeo, rearSeatMat);
      head.position.set(rHeadTopX - 3.0, rHeadTopY + 4.8 + (h.center ? -1.2 : 0), h.z);
      head.rotation.z = -0.02;
      rearSeatGroup.add(head);

      // Front Comfort Contact Pad
      const padGeo = new THREE.BoxGeometry(1.6, h.h - 2, h.w - 2.5);
      const pad = new THREE.Mesh(padGeo, rearBolsterMat);
      pad.position.set(rHeadTopX - 6.0, rHeadTopY + 4.8 + (h.center ? -1.2 : 0), h.z);
      pad.rotation.z = -0.02;
      rearSeatGroup.add(pad);
    });

    // 5. Seatbelt Latch Buckles with Red Push Buttons nestled in seat crease
    const benchY = rearCushionY;
    [-rearSeatWidth * 0.20, rearSeatWidth * 0.20].forEach(bz => {
      const buckleGeo = new THREE.BoxGeometry(2.5, 4.5, 2.8);
      const buckleMat = new THREE.MeshStandardMaterial({ color: 0x090e17, roughness: 0.8 });
      const buckle = new THREE.Mesh(buckleGeo, buckleMat);
      buckle.position.set(rearHingeX - 5, benchY + 2.5, bz);
      buckle.rotation.z = 0.25;
      rearSeatGroup.add(buckle);

      const redBtnGeo = new THREE.BoxGeometry(2.6, 1.2, 2.0);
      const redBtnMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
      const redBtn = new THREE.Mesh(redBtnGeo, redBtnMat);
      redBtn.position.set(rearHingeX - 5.2, benchY + 4.5, bz);
      redBtn.rotation.z = 0.25;
      rearSeatGroup.add(redBtn);
    });

    // 6. Chrome Top-Shoulder Seat Fold Release Handles (outer top shoulders)
    [-rearSeatWidth * 0.42, rearSeatWidth * 0.42].forEach(sz => {
      const handleGeo = new THREE.BoxGeometry(4.0, 1.4, 5.0);
      const handle = new THREE.Mesh(handleGeo, chromeMatLocal);
      handle.position.set(rHeadTopX + 1.0, rHeadTopY - 1.0, sz);
      rearSeatGroup.add(handle);
    });
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

    let boxColor = 0x10b981; // Friendly emerald green
    let edgeColor = 0x059669;
    if (fitResult.status === 'tight') {
      boxColor = 0xf59e0b; // Friendly warm amber
      edgeColor = 0xd97706;
    } else if (fitResult.status === 'angled') {
      boxColor = 0x3b82f6; // Friendly royal sapphire
      edgeColor = 0x2563eb;
    } else if (fitResult.status === 'colliding') {
      boxColor = 0xef4444; // Friendly coral red
      edgeColor = 0xdc2626;
    }

    const boxMat = new THREE.MeshPhysicalMaterial({
      color: boxColor,
      roughness: 0.32,
      metalness: 0.1,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15,
      transparent: true,
      opacity: 0.88
    });

    cargo3DMesh = new THREE.Mesh(boxGeo, boxMat);
    cargo3DMesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.6, linewidth: 2 })
    ));

    // Stowed positions and pivots
    cargoSimulationBaseGroup = new THREE.Group();

    // SLOPE-AWARE SAFE CARGO BOUNDS:
    // In production hatchbacks and estates, the tailgate slopes forward significantly from sill to roof.
    // We calculate the inner surface of the tailgate at the top height of this specific cargo item
    // so items never penetrate the closed rear window!
    const hatchSpanY = Math.max(1, roofTopY - (sillY + 4));
    const slopeRatio = Math.max(0, Math.min(1, rot.h / hatchSpanY));
    const innerTailgateXAtTop = isSaloon
      ? (rearSillX - 2)
      : (rearSillX - ((rearSillX - roofRearX) * slopeRatio));

    // Safe longitudinal boundaries:
    // Rear face (posX + rot.l / 2) must clear inner tailgate glass at cargo top
    // Front face (posX - rot.l / 2) must stay behind front seatbacks / cargo bed front
    const maxSafePosX = (innerTailgateXAtTop - 4) - (rot.l / 2);
    const minSafePosX = cargoBedFrontX + (rot.l / 2) + (seatsFolded ? 4 : 2);

    let defaultPosX;
    if (fitResult.status === 'colliding' && (rot.l > currentFloorLen || (cargoBedFrontX + rot.l) > (innerTailgateXAtTop - 4))) {
      // Stopped by the upright rear seats or front seatbacks, so it visibly sticks out past the rear sill!
      defaultPosX = cargoBedFrontX + (rot.l / 2) + 2;
    } else if (minSafePosX <= maxSafePosX) {
      // Comfortably fits: center stably within the safe clearance zone
      defaultPosX = (minSafePosX + maxSafePosX) / 2;
    } else {
      // Snug fit: position as far forward as possible to maximize tailgate clearance
      defaultPosX = Math.min(maxSafePosX, cargoBedFrontX + (rot.l / 2) + 2);
    }

    if (fitResult.mode === 'pitch') {
      // Propped on seatback: pivot at rear sill floor contact
      const pivot = new THREE.Group();
      const pitchPivotX = Math.min(rearSillX - 6, innerTailgateXAtTop - 4);
      pivot.position.set(pitchPivotX, sillY + 2.5, 0);
      cargo3DMesh.position.set(-(rot.l / 2), rot.h / 2, 0);
      pivot.rotation.z = -(fitResult.angle * Math.PI) / 180;
      pivot.add(cargo3DMesh);
      cargoSimulationBaseGroup.add(pivot);

    } else if (fitResult.mode === 'yaw') {
      // Diagonal corner-to-corner across cargo floor: account for rotated length span
      const rad = (fitResult.angle * Math.PI) / 180;
      const halfExtX = (rot.l / 2) * Math.cos(rad) + (rot.w / 2) * Math.sin(Math.abs(rad));
      const maxYawX = (innerTailgateXAtTop - 4) - halfExtX;
      const minYawX = cargoBedFrontX + halfExtX + (seatsFolded ? 4 : 2);
      const yawPosX = (minYawX <= maxYawX) ? (minYawX + maxYawX) / 2 : maxYawX;
      cargo3DMesh.position.set(yawPosX, sillY + (rot.h / 2) + 2.5, 0);
      cargo3DMesh.rotation.y = rad;
      cargoSimulationBaseGroup.add(cargo3DMesh);

    } else if (fitResult.mode === 'roll') {
      // Banked against sidewall: contact lift keeps bottom corner exactly on floor
      const rad = (fitResult.angle * Math.PI) / 180;
      const contactY = (rot.w / 2) * Math.sin(Math.abs(rad)) + (rot.h / 2) * Math.cos(rad);
      cargo3DMesh.position.set(defaultPosX, sillY + 2.5 + contactY, 0);
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
      const centerPosX = Math.min(defaultPosX, cargoBedFrontX + (rot.l / 2) - 10);
      cargo3DMesh.position.set(centerPosX, sillY + (rot.h / 2) + 2.5, 0);
      cargoSimulationBaseGroup.add(cargo3DMesh);

    } else {
      // Standard Flat or Colliding
      cargo3DMesh.position.set(defaultPosX, sillY + (rot.h / 2) + 2.5, 0);
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