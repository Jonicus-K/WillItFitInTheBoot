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
const tabBtn3d = document.getElementById('tab-btn-3d');
const tabBtn2d = document.getElementById('tab-btn-2d');
const view3dContainer = document.getElementById('view-3d-container');
const view2dContainer = document.getElementById('view-2d-container');
const camButtons = document.querySelectorAll('.cam-btn');

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
    body_type,
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
   THREE.JS 3D INTERACTIVE STUDIO (High-Fidelity Realistic Parametric CAD)
   ========================================================================== */

let fallbackOrbit = {
  isDragging: false,
  prevX: 0,
  prevY: 0,
  radius: 460,
  theta: 0.75,
  phi: 1.15
};

function initThreeStudio() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const width = canvas.parentElement.clientWidth || 600;
  const height = canvas.parentElement.clientHeight || 420;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060a14);

  camera = new THREE.PerspectiveCamera(38, width / height, 1, 5000);
  updateCameraFromSpherical();

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = (Math.PI / 2) + 0.05;
    controls.minDistance = 120;
    controls.maxDistance = 1200;
    controls.target.set(0, 50, 0);
  } else {
    initFallbackControls(canvas);
  }

  const ambientLight = new THREE.AmbientLight(0x2a3e66, 1.6);
  scene.add(ambientLight);

  const keySun = new THREE.DirectionalLight(0xffffff, 1.3);
  keySun.position.set(250, 400, 250);
  scene.add(keySun);

  const fillCyan = new THREE.DirectionalLight(0x38bdf8, 0.9);
  fillCyan.position.set(-250, 200, -200);
  scene.add(fillCyan);

  const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.7);
  rimLight.position.set(0, 200, -350);
  scene.add(rimLight);

  const grid = new THREE.GridHelper(900, 45, 0x1e3a5f, 0x0c1729);
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
    fallbackOrbit.radius = Math.max(140, Math.min(900, fallbackOrbit.radius + e.deltaY * 0.4));
    updateCameraFromSpherical();
  }, { passive: false });
}

function updateCameraFromSpherical() {
  if (!camera) return;
  const sinPhi = Math.sin(fallbackOrbit.phi);
  const cosPhi = Math.cos(fallbackOrbit.phi);
  const sinTheta = Math.sin(fallbackOrbit.theta);
  const cosTheta = Math.cos(fallbackOrbit.theta);

  const targetY = 50;
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
    if (view === 'side') camera.position.set(0, 50, 480);
    else if (view === 'rear') camera.position.set(480, 50, 0);
    else if (view === 'top') camera.position.set(0, 580, 0);
    else camera.position.set(340, 220, 290);
    controls.target.set(0, 50, 0);
    controls.update();
  } else {
    updateCameraFromSpherical();
  }
}

function createWheel3D(radius = 32, width = 22) {
  const wheelGroup = new THREE.Group();

  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 32);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111622,
    roughness: 0.85,
    metalness: 0.1
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.rotation.x = Math.PI / 2;
  wheelGroup.add(tire);

  const rimRingGeo = new THREE.TorusGeometry(radius * 0.72, 2.5, 16, 32);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd8e1ed,
    metalness: 0.92,
    roughness: 0.18
  });
  const rimRing = new THREE.Mesh(rimRingGeo, rimMat);
  wheelGroup.add(rimRing);

  const spokeGeo = new THREE.BoxGeometry(4, radius * 1.35, 3);
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.rotation.z = (i * Math.PI) / 2.5;
    wheelGroup.add(spoke);
  }

  const discGeo = new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, 2, 24);
  const discMat = new THREE.MeshStandardMaterial({ color: 0x8896a6, metalness: 0.9, roughness: 0.25 });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = Math.PI / 2;
  wheelGroup.add(disc);

  const caliperGeo = new THREE.BoxGeometry(8, 14, 5);
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(radius * 0.38, radius * 0.25, 0);
  wheelGroup.add(caliper);

  return wheelGroup;
}

/**
 * Creates front bucket seats with realistic heights guaranteed to fit inside cabin.
 */
function createSeat3D(width = 44, backHeight = 44) {
  const seatGroup = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x121b2b, roughness: 0.75 });

  const cushionGeo = new THREE.BoxGeometry(40, 8, width);
  const cushion = new THREE.Mesh(cushionGeo, seatMat);
  cushion.position.y = 4;
  seatGroup.add(cushion);

  const backGeo = new THREE.BoxGeometry(10, backHeight, width - 4);
  const back = new THREE.Mesh(backGeo, seatMat);
  back.position.set(14, (backHeight / 2) + 4, 0);
  back.rotation.z = 0.1;
  seatGroup.add(back);

  const headrestGeo = new THREE.BoxGeometry(8, 11, 18);
  const headrest = new THREE.Mesh(headrestGeo, seatMat);
  headrest.position.set(18, backHeight + 11, 0);
  seatGroup.add(headrest);

  return seatGroup;
}

/**
 * Main 3D Studio Update: Fixed automotive datum ensures that folding seats
 * NEVER changes vehicle size or causes seats to poke through the roof.
 */
function update3DStudio(car, seatsFolded, fitResult) {
  if (!scene) return;

  if (car3DGroup) scene.remove(car3DGroup);
  if (cargo3DMesh) scene.remove(cargo3DMesh);

  car3DGroup = new THREE.Group();

  const maxFoldedLen = car.floor_length_seats_folded; // Static vehicle constant!
  const currentFloorLen = seatsFolded ? car.floor_length_seats_folded : car.floor_length_seats_up;
  const archW = car.wheel_arch_width;
  const roofH = car.roof_height;
  const bodyType = car.body_type;

  const isSUV = bodyType === 'suv';
  const groundY = 0;
  const sillY = isSUV ? 58 : 46;
  const cabinFloorY = sillY - 16;
  const wheelRadius = isSUV ? 35 : 30;
  const totalCarWidth = Math.max(182, archW + 48);

  // FIXED VEHICLE DATUM: Rear sill is always at X = 0!
  const rearSillX = 0;
  const rearBumperX = rearSillX + 28;
  const frontSeatsX = rearSillX - maxFoldedLen - 30;
  const carFrontX = frontSeatsX - (bodyType === 'estate' ? 180 : 160);
  const frontWheelX = carFrontX + 85;
  const rearWheelX = rearSillX - 35;

  const bodyPaintMat = new THREE.MeshStandardMaterial({
    color: 0x0f213d,
    metalness: 0.88,
    roughness: 0.18,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const bodyWireMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65
  });

  // Parametric Fixed 3D Silhouette by Body Class
  const shape = new THREE.Shape();
  const roofY = sillY + roofH;

  if (bodyType === 'estate') {
    shape.moveTo(carFrontX, sillY - 14);
    shape.lineTo(carFrontX, sillY + 4);
    shape.lineTo(carFrontX + 85, sillY + 14);
    shape.lineTo(frontSeatsX - 10, roofY - 2);
    shape.lineTo(rearSillX - 10, roofY);
    shape.lineTo(rearSillX + 12, roofY - 4);
    shape.lineTo(rearSillX + 2, sillY);
    shape.lineTo(rearBumperX, sillY - 6);
    shape.lineTo(rearBumperX - 8, sillY - 22);
    shape.lineTo(carFrontX + 14, sillY - 22);
    shape.lineTo(carFrontX, sillY - 14);
  } else if (bodyType === 'suv') {
    shape.moveTo(carFrontX, sillY - 12);
    shape.lineTo(carFrontX, sillY + 12);
    shape.lineTo(carFrontX + 80, sillY + 22);
    shape.lineTo(frontSeatsX - 8, roofY);
    shape.lineTo(rearSillX - 12, roofY);
    shape.lineTo(rearSillX + 10, roofY - 8);
    shape.lineTo(rearSillX + 4, sillY);
    shape.lineTo(rearBumperX, sillY - 4);
    shape.lineTo(rearBumperX - 10, sillY - 24);
    shape.lineTo(carFrontX + 16, sillY - 24);
    shape.lineTo(carFrontX, sillY - 12);
  } else if (bodyType === 'saloon') {
    shape.moveTo(carFrontX, sillY - 14);
    shape.lineTo(carFrontX, sillY + 4);
    shape.lineTo(carFrontX + 85, sillY + 14);
    shape.lineTo(frontSeatsX - 10, roofY - 4);
    shape.lineTo(frontSeatsX + 60, roofY - 4);
    shape.lineTo(rearSillX - 45, sillY + 8);
    shape.lineTo(rearSillX + 14, sillY + 7);
    shape.lineTo(rearBumperX, sillY - 4);
    shape.lineTo(rearBumperX - 8, sillY - 22);
    shape.lineTo(carFrontX + 14, sillY - 22);
    shape.lineTo(carFrontX, sillY - 14);
  } else {
    // Hatchback
    shape.moveTo(carFrontX, sillY - 14);
    shape.lineTo(carFrontX, sillY + 4);
    shape.lineTo(carFrontX + 80, sillY + 12);
    shape.lineTo(frontSeatsX - 8, roofY - 2);
    shape.lineTo(rearSillX - 35, roofY - 2);
    shape.lineTo(rearSillX - 15, roofY - 6);
    shape.lineTo(rearSillX + 2, sillY);
    shape.lineTo(rearBumperX, sillY - 6);
    shape.lineTo(rearBumperX - 8, sillY - 22);
    shape.lineTo(carFrontX + 14, sillY - 22);
    shape.lineTo(carFrontX, sillY - 14);
  }

  const extrudeSettings = { depth: totalCarWidth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 2, bevelThickness: 2 };
  const carGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const carMesh = new THREE.Mesh(carGeo, bodyPaintMat);
  carMesh.position.z = -totalCarWidth / 2;

  const carWire = new THREE.LineSegments(new THREE.EdgesGeometry(carGeo), bodyWireMat);
  carWire.position.z = -totalCarWidth / 2;

  car3DGroup.add(carMesh);
  car3DGroup.add(carWire);

  // Roof Rails (Estate & SUV)
  if (bodyType === 'estate' || bodyType === 'suv') {
    const railGeo = new THREE.CylinderGeometry(1.8, 1.8, rearSillX - frontSeatsX + 20, 12);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 });
    
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.rotation.z = Math.PI / 2;
    leftRail.position.set((rearSillX + frontSeatsX) / 2, roofY + 3.5, (totalCarWidth / 2) - 14);
    
    const rightRail = leftRail.clone();
    rightRail.position.z = -(totalCarWidth / 2) + 14;
    
    car3DGroup.add(leftRail);
    car3DGroup.add(rightRail);
  }

  // Wheels
  const wheelZOffset = (totalCarWidth / 2) + 1;
  const wheelY = wheelRadius;

  const wheelPositions = [
    [frontWheelX, wheelY, wheelZOffset],
    [frontWheelX, wheelY, -wheelZOffset],
    [rearWheelX, wheelY, wheelZOffset],
    [rearWheelX, wheelY, -wheelZOffset]
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheel = createWheel3D(wheelRadius, 24);
    wheel.position.set(wx, wy, wz);
    if (wz < 0) wheel.rotation.y = Math.PI;
    car3DGroup.add(wheel);
  });

  // Headlights & Tail Light
  const headGeo = new THREE.BoxGeometry(6, 8, 28);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.5,
    roughness: 0.2
  });
  const leftHead = new THREE.Mesh(headGeo, headMat);
  leftHead.position.set(carFrontX + 4, sillY + 3, (totalCarWidth / 2) - 22);
  const rightHead = leftHead.clone();
  rightHead.position.z = -((totalCarWidth / 2) - 22);
  car3DGroup.add(leftHead);
  car3DGroup.add(rightHead);

  const tailGeo = new THREE.BoxGeometry(6, 6, totalCarWidth - 36);
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 1.8,
    roughness: 0.2
  });
  const tailLight = new THREE.Mesh(tailGeo, tailMat);
  tailLight.position.set(rearBumperX - 2, sillY + 2, 0);
  car3DGroup.add(tailLight);

  // Front Bucket Seats (Positioned on lowered cabin floor, headrest well below roof)
  const seatZOffset = (totalCarWidth / 4) - 6;
  const driverSeat = createSeat3D(44, 44);
  driverSeat.position.set(frontSeatsX, cabinFloorY, seatZOffset);
  const passSeat = createSeat3D(44, 44);
  passSeat.position.set(frontSeatsX, cabinFloorY, -seatZOffset);
  car3DGroup.add(driverSeat);
  car3DGroup.add(passSeat);

  // Dynamic Folding Rear Seat Bench
  const rearSeatGroup = new THREE.Group();
  const rearSeatMat = new THREE.MeshStandardMaterial({ color: 0x111b2b, roughness: 0.75 });
  const rearHingeX = rearSillX - car.floor_length_seats_up;

  if (seatsFolded) {
    // Folded flat on cargo floor
    const foldedGeo = new THREE.BoxGeometry(50, 8, archW + 10);
    const foldedMesh = new THREE.Mesh(foldedGeo, rearSeatMat);
    foldedMesh.position.set(rearHingeX - 25, sillY + 4, 0);
    rearSeatGroup.add(foldedMesh);
  } else {
    // Upright rear bench (backrest stays well below roofline)
    const benchBaseGeo = new THREE.BoxGeometry(38, 8, archW + 10);
    const benchBase = new THREE.Mesh(benchBaseGeo, rearSeatMat);
    benchBase.position.set(rearHingeX + 16, sillY + 4, 0);
    rearSeatGroup.add(benchBase);

    const benchBackGeo = new THREE.BoxGeometry(10, 44, archW + 8);
    const benchBack = new THREE.Mesh(benchBackGeo, rearSeatMat);
    benchBack.position.set(rearHingeX + 2, sillY + 22, 0);
    benchBack.rotation.z = -0.12;
    rearSeatGroup.add(benchBack);
  }
  car3DGroup.add(rearSeatGroup);

  // Boot Cargo Floor Surface
  const bootFloorGeo = new THREE.BoxGeometry(currentFloorLen, 2.5, archW);
  const bootFloorMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.3,
    transparent: true,
    opacity: 0.65
  });
  const bootFloorMesh = new THREE.Mesh(bootFloorGeo, bootFloorMat);
  bootFloorMesh.position.set(rearSillX - (currentFloorLen / 2), sillY + 1.25, 0);
  bootFloorMesh.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(bootFloorGeo),
    new THREE.LineBasicMaterial({ color: 0x38bdf8 })
  ));
  car3DGroup.add(bootFloorMesh);

  // Wheel Arch Covers
  const archThick = (totalCarWidth - archW) / 2;
  const archBoxGeo = new THREE.BoxGeometry(54, 20, archThick);
  const archBoxMat = new THREE.MeshStandardMaterial({ color: 0x0a1324, roughness: 0.8 });
  
  const leftArchBox = new THREE.Mesh(archBoxGeo, archBoxMat);
  leftArchBox.position.set(rearWheelX, sillY + 10, (archW / 2) + (archThick / 2));
  const rightArchBox = leftArchBox.clone();
  rightArchBox.position.z = -leftArchBox.position.z;
  car3DGroup.add(leftArchBox);
  car3DGroup.add(rightArchBox);

  // Ground Ambient Occlusion Plate
  const shadowGeo = new THREE.PlaneGeometry(rearBumperX - carFrontX + 40, totalCarWidth + 30);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x02050b, transparent: true, opacity: 0.75 });
  const shadowPlate = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlate.rotation.x = -Math.PI / 2;
  shadowPlate.position.set((carFrontX + rearBumperX) / 2, groundY + 0.2, 0);
  car3DGroup.add(shadowPlate);

  scene.add(car3DGroup);

  // Physical Cargo Box (Positioned cleanly relative to rear sill)
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
      opacity: 0.75
    });

    cargo3DMesh = new THREE.Mesh(boxGeo, boxMat);
    cargo3DMesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 2 })
    ));

    if (fitResult.mode === 'pitch') {
      // Propped on seatback: Pivot at rear sill and pitch front edge UPWARDS
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
      // Flat orthogonal placement
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