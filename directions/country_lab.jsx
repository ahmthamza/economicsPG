// Country Lab — real-data calibrated what-if for any country/year.
// Baseline = actual history. Counterfactual = model run from branch year,
// calibrated to country's recent means.

const { useState: useStateCL, useMemo: useMemoCL } = React;

// ---- calibration: pull last-5y means from real data ----
function calibrateCountry(code) {
  const cpi = MACRO_DATA.cpi[code];
  const une = MACRO_DATA.unemployment[code];
  const rate = MACRO_DATA.policyRate[code];
  const gdp = MACRO_DATA.gdpGrowth[code];

  const meanLastN = (series, n = 5) => {
    const vals = series.filter(d => d.value != null).slice(-n).map(d => d.value);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const meanAll = (series) => {
    const vals = series.filter(d => d.value != null).map(d => d.value);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const piStar = meanAll(cpi) ?? 2;     // long-run mean inflation proxy
  const uNatural = meanAll(une) ?? 5;   // long-run mean unemployment proxy
  const rStar = Math.max(0, (meanLastN(rate, 10) ?? 2) - (meanLastN(cpi, 10) ?? piStar)); // real rate

  return {
    piStar: +piStar.toFixed(2),
    uNatural: +uNatural.toFixed(2),
    rStar: +rStar.toFixed(2),
  };
}

// Build the baseline (= actuals) and counterfactual for a country starting at branchYear
function runCountryWhatIf({ code, branchYear, policyOverride, supplyShock, demandShock }) {
  const Y = MACRO_DATA.YEARS;
  const branchIdx = Y.indexOf(branchYear);
  if (branchIdx < 0) return null;

  const calib = calibrateCountry(code);
  const cpi = MACRO_DATA.cpi[code];
  const une = MACRO_DATA.unemployment[code];
  const rate = MACRO_DATA.policyRate[code];
  const gdp = MACRO_DATA.gdpGrowth[code];

  const pickVal = (arr, idx) => {
    // walk back to find nearest non-null
    for (let i = idx; i >= 0; i--) if (arr[i]?.value != null) return arr[i].value;
    return null;
  };

  const pi0 = pickVal(cpi, branchIdx) ?? calib.piStar;
  const u0  = pickVal(une, branchIdx) ?? calib.uNatural;
  const i0  = pickVal(rate, branchIdx) ?? (calib.piStar + calib.rStar);
  const g0  = pickVal(gdp, branchIdx) ?? 0;
  const pi_e0 = pickVal(cpi, Math.max(0, branchIdx - 1)) ?? pi0;
  const initial = { pi: pi0, u: u0, y_gap: 0, i: i0, pi_e: pi_e0 };

  const N = Y.length - branchIdx;

  // Trim shocks to N
  const ss = (supplyShock || []).slice(0, N).concat(Array(Math.max(0, N - (supplyShock?.length || 0))).fill(0));
  const ds = (demandShock || []).slice(0, N).concat(Array(Math.max(0, N - (demandShock?.length || 0))).fill(0));

  // Policy override: "taylor" | "fixed" | "+x" | "-x" (offset from historical path)
  let simArgs = {
    N,
    rStar: calib.rStar, piStar: calib.piStar, uNatural: calib.uNatural,
    supplyShock: ss, demandShock: ds,
    initial,
  };
  if (policyOverride.mode === "taylor") {
    simArgs = { ...simArgs, policy: "taylor", phiPi: policyOverride.phiPi, phiY: policyOverride.phiY };
  } else if (policyOverride.mode === "fixed") {
    simArgs = { ...simArgs, policy: "fixed", fixedRate: policyOverride.fixedRate };
  } else {
    // offset: hold rate = initial + offset per period
    simArgs = { ...simArgs, policy: "fixed", fixedRate: i0 + (policyOverride.offset || 0) };
  }

  const cf = simulate(simArgs);

  // Actual series, aligned on year axis:
  const actual = {
    pi: cpi.map(d => ({ x: d.year, y: d.value })),
    u:  une.map(d => ({ x: d.year, y: d.value })),
    i:  rate.map(d => ({ x: d.year, y: d.value })),
    gdp: gdp.map(d => ({ x: d.year, y: d.value })),
  };

  const cfYearSeries = {
    pi: cf.map((d, i) => ({ x: Y[branchIdx + i], y: d.pi })),
    u:  cf.map((d, i) => ({ x: Y[branchIdx + i], y: d.u })),
    i:  cf.map((d, i) => ({ x: Y[branchIdx + i], y: d.i })),
    y_gap: cf.map((d, i) => ({ x: Y[branchIdx + i], y: d.y_gap })),
    // gdp growth ≈ change in y_gap plus trend. Rough proxy:
    gdp: cf.map((d, i) => ({ x: Y[branchIdx + i], y: +(2 + d.y_gap * 0.5).toFixed(2) })),
  };

  return { calib, actual, counterfactual: cfYearSeries, branchIdx, branchYear, N };
}

// ---- variable definitions ----
const VARS = {
  pi:  { label: "Inflation π",      unit: "%",  color: "oklch(0.55 0.18 25)",  target: null },
  u:   { label: "Unemployment u",   unit: "%",  color: "oklch(0.55 0.15 250)", target: null },
  i:   { label: "Policy rate i",    unit: "%",  color: "oklch(0.55 0.13 145)", target: null },
  gdp: { label: "GDP growth",       unit: "%",  color: "oklch(0.55 0.17 320)", target: null },
};

// ---- main view ----
function CountryLabView() {
  const [country, setCountry]       = useStateCL("US");
  const [branchYear, setBranchYear] = useStateCL(2008);
  const [activeVars, setActiveVars] = useStateCL(["pi", "i"]);
  const [viewMode, setViewMode]     = useStateCL("overlay"); // "overlay" | "split" | "delta"

  // policy override
  const [polMode, setPolMode]   = useStateCL("fixed");  // "fixed" | "offset" | "taylor"
  const [fixedRate, setFixedRate] = useStateCL(2.0);
  const [offset, setOffset]     = useStateCL(0);
  const [phiPi, setPhiPi]       = useStateCL(0.5);
  const [phiY, setPhiY]         = useStateCL(0.5);

  // shock timelines — length = YEARS.length - branchIdx (max 35)
  const maxN = 35;
  const [supplyShock, setSupplyShock] = useStateCL(() => arrCL(0, maxN));
  const [demandShock, setDemandShock] = useStateCL(() => arrCL(0, maxN));

  const result = useMemoCL(() => runCountryWhatIf({
    code: country, branchYear,
    policyOverride: { mode: polMode, fixedRate, offset, phiPi, phiY },
    supplyShock, demandShock,
  }), [country, branchYear, polMode, fixedRate, offset, phiPi, phiY, supplyShock, demandShock]);

  if (!result) return <div style={{ padding: 36 }}>No data for this country.</div>;

  const meta = MACRO_DATA.COUNTRIES[country];
  const { calib } = result;

  function toggleVar(v) {
    setActiveVars(prev => prev.includes(v)
      ? (prev.length > 1 ? prev.filter(x => x !== v) : prev)
      : [...prev, v]);
  }

  return (
    <div style={{ padding: 36 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "#3a3530", margin: 0, maxWidth: 720,
                    fontFamily: "'IBM Plex Serif', Georgia, serif", lineHeight: 1.5 }}>
          Country Lab: pick any economy and any year. Before the branch, the chart shows
          what actually happened. From the branch year forward, the model runs your
          counterfactual — calibrated to this country's own recent averages.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
        {/* ---- LEFT: controls ---- */}
        <div>
          <SectionLabel>Economy</SectionLabel>
          <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 14 }}>
            <CountryPicker selected={[country]} onChange={c => setCountry(c[0])}
                           multi={false} requireMetric="cpi" />
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f0ece2",
                          fontSize: 10, color: "#8a8474",
                          fontFamily: "JetBrains Mono, monospace",
                          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              <div>π* ≈ <b style={{color:"#3a3530"}}>{calib.piStar}%</b></div>
              <div>u* ≈ <b style={{color:"#3a3530"}}>{calib.uNatural}%</b></div>
              <div>r* ≈ <b style={{color:"#3a3530"}}>{calib.rStar}%</b></div>
              <div>{meta.name}</div>
            </div>
          </div>

          <SectionLabel style={{ marginTop: 20 }}>Branch year</SectionLabel>
          <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 14 }}>
            <Slider label="Counterfactual starts at"
                    min={1995} max={2022} step={1}
                    value={branchYear} onChange={setBranchYear} />
          </div>

          <SectionLabel style={{ marginTop: 20 }}>Policy from branch year</SectionLabel>
          <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 14 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {[
                { id: "fixed",  label: "Fixed rate" },
                { id: "offset", label: "Offset" },
                { id: "taylor", label: "Taylor" },
              ].map(o => (
                <button key={o.id} onClick={() => setPolMode(o.id)}
                  style={{ flex: 1, padding: "6px 0", border: "1px solid #0e1116",
                           background: polMode === o.id ? "#0e1116" : "#fff",
                           color: polMode === o.id ? "#fafaf7" : "#0e1116",
                           fontSize: 10, cursor: "pointer",
                           fontFamily: "Inter, sans-serif" }}>{o.label}</button>
              ))}
            </div>
            {polMode === "fixed" && (
              <Slider label="Hold rate at" min={-1} max={30} step={0.25} unit="%"
                      value={fixedRate} onChange={setFixedRate} />
            )}
            {polMode === "offset" && (
              <Slider label="vs. historical (pp)" min={-10} max={10} step={0.25} unit="pp"
                      value={offset} onChange={setOffset} />
            )}
            {polMode === "taylor" && (
              <>
                <Slider label="φπ" min={0} max={2.5} step={0.1} value={phiPi} onChange={setPhiPi} />
                <Slider label="φy" min={0} max={2} step={0.1} value={phiY} onChange={setPhiY} />
              </>
            )}
          </div>

          <SectionLabel style={{ marginTop: 20 }}>Shocks (optional)</SectionLabel>
          <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 14 }}>
            <MiniShock label="Supply" color="oklch(0.55 0.18 25)"
                       values={supplyShock.slice(0, result.N)}
                       onChange={(v) => {
                         const next = supplyShock.slice();
                         for (let i = 0; i < v.length; i++) next[i] = v[i];
                         setSupplyShock(next);
                       }}
                       range={[-4, 10]} startYear={branchYear} />
            <div style={{ height: 10 }} />
            <MiniShock label="Demand" color="oklch(0.55 0.13 220)"
                       values={demandShock.slice(0, result.N)}
                       onChange={(v) => {
                         const next = demandShock.slice();
                         for (let i = 0; i < v.length; i++) next[i] = v[i];
                         setDemandShock(next);
                       }}
                       range={[-6, 6]} startYear={branchYear} />
          </div>

          <SectionLabel style={{ marginTop: 20 }}>Variables</SectionLabel>
          <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 10,
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {Object.entries(VARS).map(([k, v]) => (
              <button key={k} onClick={() => toggleVar(k)}
                style={{ padding: "6px 8px", border: "1px solid",
                         borderColor: activeVars.includes(k) ? v.color : "#d8d4cc",
                         background: activeVars.includes(k) ? v.color : "#fff",
                         color: activeVars.includes(k) ? "#fafaf7" : "#0e1116",
                         fontSize: 11, cursor: "pointer",
                         fontFamily: "Inter, sans-serif", textAlign: "left" }}>
                {v.label}
              </button>
            ))}
          </div>

          <SectionLabel style={{ marginTop: 20 }}>View</SectionLabel>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "overlay", label: "Overlay" },
              { id: "split",   label: "Split" },
              { id: "delta",   label: "Δ only" },
            ].map(o => (
              <button key={o.id} onClick={() => setViewMode(o.id)}
                style={{ flex: 1, padding: "8px 0", border: "1px solid #0e1116",
                         background: viewMode === o.id ? "#0e1116" : "#fff",
                         color: viewMode === o.id ? "#fafaf7" : "#0e1116",
                         fontSize: 11, cursor: "pointer",
                         fontFamily: "Inter, sans-serif" }}>{o.label}</button>
            ))}
          </div>
        </div>

        {/* ---- RIGHT: charts ---- */}
        <div>
          <div style={{ display: "grid",
                        gridTemplateColumns: activeVars.length > 1 ? "1fr 1fr" : "1fr",
                        gap: 16 }}>
            {activeVars.map(v => (
              <CountryVarChart key={v} varKey={v} result={result}
                               viewMode={viewMode} />
            ))}
          </div>

          <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e4e0d6",
                        padding: 16 }}>
            <SubLabel>Reading the result</SubLabel>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#3a3530",
                        fontFamily: "'IBM Plex Serif', Georgia, serif", margin: 0 }}>
              {meta.name} — branch year {branchYear}. Before {branchYear},
              the solid line is real World Bank / BIS data. From {branchYear} on,
              the dashed line is the model's path given {" "}
              {polMode === "fixed" ? <>a rate held at <b>{fixedRate.toFixed(2)}%</b></>
                : polMode === "offset" ? <>a rate <b>{offset >= 0 ? "+" : ""}{offset}pp</b> from history</>
                : <>a Taylor rule with <b>φπ={phiPi}</b>, <b>φy={phiY}</b></>}
              {" "}and the shocks you drew. Parameters π*={calib.piStar}%, u*={calib.uNatural}%, r*={calib.rStar}% are this country's own long-run averages.
            </p>
            <p style={{ fontSize: 11, color: "#8a8474", marginTop: 8 }}>
              ⚠ Stylized — no FX/trade channel, expectations adapt slowly, real economies are messier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- var chart: overlay / split / delta ----
function CountryVarChart({ varKey, result, viewMode }) {
  const v = VARS[varKey];
  const actualSeries = result.actual[varKey];
  const cfSeries = result.counterfactual[varKey];
  const branchYear = result.branchYear;

  // Filter real data to only pre-branch for cleaner overlay visuals (keep line continuous through branch)
  // Actually keep full real series so user sees the "true" future too
  if (viewMode === "delta") {
    // delta = cf - actual, aligned by year (only years present in both)
    const actualMap = new Map(actualSeries.map(p => [p.x, p.y]));
    const delta = cfSeries
      .filter(p => actualMap.has(p.x) && actualMap.get(p.x) != null && p.y != null)
      .map(p => ({ x: p.x, y: +(p.y - actualMap.get(p.x)).toFixed(2) }));
    return (
      <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{v.label} — Δ (counterfactual − actual)</div>
        <div style={{ fontSize: 10, color: "#8a8474", marginBottom: 6 }}>
          Positive = counterfactual higher than reality
        </div>
        <LineChart
          series={[{ id: "d", label: "Δ", color: v.color, points: delta }]}
          height={200} zeroLine
          events={[{ x: branchYear, label: "branch" }]} />
      </div>
    );
  }

  if (viewMode === "split") {
    return (
      <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>{v.label}</div>
        <div style={{ fontSize: 10, color: "#0e1116", marginBottom: 2 }}>Actual (history)</div>
        <LineChart
          series={[{ id: "real", label: "Actual", color: "#0e1116", points: actualSeries }]}
          height={100} zeroLine events={[{ x: branchYear, label: "branch" }]} />
        <div style={{ fontSize: 10, color: v.color, marginTop: 8, marginBottom: 2 }}>
          Counterfactual (model)
        </div>
        <LineChart
          series={[{ id: "cf", label: "Counterfactual", color: v.color, points: cfSeries }]}
          height={100} zeroLine events={[{ x: branchYear, label: "branch" }]} />
      </div>
    );
  }

  // overlay
  return (
    <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{v.label}</div>
      <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#8a8474",
                    marginBottom: 6 }}>
        <span><span style={{ display: "inline-block", width: 8, height: 2,
                             background: "#0e1116", marginRight: 4, verticalAlign: "middle" }} />
          Actual</span>
        <span><span style={{ display: "inline-block", width: 8, height: 2,
                             background: v.color, marginRight: 4, verticalAlign: "middle" }} />
          Counterfactual</span>
      </div>
      <LineChart
        series={[
          { id: "real", label: "Actual", color: "#0e1116", points: actualSeries },
          { id: "cf",   label: "Counterfactual", color: v.color, points: cfSeries },
        ]}
        height={200} zeroLine
        events={[{ x: branchYear, label: "branch" }]} />
    </div>
  );
}

// ---- mini shock drawer (reused style but compact) ----
function MiniShock({ label, color, values, onChange, range, startYear }) {
  const N = values.length;
  const W = 280, H = 80;
  const PAD = { t: 6, r: 4, b: 14, l: 20 };
  const ref = React.useRef(null);
  const draggingRef = React.useRef(false);

  const [lo, hi] = range;
  const yScale = v => H - PAD.b - ((v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const yInv = py => lo + ((H - PAD.b - py) / (H - PAD.t - PAD.b)) * (hi - lo);
  const baseY = yScale(0);
  const innerW = W - PAD.l - PAD.r;
  const bw = N > 0 ? innerW / N : innerW;

  function setAt(idx, v) {
    const next = values.slice();
    next[idx] = +Math.max(lo, Math.min(hi, v)).toFixed(2);
    onChange(next);
  }
  function pickFromEvent(e) {
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);
    const idx = Math.max(0, Math.min(N - 1, Math.floor((px - PAD.l) / bw)));
    return { idx, v: yInv(py) };
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: "#3a3530" }}>{label} shock</span>
        <button onClick={() => onChange(arrCL(0, N))}
          style={{ background: "none", border: "none", color: "#8a8474", fontSize: 9,
                   cursor: "pointer", fontFamily: "JetBrains Mono, monospace" }}>clear</button>
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
           onMouseDown={(e) => { draggingRef.current = true; const {idx,v}=pickFromEvent(e); setAt(idx,v); }}
           onMouseMove={(e) => { if (draggingRef.current) { const {idx,v}=pickFromEvent(e); setAt(idx,v); } }}
           onMouseUp={() => draggingRef.current = false}
           onMouseLeave={() => draggingRef.current = false}
           style={{ display: "block", cursor: "crosshair", background: "#fafaf7",
                    border: "1px solid #e4e0d6", touchAction: "none" }}>
        <line x1={PAD.l} x2={W - PAD.r} y1={baseY} y2={baseY} stroke="#d8d4cc" strokeWidth={0.5} />
        {values.map((v, i) => {
          const top = v >= 0 ? yScale(v) : baseY;
          const h = Math.abs(yScale(v) - baseY);
          return (
            <rect key={i} x={PAD.l + i * bw + bw * 0.1} y={top}
                  width={bw * 0.8} height={Math.max(0.3, h)}
                  fill={color} fillOpacity={Math.abs(v) > 0.01 ? 0.8 : 0.15} />
          );
        })}
        {[0, Math.floor(N/2), N-1].filter(i => i >= 0).map(i => (
          <text key={i} x={PAD.l + i * bw + bw * 0.5} y={H - 3} fontSize={8}
                textAnchor="middle" fill="#8a8474"
                fontFamily="JetBrains Mono, monospace">{startYear + i}</text>
        ))}
      </svg>
    </div>
  );
}

function arrCL(v, n) { return Array.from({length: n}, () => v); }

Object.assign(window, { CountryLabView });
