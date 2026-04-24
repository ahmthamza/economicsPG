// Macro models — Taylor rule, Phillips curve, simple IS-LM-style propagation,
// Quantity Theory of Money, simple FX (UIP), Okun's law.

// ----- Taylor rule -----
// i = r* + π + 0.5(π - π*) + 0.5(y - y*)
function taylorRate({ rStar = 0.5, piStar = 2.0, pi, output_gap, phiPi = 0.5, phiY = 0.5 }) {
  return rStar + pi + phiPi * (pi - piStar) + phiY * output_gap;
}

// ----- Phillips curve (expectations-augmented) -----
// π = π_e - β(u - u*) + ε
function phillipsInflation({ piExpected = 2.0, u, uNatural = 4.5, beta = 0.5, supply_shock = 0 }) {
  return piExpected - beta * (u - uNatural) + supply_shock;
}

// ----- Okun's law (gap form) -----
// y - y* ≈ -k (u - u*)
function okunGap({ u, uNatural = 4.5, k = 2.0 }) {
  return -k * (u - uNatural);
}

// ----- Quantity theory of money -----
// MV = PY → π ≈ ΔM + ΔV - ΔY
function quantityInflation({ dM = 5, dV = 0, dY = 2 }) {
  return dM + dV - dY;
}

// ----- IS curve (output gap responds to real rate gap) -----
// y_t = ρ y_{t-1} - α (i_{t-1} - π_t - r*) + demand_shock
function isOutput({ y_prev, i_prev, pi, rStar = 0.5, alpha = 0.6, rho = 0.7, demand = 0 }) {
  const realRate = i_prev - pi;
  return rho * y_prev - alpha * (realRate - rStar) + demand;
}

// ----- Multi-period propagation -----
// Run a small interconnected model for N years
// Inputs: policyRule (function returning policy rate from state), shocks, params
function simulate({
  N = 16,
  rStar = 0.5,
  piStar = 2.0,
  uNatural = 4.5,
  alpha = 0.6,            // IS slope (rate sensitivity)
  rho = 0.6,              // output persistence
  beta = 0.5,             // Phillips slope
  k = 2.0,                // Okun
  phiPi = 0.5, phiY = 0.5,
  expectAdapt = 0.6,      // expectation adaptation
  supplyShock = [],       // array length N (πs added to inflation each period)
  demandShock = [],       // array length N
  policy = "taylor",      // "taylor" | "fixed" | "raw"
  fixedRate = 2.0,
  initial = { pi: 2.0, u: 4.5, y_gap: 0, i: 2.0, pi_e: 2.0 },
} = {}) {
  const out = [];
  let pi = initial.pi, u = initial.u, y_gap = initial.y_gap, i = initial.i, pi_e = initial.pi_e;
  for (let t = 0; t < N; t++) {
    const ss = supplyShock[t] || 0;
    const ds = demandShock[t] || 0;

    // 1. inflation expectations adapt
    pi_e = expectAdapt * pi + (1 - expectAdapt) * piStar;

    // 2. output evolves from last period's real rate
    const i_prev = out.length ? out[out.length - 1].i : i;
    const pi_prev = out.length ? out[out.length - 1].pi : pi;
    y_gap = rho * y_gap - alpha * ((i_prev - pi_prev) - rStar) + ds;

    // 3. unemployment from output (Okun)
    u = uNatural - y_gap / k;

    // 4. inflation from Phillips + supply shock
    pi = pi_e - beta * (u - uNatural) + ss;

    // 5. policy reaction
    if (policy === "taylor") {
      i = taylorRate({ rStar, piStar, pi, output_gap: y_gap, phiPi, phiY });
    } else if (policy === "fixed") {
      i = fixedRate;
    }
    i = Math.max(-0.5, i); // ELB floor

    out.push({ t, pi: +pi.toFixed(3), u: +u.toFixed(3), y_gap: +y_gap.toFixed(3), i: +i.toFixed(3), pi_e: +pi_e.toFixed(3) });
  }
  return out;
}

Object.assign(window, { taylorRate, phillipsInflation, okunGap, quantityInflation, isOutput, simulate });
