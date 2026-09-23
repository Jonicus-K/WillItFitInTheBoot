/**
 * Will It Fit In The Boot?
 * Pure client-side spatial rotation, 4-gate constraint, dual angled solver,
 * interactive Three.js 3D Studio with GLTF streaming, and CAD 2D blueprints.
 */

const defaultCars = [
  {
    id: "vw-golf-mk8",
    name: "Volkswagen Golf (Mk8, 2020+)",
    body_type: "hatchback",
    model_url: null,
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
    model_url: null,
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
    model_url: null,
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
    model_url: null,
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
    model_url: null,
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
    model_url: null,
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
    model_url: null,
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
    model_url: null,
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
const tabBtn2d = document.getElementById('tab-btn-2d');
const tabBtn3d = document.getElementById('tab-btn-3d');
const view2dContainer = document.getElementById('view-2d-container');
const view3dContainer = document.getElementById('view-3d-container');
const camButtons = document.querySelectorAll('.cam-btn[data-view]');

// Three.js State
let scene, camera, renderer, controls;
let car3DGroup = null;
let cargo3DMesh = null;
const gltfLoader = (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') ? new THREE.GLTFLoader() : null;

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
    model_url: raw.model_url || raw.modelUrl || null,
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

  tabBtn2d.addEventListener('click', () => {
    tabBtn2d.classList.add('active');
    tabBtn3d.classList.remove('active');
    view2dContainer.classList.add('active');
    view3dContainer.classList.remove('active');
  });

  tabBtn3d.addEventListener('click', () => {
    tabBtn3d.classList.add('active');
    tabBtn2d.classList.remove('active');
    view3dContainer.classList.add('active');
    view2dContainer.classList.remove('active');
    onWindowResize();
  });

  camButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      camButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      snapCamera(btn.dataset.view);
    });
  });

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
   THREE.JS 3D STUDIO (GLTF Model Streaming + Clean CAD Bay Fallback)
   ========================================================================== */

let fallbackOrbit = {
  isDragging: false,
  prevX: 0,
  prevY: 0,
  radius: 260,
  theta: 0.75,
  phi: 1.15
};

function initThreeStudio() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const width = canvas.parentElement.clientWidth || 600;
  const height = canvas.parentElement.clientHeight || 480;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060a14);

  camera = new THREE.PerspectiveCamera(36, width / height, 1, 5000);
  updateCameraFromSpherical();

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = (Math.PI / 2) + 0.04;
    controls.minDistance = 60;
    controls.maxDistance = 600;
    controls.target.set(0, 32, 0);
  } else {
    initFallbackControls(canvas);
  }

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x334466, 1.8);
  scene.add(ambientLight);

  const mainSun = new THREE.DirectionalLight(0xffffff, 1.8);
  mainSun.position.set(200, 350, 200);
  scene.add(mainSun);

  const cyanRim = new THREE.DirectionalLight(0x38bdf8, 1.2);
  cyanRim.position.set(-200, 180, -200);
  scene.add(cyanRim);

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
    fallbackOrbit.radius = Math.max(60, Math.min(500, fallbackOrbit.radius + e.deltaY * 0.3));
    updateCameraFromSpherical();
  }, { passive: false });
}

function updateCameraFromSpherical() {
  if (!camera) return;
  const sinPhi = Math.sin(fallbackOrbit.phi);
  const cosPhi = Math.cos(fallbackOrbit.phi);
  const sinTheta = Math.sin(fallbackOrbit.theta);
  const cosTheta = Math.cos(fallbackOrbit.theta);

  const targetY = 32;
  camera.position.x = fallbackOrbit.radius * sinPhi * cosTheta;
  camera.position.y = targetY + (fallbackOrbit.radius * cosPhi);
  camera.position.z = fallbackOrbit.radius * sinPhi * sinTheta;
  camera.lookAt(0, targetY, 0);
}

function animateThree() {
  requestAnimationFrame(animateThree);
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
    fallbackOrbit.theta = 0.75;
    fallbackOrbit.phi = 1.15;
  }

  if (controls) {
    if (view === 'side') camera.position.set(0, 32, 280);
    else if (view === 'rear') camera.position.set(280, 32, 0);
    else if (view === 'top') camera.position.set(0, 320, 0);
    else camera.position.set(170, 105, 150);
    controls.target.set(0, 32, 0);
    controls.update();
  } else {
    updateCameraFromSpherical();
  }
}

/**
 * 3D Studio Update: Streams external .glb models via CDN if model_url is present,
 * or displays a clean CAD cargo envelope platform.
 */
function update3DStudio(car, seatsFolded, fitResult) {
  if (!scene) return;

  if (car3DGroup) scene.remove(car3DGroup);
  if (cargo3DMesh) scene.remove(cargo3DMesh);

  car3DGroup = new THREE.Group();

  const currentFloorLen = seatsFolded ? car.floor_length_seats_folded : car.floor_length_seats_up;
  const archW = car.wheel_arch_width;
  const roofH = car.roof_height;
  const sillY = 35;
  const rearSillX = 0;

  // Check if an external .glb model URL is defined for this car
  if (car.model_url && gltfLoader) {
    gltfLoader.load(
      car.model_url,
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 0.45;
            child.material.depthWrite = false;
          }
        });
        car3DGroup.add(model);
      },
      undefined,
      () => buildCadPlatform()
    );
  } else {
    buildCadPlatform();
  }

  function buildCadPlatform() {
    // Usable Cargo Floor Surface
    const floorGeo = new THREE.BoxGeometry(currentFloorLen, 3, archW);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(rearSillX - (currentFloorLen / 2), sillY + 1.5, 0);
    floorMesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(floorGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8 })
    ));
    car3DGroup.add(floorMesh);

    // Wheel Arch Intrusions
    const archBoxGeo = new THREE.BoxGeometry(45, 20, 16);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x111c2e, roughness: 0.8 });
    const leftArch = new THREE.Mesh(archBoxGeo, archMat);
    leftArch.position.set(rearSillX - 35, sillY + 10, (archW / 2) + 8);
    const rightArch = leftArch.clone();
    rightArch.position.z = -((archW / 2) + 8);
    car3DGroup.add(leftArch);
    car3DGroup.add(rightArch);

    // Front Seat Divider / Folded Bench
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x152238, roughness: 0.8 });
    if (seatsFolded) {
      const foldedGeo = new THREE.BoxGeometry(45, 8, archW + 12);
      const foldedMesh = new THREE.Mesh(foldedGeo, seatMat);
      foldedMesh.position.set(rearSillX - car.floor_length_seats_up - 22, sillY + 4, 0);
      car3DGroup.add(foldedMesh);
    } else {
      const benchGeo = new THREE.BoxGeometry(12, 38, archW + 10);
      const bench = new THREE.Mesh(benchGeo, seatMat);
      bench.position.set(rearSillX - car.floor_length_seats_up - 6, sillY + 19, 0);
      car3DGroup.add(bench);
    }

    // Rear Aperture Hatch Frame Indicator
    const apShape = new THREE.Shape();
    const apW = car.aperture_width;
    const apH = car.aperture_height;
    apShape.moveTo(-apW / 2, 0);
    apShape.lineTo(apW / 2, 0);
    apShape.lineTo(apW / 2, apH);
    apShape.lineTo(-apW / 2, apH);
    apShape.lineTo(-apW / 2, 0);

    const apPoints = apShape.getPoints();
    const apGeo = new THREE.BufferGeometry().setFromPoints(apPoints.map(p => new THREE.Vector3(0, p.y + sillY, p.x)));
    const apLine = new THREE.Line(apGeo, new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 4, gapSize: 3 }));
    apLine.computeLineDistances();
    car3DGroup.add(apLine);

    // Shadow Plate
    const shadowGeo = new THREE.PlaneGeometry(currentFloorLen + 60, archW + 60);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x02050b, transparent: true, opacity: 0.65 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(rearSillX - (currentFloorLen / 2), 0.1, 0);
    car3DGroup.add(shadow);
  }

  scene.add(car3DGroup);

  // 3D Cargo Payload Render
  if (fitResult && fitResult.rot) {
    const rot = fitResult.rot;
    const boxGeo = new THREE.BoxGeometry(rot.l, rot.h, rot.w);

    let boxColor = 0x22c55e;
    let edgeColor = 0x4ade80;
    if (fitResult.status === 'tight') {
      boxColor = 0xf59e0b;
      edgeColor = 0xfbbf24;
    } else if (fitResult.status === 'angled') {
      boxColor = 0x0284c7;
      edgeColor = 0x38bdf8;
    } else if (fitResult.status === 'colliding') {
      boxColor = 0xef4444;
      edgeColor = 0xf87171;
    }

    const boxMat = new THREE.MeshStandardMaterial({
      color: boxColor,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8
    });

    cargo3DMesh = new THREE.Mesh(boxGeo, boxMat);
    cargo3DMesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 2 })
    ));

    if (fitResult.mode === 'pitch') {
      const pivot = new THREE.Group();
      pivot.position.set(rearSillX - 4, sillY + 3, 0);
      cargo3DMesh.position.set(-(rot.l / 2), rot.h / 2, 0);
      pivot.rotation.z = -(fitResult.angle * Math.PI) / 180;
      pivot.add(cargo3DMesh);
      scene.add(pivot);
      cargo3DMesh = pivot;
    } else if (fitResult.mode === 'yaw') {
      cargo3DMesh.position.set(rearSillX - (rot.l / 2) - 4, sillY + (rot.h / 2) + 3, 0);
      cargo3DMesh.rotation.y = (fitResult.angle * Math.PI) / 180;
      scene.add(cargo3DMesh);
    } else {
      const posX = rearSillX - (rot.l / 2) - 4;
      cargo3DMesh.position.set(posX, sillY + (rot.h / 2) + 3, 0);
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

  // 2D Chassis Silhouette (Static for this vehicle model)
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