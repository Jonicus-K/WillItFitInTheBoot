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

// 1. Fetch Vehicle Data
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
    statusMessage.textContent = "Failed to load cars.json. Check path & permissions.";
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

// 2. Generate all unique 6 orientations of an orthogonal box
function getOrientations(l, w, h) {
  const perms = [
    [l, w, h], [l, h, w],
    [w, l, h], [w, h, l],
    [h, l, w], [h, w, l]
  ];
  // Filter duplicates
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

// 3. Core Geometric Evaluation
function calculateFit() {
  const selectedCar = carsData.find(c => c.id === carSelect.value);
  if (!selectedCar) return;

  const itemL = parseFloat(inputL.value) || 0;
  const itemW = parseFloat(inputW.value) || 0;
  const itemH = parseFloat(inputH.value) || 0;

  if (itemL <= 0 || itemW <= 0 || itemH <= 0) {
    statusBadge.className = "badge badge-neutral";
    statusBadge.textContent = "Enter Dimensions";
    statusMessage.textContent = "Please provide positive values for length, width, and height.";
    carSpecs.style.display = "none";
    return;
  }

  const seatsMode = seatsDownCheck.checked ? "seats_down" : "seats_up";
  const boot = selectedCar.boot[seatsMode];
  const aperture = selectedCar.boot.aperture;

  // Display vehicle spec details
  carSpecs.style.display = "block";
  specsList.innerHTML = `
    <li>Floor length: ${boot.floor_length_cm} cm (${seatsDownCheck.checked ? "seats down" : "seats up"})</li>
    <li>Min width between arches: ${boot.min_width_cm} cm</li>
    <li>Boot max height: ${boot.max_height_cm} cm</li>
    <li>Tailgate opening: ${aperture.width_cm} cm × ${aperture.height_cm} cm</li>
  `;

  const orientations = getOrientations(itemL, itemW, itemH);
  let bestFit = null;
  let failureReasons = [];

  for (const ori of orientations) {
    const { length: oL, width: oW, height: oH } = ori;

    // Check 1: Tailgate Aperture
    // Can this box profile pass through the opening? (Cross section can enter right-side up or turned 90 deg)
    const canEnterAperture = 
      (oW <= aperture.width_cm && oH <= aperture.height_cm) ||
      (oH <= aperture.width_cm && oW <= aperture.height_cm);

    if (!canEnterAperture) {
      failureReasons.push(`Too bulky to pass through the ${aperture.width_cm}×${aperture.height_cm} cm tailgate opening.`);
      continue;
    }

    // Check 2: Boot Floor Width
    if (oW > boot.min_width_cm) {
      failureReasons.push(`Width (${oW} cm) exceeds wheel arch clearance (${boot.min_width_cm} cm).`);
      continue;
    }

    // Check 3: Max Boot Height
    if (oH > boot.max_height_cm) {
      failureReasons.push(`Height (${oH} cm) exceeds boot roof height (${boot.max_height_cm} cm).`);
      continue;
    }

    // Check 4: Slope / Rake Clearance
    // Top rear edge hits the sloping rear glass if length at height H exceeds available length
    const rad = (boot.rake_angle_deg * Math.PI) / 180;
    const lengthLossAtHeight = oH * Math.tan(rad);
    const usableLengthAtHeight = boot.floor_length_cm - lengthLossAtHeight;

    if (oL > usableLengthAtHeight) {
      if (oL <= boot.floor_length_cm) {
        failureReasons.push(`Fits floor length (${boot.floor_length_cm} cm), but hits the sloping rear windscreen.`);
      } else {
        failureReasons.push(`Length (${oL} cm) exceeds boot floor length (${boot.floor_length_cm} cm).`);
      }
      continue;
    }

    // If it passed all tests, calculate clearance margin
    const marginL = usableLengthAtHeight - oL;
    const marginW = boot.min_width_cm - oW;
    const marginH = boot.max_height_cm - oH;
    const minMargin = Math.min(marginL, marginW, marginH);

    bestFit = {
      orientation: ori,
      minMargin: minMargin
    };
    break; // Found an orientation that fits
  }

  if (bestFit) {
    const { length, width, height } = bestFit.orientation;
    if (bestFit.minMargin >= 4) {
      statusBadge.className = "badge badge-success";
      statusBadge.textContent = "Fits Comfortably";
      statusMessage.textContent = `Will fit when loaded as: ${length} cm (front-to-back) × ${width} cm (wide) × ${height} cm (high). You have at least ${Math.round(bestFit.minMargin)} cm clearance remaining on all sides.`;
    } else {
      statusBadge.className = "badge badge-warning";
      statusBadge.textContent = "Tight Fit";
      statusMessage.textContent = `It will fit, but it is very tight (under ${Math.max(1, Math.round(bestFit.minMargin))} cm clearance). You may need to slide or angle it in carefully.`;
    }
  } else {
    statusBadge.className = "badge badge-danger";
    statusBadge.textContent = "Will Not Fit";
    statusMessage.textContent = failureReasons[0] || "Dimensions exceed the vehicle's internal cargo capacity.";
  }
}

// 4. Listeners
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
