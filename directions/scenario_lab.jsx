// DIRECTION D — "Scenario Lab"
// What-if engine: presets, timeline shock editor, A/B/Baseline overlay,
// counterfactual on real history, URL state, named saves.

const { useState: useStateD, useEffect: useEffectD, useMemo: useMemoD, useRef: useRefD, useCallback: useCallbackD } = React;

// --- preset library ---
const PRESETS = {
  baseline: {
    name: "Baseline",
    desc: "No shocks. Steady-state economy at target.",
    supplyShock: arr(0, 24), demandShock: arr(0, 24),
    policy: "taylor", phiPi: 0.5, phiY: 0.5,
    initial: { pi: 2.0, u: 4.5, y_gap: 0, i: 2.0, pi_e: 2.0 },
  },
  volcker: {
    name: "1979 Volcker shock",
    desc: "Inflation entrenched at ~10%; new chair commits to crushing it. Aggressive Taylor (φπ=2).",
    supplyShock: arr(0, 24),
    demandShock: arr(0, 24),
    policy: "taylor", phiPi: 2.0, phiY: 0.2,
    initial: { pi: 10.0, u: 6.0, y_gap: 0, i: 11.0, pi_e: 8.0 },
  },
  gfc2008: {
    name: "2008 GFC",
    desc: "Demand collapse −4% GDP, Fed at ZLB. Persistent disinflation, slow recovery.",
    supplyShock: arr(0, 24),
    demandShock: setArr(arr(0, 24), { 0: -4, 1: -3.5, 2: -2, 3: -1, 4: -0.5 }),
    policy: "taylor", phiPi: 0.5, phiY: 0.8,
    initial: { pi: 2.0, u: 5.0, y_gap: 0, i: 2.0, pi_e: 2.0 },
  },
  covid2020: {
    name: "2020 COVID",
    desc: "Sharp demand collapse + supply disruptions, then massive fiscal & monetary stimulus.",
    supplyShock: setArr(arr(0, 24), { 4: 1.5, 5: 2.0, 6: 1.5, 7: 1.0 }),
    demandShock: setArr(arr(0, 24), { 0: -6, 1: -4, 2: 2, 3: 4, 4: 3, 5: 2 }),
    policy: "taylor", phiPi: 0.3, phiY: 0.8,
    initial: { pi: 2.0, u: 4.0, y_gap: 0, i: 0.25, pi_e: 2.0 },
  },
  inflation2022: {
    name: "2022 inflation wave",
    desc: "Persistent supply shock (energy + supply chains). Aggressive central bank tightening.",
    supplyShock: setArr(arr(0, 24), { 0: 4, 1: 3.5, 2: 3, 3: 2.5, 4: 2, 5: 1.5, 6: 1, 7: 0.5 }),
    demandShock: arr(0, 24),
    policy: "taylor", phiPi: 1.5, phiY: 0.3,
    initial: { pi: 4.5, u: 3.8, y_gap: 0.5, i: 0.25, pi_e: 3.0 },
  },
  stagflation: {
    name: "Stagflation (1970s)",
    desc: "Repeated supply shocks, accommodative policy, expectations un-anchor.",
    supplyShock: setArr(arr(0, 24), { 0: 3, 4: 2, 8: 3, 12: 2 }),
    demandShock: arr(0, 24),
    policy: "fixed", fixedRate: 5.0,
    initial: { pi: 6.0, u: 5.5, y_gap: 0, i: 5.0, pi_e: 5.0 },
  },
  liquidity_trap: {
    name: "Liquidity trap",
    desc: "Demand collapse, ZLB binds. Monetary policy impotent — fiscal must do the work.",
    supplyShock: setArr(arr(0, 24), { 0: -1, 1: -1, 2: -0.5 }),
    demandShock: setArr(arr(0, 24), { 0: -3, 1: -3, 2: -2, 3: -1 }),
    policy: "fixed", fixedRate: 0,
    initial: { pi: 0.5, u: 6.0, y_gap: -2, i: 0, pi_e: 1.0 },
  },
  hyperinflation: {
    name: "Money printing → hyperinflation",
    desc: "Fiscal dominance: central bank prints to finance government. Expectations un-anchor fast.",
    supplyShock: setArr(arr(0, 24), { 0: 5, 1: 8, 2: 12, 3: 18, 4: 25, 5: 35, 6: 50, 7: 70, 8: 95 }),
    demandShock: arr(0, 24),
    policy: "fixed", fixedRate: 8.0,
    initial: { pi: 8.0, u: 8.0, y_gap: 0, i: 8.0, pi_e: 12.0 },
  },
  soft_landing: {
    name: "Soft landing",
    desc: "Persistent supply shock met with calibrated tightening. Inflation drops without recession.",
    supplyShock: setArr(arr(0, 24), { 0: 3, 1: 2.5, 2: 2, 3: 1.5, 4: 1, 5: 0.5 }),
    demandShock: arr(0, 24),
    policy: "taylor", phiPi: 1.0, phiY: 0.7,
    initial: { pi: 4.0, u: 4.0, y_gap: 0.3, i: 1.5, pi_e: 2.5 },
  },
};
function arr(v, n) { return Array.from({length: n}, () => v); }
function setArr(a, kv) { const out = a.slice(); for (const k in kv) out[+k] = kv[k]; return out; }

const PRESET_ORDER = ["baseline","volcker","gfc2008","covid2020","inflation2022","stagflation","liquidity_trap","hyperinflation","soft_landing"];

// --- URL state ---
function encodeState(s) {
  try {
    const j = JSON.stringify({
      A: stripScenario(s.A), B: stripScenario(s.B),
      mode: s.mode, focus: s.focus,
    });
    return btoa(unescape(encodeURIComponent(j))).replace(/=+$/,"");
  } catch { return ""; }
}
function stripScenario(sc) {
  return {
    n: sc.name, ss: sc.supplyShock, ds: sc.demandShock,
    p: sc.policy, pp: sc.phiPi, py: sc.phiY, fr: sc.fixedRate,
    i: sc.initial,
  };
}
function decodeState(hash) {
  try {
    const j = JSON.parse(decodeURIComponent(escape(atob(hash))));
    const expand = (s) => ({
      name: s.n, supplyShock: s.ss, demandShock: s.ds,
      policy: s.p, phiPi: s.pp, phiY: s.py, fixedRate: s.fr,
      initial: s.i,
    });
    return { A: expand(j.A), B: expand(j.B), mode: j.mode, focus: j.focus };
  } catch { return null; }
}

// --- main app ---
function ScenarioLabApp({ width = 1320, height = 900 }) {
  const initial = useMemoD(() => {
    let h = window.location.hash.slice(1);
    // Allow both bare "<b64>" and "app=lab|<b64>" formats.
    if (h.startsWith("app=lab|")) h = h.slice("app=lab|".length);
    else if (h === "app=lab" || h.startsWith("app=") && !h.includes("|")) h = "";
    const s = h ? decodeState(h) : null;
    if (s) return s;
    return {
      A: { ...PRESETS.inflation2022 },
      B: { ...PRESETS.baseline },
      mode: "compare", focus: "A",
    };
  }, []);

  const [A, setA] = useStateD(initial.A);
  const [B, setB] = useStateD(initial.B);
  const [mode, setMode] = useStateD(initial.mode || "compare"); // "compare" | "single" | "counterfactual"
  const [focus, setFocus] = useStateD(initial.focus || "A");
  const [savedScenarios, setSavedScenarios] = useStateD(() => {
    try { return JSON.parse(localStorage.getItem("econ_saved") || "[]"); } catch { return []; }
  });
  const [saveName, setSaveName] = useStateD("");

  // baseline always = no shocks
  const baseline = PRESETS.baseline;

  const simA = useMemoD(() => simulate({ N: 24, ...A }), [A]);
  const simB = useMemoD(() => simulate({ N: 24, ...B }), [B]);
  const simBaseline = useMemoD(() => simulate({ N: 24, ...baseline }), []);

  // sync URL
  useEffectD(() => {
    const code = encodeState({ A, B, mode, focus });
    if (code) window.history.replaceState(null, "", "#app=lab|" + code);
  }, [A, B, mode, focus]);

  function loadPreset(side, key) {
    const p = { ...PRESETS[key] };
    if (side === "A") setA(p);
    else setB(p);
  }
  function saveCurrent() {
    if (!saveName.trim()) return;
    const next = [...savedScenarios, { name: saveName, scenario: focus === "A" ? A : B }];
    setSavedScenarios(next);
    localStorage.setItem("econ_saved", JSON.stringify(next));
    setSaveName("");
  }
  function loadSaved(s) {
    if (focus === "A") setA({ ...s.scenario, name: s.name });
    else setB({ ...s.scenario, name: s.name });
  }
  function deleteSaved(i) {
    const next = savedScenarios.filter((_, idx) => idx !== i);
    setSavedScenarios(next);
    localStorage.setItem("econ_saved", JSON.stringify(next));
  }
  function shareUrl() {
    const code = encodeState({ A, B, mode, focus });
    const base = window.location.origin + window.location.pathname + window.location.search;
    const url = base + "#app=lab|" + code;
    navigator.clipboard?.writeText(url);
    alert("Scenario URL copied:\n" + url);
  }

  const current = focus === "A" ? A : B;
  const setCurrent = focus === "A" ? setA : setB;

  return (
    <div style={{ width, minHeight: height, background: "#fafaf7",
                  fontFamily: "Inter, sans-serif", color: "#0e1116" }}>
      {/* Header */}
      <div style={{ padding: "24px 36px", borderBottom: "1px solid #e4e0d6",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                        letterSpacing: 2, textTransform: "uppercase", color: "#8a8474" }}>
            Scenario Lab
          </div>
          <h1 style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontSize: 32,
                       margin: "6px 0 0", letterSpacing: -0.6, fontWeight: 400 }}>
            What if?
          </h1>
          <p style={{ fontSize: 13, color: "#3a3530", margin: "8px 0 0", maxWidth: 640 }}>
            Build, compare, and share macroeconomic scenarios. Pick a preset or design your own
            shock timeline. Compare two policies side-by-side, or test a counterfactual against
            real history.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <ModeBtn active={mode === "single"} onClick={() => setMode("single")}>Single</ModeBtn>
          <ModeBtn active={mode === "compare"} onClick={() => setMode("compare")}>Compare A vs B</ModeBtn>
          <ModeBtn active={mode === "counterfactual"} onClick={() => setMode("counterfactual")}>Presets</ModeBtn>
          <ModeBtn active={mode === "country_lab"} onClick={() => setMode("country_lab")}>Country Lab</ModeBtn>
        </div>
      </div>

      {mode === "country_lab" ? <CountryLabView />
       : mode === "counterfactual"
        ? <CounterfactualView A={A} setA={setA} loadPreset={(k) => loadPreset("A", k)} />
        : (
          <div style={{ padding: 36, display: "grid",
                        gridTemplateColumns: "300px 1fr", gap: 24 }}>
            {/* LEFT: scenario manager */}
            <div>
              <SectionLabel>Presets</SectionLabel>
              <div style={{ background: "#fff", border: "1px solid #e4e0d6" }}>
                {PRESET_ORDER.map(k => (
                  <PresetRow key={k} preset={PRESETS[k]} active={current.name === PRESETS[k].name}
                             onLoadA={() => loadPreset("A", k)}
                             onLoadB={mode === "compare" ? () => loadPreset("B", k) : null} />
                ))}
              </div>

              <SectionLabel style={{ marginTop: 24 }}>Saved</SectionLabel>
              <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 12 }}>
                {savedScenarios.length === 0 && (
                  <div style={{ fontSize: 11, color: "#8a8474", padding: "6px 0",
                                fontFamily: "Inter, sans-serif" }}>
                    No saved scenarios yet.
                  </div>
                )}
                {savedScenarios.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between",
                                        alignItems: "center", padding: "6px 0",
                                        borderBottom: i < savedScenarios.length - 1 ? "1px solid #f0ece2" : "none" }}>
                    <button onClick={() => loadSaved(s)}
                      style={{ background: "none", border: "none", padding: 0,
                               fontFamily: "Inter, sans-serif", fontSize: 12,
                               color: "#0e1116", cursor: "pointer", textAlign: "left", flex: 1 }}>
                      {s.name}
                    </button>
                    <button onClick={() => deleteSaved(i)}
                      style={{ background: "none", border: "none", padding: 0,
                               fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                               color: "#8a8474", cursor: "pointer" }}>×</button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 10,
                              borderTop: "1px solid #f0ece2", paddingTop: 10 }}>
                  <input value={saveName} onChange={e => setSaveName(e.target.value)}
                    placeholder={`Save ${focus} as…`}
                    style={{ flex: 1, border: "1px solid #d8d4cc", padding: "6px 8px",
                             fontFamily: "Inter, sans-serif", fontSize: 11,
                             background: "transparent" }} />
                  <button onClick={saveCurrent}
                    style={{ padding: "6px 10px", background: "#0e1116", color: "#fafaf7",
                             border: "none", fontSize: 11, cursor: "pointer",
                             fontFamily: "Inter, sans-serif" }}>Save</button>
                </div>
              </div>

              <button onClick={shareUrl}
                style={{ width: "100%", marginTop: 12, padding: "10px",
                         background: "#fafaf7", border: "1px solid #0e1116",
                         color: "#0e1116", fontFamily: "Inter, sans-serif", fontSize: 12,
                         cursor: "pointer", letterSpacing: 0.3 }}>
                ⌘ Copy share link
              </button>

              {mode === "compare" && (
                <>
                  <SectionLabel style={{ marginTop: 24 }}>Editing</SectionLabel>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["A", "B"].map(side => (
                      <button key={side} onClick={() => setFocus(side)}
                        style={{ flex: 1, padding: "10px",
                                 background: focus === side ? (side === "A" ? "oklch(0.55 0.18 25)" : "oklch(0.55 0.13 220)") : "#fff",
                                 color: focus === side ? "#fafaf7" : "#0e1116",
                                 border: "1px solid #0e1116",
                                 fontFamily: "JetBrains Mono, monospace", fontSize: 12, cursor: "pointer" }}>
                        Scenario {side}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* CENTER: editor + outputs */}
            <div>
              <SectionLabel>
                Editing: <span style={{ color: focus === "A" ? "oklch(0.55 0.18 25)" : "oklch(0.55 0.13 220)" }}>
                  {current.name}
                </span>
              </SectionLabel>

              {/* Timeline shock editor */}
              <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 20,
                            marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  <ShockTimeline label="Supply shock (pp π)" color="oklch(0.55 0.18 25)"
                    values={current.supplyShock}
                    onChange={(v) => setCurrent({ ...current, supplyShock: v, name: current.name.startsWith("custom") ? current.name : "custom" })}
                    range={[-3, 12]} />
                  <ShockTimeline label="Demand shock (%GDP)" color="oklch(0.55 0.13 220)"
                    values={current.demandShock}
                    onChange={(v) => setCurrent({ ...current, demandShock: v, name: current.name.startsWith("custom") ? current.name : "custom" })}
                    range={[-6, 6]} />
                </div>

                {/* Policy & initial */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginTop: 24,
                              borderTop: "1px solid #f0ece2", paddingTop: 16 }}>
                  <div>
                    <SubLabel>Policy rule</SubLabel>
                    <PolicyToggle value={current.policy} onChange={v => setCurrent({...current, policy: v})} />
                    {current.policy === "taylor" && (
                      <>
                        <Slider label="φπ" min={0} max={2.5} step={0.1}
                                value={current.phiPi} onChange={v => setCurrent({...current, phiPi: v})} />
                        <Slider label="φy" min={0} max={2} step={0.1}
                                value={current.phiY} onChange={v => setCurrent({...current, phiY: v})} />
                      </>
                    )}
                    {current.policy === "fixed" && (
                      <Slider label="Rate" min={-1} max={20} step={0.25} unit="%"
                              value={current.fixedRate || 2} onChange={v => setCurrent({...current, fixedRate: v})} />
                    )}
                  </div>
                  <div>
                    <SubLabel>Initial state</SubLabel>
                    <Slider label="π₀" min={-2} max={20} step={0.5} value={current.initial.pi}
                            onChange={v => setCurrent({...current, initial: {...current.initial, pi: v}})} unit="%" />
                    <Slider label="u₀" min={2} max={15} step={0.25} value={current.initial.u}
                            onChange={v => setCurrent({...current, initial: {...current.initial, u: v}})} unit="%" />
                  </div>
                  <div>
                    <SubLabel>Expectations</SubLabel>
                    <Slider label="π_e₀" min={-1} max={20} step={0.5} value={current.initial.pi_e}
                            onChange={v => setCurrent({...current, initial: {...current.initial, pi_e: v}})} unit="%" />
                    <Slider label="i₀" min={-1} max={20} step={0.25} value={current.initial.i}
                            onChange={v => setCurrent({...current, initial: {...current.initial, i: v}})} unit="%" />
                  </div>
                </div>
              </div>

              {/* Output charts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <OverlayChart title="Inflation π" yKey="pi" mode={mode}
                              simA={simA} simB={simB} simBaseline={simBaseline}
                              targetLine={2} />
                <OverlayChart title="Unemployment u" yKey="u" mode={mode}
                              simA={simA} simB={simB} simBaseline={simBaseline}
                              targetLine={4.5} />
                <OverlayChart title="Policy rate i" yKey="i" mode={mode}
                              simA={simA} simB={simB} simBaseline={simBaseline} />
                <OverlayChart title="Output gap (y − y*)" yKey="y_gap" mode={mode}
                              simA={simA} simB={simB} simBaseline={simBaseline}
                              targetLine={0} />
              </div>

              {/* Numeric summary */}
              <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e4e0d6", padding: 16 }}>
                <SubLabel>Outcome summary (peak / final)</SubLabel>
                <SummaryTable simA={simA} simB={simB} simBaseline={simBaseline} mode={mode}
                              nameA={A.name} nameB={B.name} />
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ padding: "8px 14px", background: active ? "#0e1116" : "transparent",
               color: active ? "#fafaf7" : "#0e1116",
               border: "1px solid #0e1116", fontFamily: "Inter, sans-serif",
               fontSize: 12, cursor: "pointer", letterSpacing: 0.3 }}>
      {children}
    </button>
  );
}

function SubLabel({ children }) {
  return (
    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                  letterSpacing: 1.5, textTransform: "uppercase",
                  color: "#8a8474", marginBottom: 8 }}>{children}</div>
  );
}

function PresetRow({ preset, active, onLoadA, onLoadB }) {
  return (
    <div style={{ padding: "10px 12px", borderBottom: "1px solid #f0ece2",
                  background: active ? "#f5f1e8" : "transparent" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{preset.name}</div>
          <div style={{ fontSize: 10, color: "#8a8474", marginTop: 3, lineHeight: 1.4 }}>
            {preset.desc}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button onClick={onLoadA}
            style={{ background: "oklch(0.55 0.18 25)", color: "#fafaf7",
                     border: "none", padding: "3px 8px", fontSize: 10,
                     cursor: "pointer", fontFamily: "JetBrains Mono, monospace" }}>→A</button>
          {onLoadB && (
            <button onClick={onLoadB}
              style={{ background: "oklch(0.55 0.13 220)", color: "#fafaf7",
                       border: "none", padding: "3px 8px", fontSize: 10,
                       cursor: "pointer", fontFamily: "JetBrains Mono, monospace" }}>→B</button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Shock timeline editor: drag bars, click to set ---
function ShockTimeline({ label, color, values, onChange, range }) {
  const N = values.length;
  const W = 460, H = 140;
  const PAD = { t: 12, r: 8, b: 20, l: 28 };
  const ref = useRefD(null);
  const draggingRef = useRefD(false);

  const [lo, hi] = range;
  const yScale = v => H - PAD.b - ((v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const yInv = py => lo + ((H - PAD.b - py) / (H - PAD.t - PAD.b)) * (hi - lo);
  const baseY = yScale(0);
  const innerW = W - PAD.l - PAD.r;
  const bw = innerW / N;

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
  function onDown(e) {
    draggingRef.current = true;
    const { idx, v } = pickFromEvent(e);
    setAt(idx, v);
  }
  function onMove(e) {
    if (!draggingRef.current) return;
    const { idx, v } = pickFromEvent(e);
    setAt(idx, v);
  }
  function onUp() { draggingRef.current = false; }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#3a3530" }}>{label}</span>
        <button onClick={() => onChange(arr(0, N))}
          style={{ background: "none", border: "none", color: "#8a8474",
                   fontSize: 10, cursor: "pointer",
                   fontFamily: "JetBrains Mono, monospace" }}>clear</button>
      </div>
      <div style={{ fontSize: 9, color: "#8a8474", fontFamily: "Inter, sans-serif",
                    marginBottom: 4 }}>
        Click + drag to draw the shock per quarter
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
           onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
           style={{ display: "block", cursor: "crosshair", background: "#fafaf7",
                    border: "1px solid #e4e0d6", touchAction: "none" }}>
        {/* y ticks */}
        {[lo, (lo+hi)/2, hi].map((v, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yScale(v)} y2={yScale(v)}
                  stroke="#e4e0d6" strokeWidth={0.5}
                  strokeDasharray={v === 0 ? "0" : "2,3"} />
            <text x={PAD.l - 4} y={yScale(v) + 3} fontSize={9}
                  textAnchor="end" fill="#8a8474"
                  fontFamily="JetBrains Mono, monospace">{v}</text>
          </g>
        ))}
        {/* bars */}
        {values.map((v, i) => {
          const top = v >= 0 ? yScale(v) : baseY;
          const h = Math.abs(yScale(v) - baseY);
          return (
            <rect key={i} x={PAD.l + i * bw + bw * 0.1} y={top}
                  width={bw * 0.8} height={Math.max(0.3, h)}
                  fill={color} fillOpacity={Math.abs(v) > 0.01 ? 0.85 : 0.15} />
          );
        })}
        {/* x ticks every 4 */}
        {Array.from({length: Math.floor(N/4) + 1}, (_, i) => i * 4).filter(i => i < N).map(i => (
          <text key={i} x={PAD.l + i * bw + bw * 0.5} y={H - 6} fontSize={9}
                textAnchor="middle" fill="#8a8474"
                fontFamily="JetBrains Mono, monospace">{i}</text>
        ))}
      </svg>
    </div>
  );
}

// --- Overlay chart: Baseline + A (+ B if compare) ---
function OverlayChart({ title, yKey, mode, simA, simB, simBaseline, targetLine }) {
  const series = [
    { id: "base", label: "Baseline", color: "#bdb5a4",
      points: simBaseline.map(d => ({ x: d.t, y: d[yKey] })) },
    { id: "A",    label: "A",        color: "oklch(0.55 0.18 25)",
      points: simA.map(d => ({ x: d.t, y: d[yKey] })) },
  ];
  if (mode === "compare") {
    series.push({ id: "B", label: "B", color: "oklch(0.55 0.13 220)",
                  points: simB.map(d => ({ x: d.t, y: d[yKey] })) });
  }
  return (
    <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{title}</div>
      <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#8a8474",
                    marginBottom: 6 }}>
        {series.map(s => (
          <span key={s.id}>
            <span style={{ display: "inline-block", width: 8, height: 2,
                           background: s.color, marginRight: 4, verticalAlign: "middle" }} />
            {s.label}
          </span>
        ))}
      </div>
      <LineChart series={series} height={170} zeroLine xLabel="quarters"
        events={targetLine != null ? [{ x: 23, label: `target ${targetLine}` }] : []} />
    </div>
  );
}

function SummaryTable({ simA, simB, simBaseline, mode, nameA, nameB }) {
  const stats = (sim) => ({
    piPeak: Math.max(...sim.map(d => d.pi)).toFixed(2),
    piFinal: sim[sim.length - 1].pi.toFixed(2),
    uPeak: Math.max(...sim.map(d => d.u)).toFixed(2),
    iPeak: Math.max(...sim.map(d => d.i)).toFixed(2),
    yMin: Math.min(...sim.map(d => d.y_gap)).toFixed(2),
  });
  const rows = [
    { name: "Baseline", color: "#bdb5a4", ...stats(simBaseline) },
    { name: nameA, color: "oklch(0.55 0.18 25)", ...stats(simA) },
  ];
  if (mode === "compare") rows.push({ name: nameB, color: "oklch(0.55 0.13 220)", ...stats(simB) });

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #e4e0d6", color: "#8a8474" }}>
          {["Scenario","π peak","π final","u peak","i peak","y* min"].map(h =>
            <th key={h} style={{ textAlign: h === "Scenario" ? "left" : "right", padding: "8px 8px",
                                 fontWeight: 500, fontSize: 10, textTransform: "uppercase",
                                 letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #f0ece2" }}>
            <td style={{ padding: "8px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, background: r.color, display: "inline-block" }} />
              <span>{r.name}</span>
            </td>
            <td style={{ textAlign: "right", padding: "8px",
                         fontFamily: "JetBrains Mono, monospace" }}>{r.piPeak}</td>
            <td style={{ textAlign: "right", padding: "8px",
                         fontFamily: "JetBrains Mono, monospace" }}>{r.piFinal}</td>
            <td style={{ textAlign: "right", padding: "8px",
                         fontFamily: "JetBrains Mono, monospace" }}>{r.uPeak}</td>
            <td style={{ textAlign: "right", padding: "8px",
                         fontFamily: "JetBrains Mono, monospace" }}>{r.iPeak}</td>
            <td style={{ textAlign: "right", padding: "8px",
                         fontFamily: "JetBrains Mono, monospace" }}>{r.yMin}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// --- Counterfactual: pick a country + year, alter policy from that point, compare to actuals ---
function CounterfactualView({ A, setA, loadPreset }) {
  const [country, setCountry] = useStateD("US");
  const [startYear, setStartYear] = useStateD(2008);
  const [altPolicy, setAltPolicy] = useStateD("hold");  // "hold" | "cut" | "hike"
  const [altMag, setAltMag] = useStateD(2.0);

  const cpiHist = MACRO_DATA.cpi[country];
  const rateHist = MACRO_DATA.policyRate[country];
  const startIdx = MACRO_DATA.YEARS.indexOf(startYear);

  // Build counterfactual: take real values pre-shock, then simulate forward with alt policy
  const N = MACRO_DATA.YEARS.length - startIdx;
  const initial = {
    pi: cpiHist[startIdx]?.value || 2,
    u: MACRO_DATA.unemployment[country][startIdx]?.value || 4.5,
    y_gap: 0,
    i: rateHist[startIdx]?.value || 2,
    pi_e: cpiHist[Math.max(0, startIdx - 1)]?.value || 2,
  };
  const altRate = altPolicy === "hold" ? initial.i
                : altPolicy === "cut"  ? Math.max(-0.5, initial.i - altMag)
                                       : initial.i + altMag;
  const altSim = simulate({
    N, supplyShock: arr(0, N), demandShock: arr(0, N),
    policy: "fixed", fixedRate: altRate, initial,
  });

  const realCpi = cpiHist.slice(startIdx).map((d, i) => ({ x: d.year, y: d.value }));
  const realRate = rateHist.slice(startIdx).map((d, i) => ({ x: d.year, y: d.value }));
  const altCpi = altSim.map((d, i) => ({ x: MACRO_DATA.YEARS[startIdx] + i, y: d.pi }));
  const altRateSeries = altSim.map((d, i) => ({ x: MACRO_DATA.YEARS[startIdx] + i, y: d.i }));

  return (
    <div style={{ padding: 36 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "#3a3530", margin: 0, maxWidth: 720,
                    fontFamily: "'IBM Plex Serif', Georgia, serif", lineHeight: 1.5 }}>
          Counterfactual mode: pick a country and a turning point. The chart shows what actually
          happened (real data) vs. what the model predicts <i>would have</i> happened under an
          alternative policy from that year forward.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        <div>
          <SectionLabel>Setup</SectionLabel>
          <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 16 }}>
            <SubLabel>Country</SubLabel>
            <CountryPicker selected={[country]} onChange={c => setCountry(c[0])} multi={false} />

            <div style={{ marginTop: 16 }}>
              <SubLabel>Branch year</SubLabel>
              <Slider label="Start counterfactual at" min={1995} max={2022} step={1}
                      value={startYear} onChange={setStartYear} />
            </div>

            <div style={{ marginTop: 16 }}>
              <SubLabel>Alternative policy</SubLabel>
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {[
                  { id: "hold", label: "Hold rate" },
                  { id: "cut",  label: "Cut" },
                  { id: "hike", label: "Hike" },
                ].map(o => (
                  <button key={o.id} onClick={() => setAltPolicy(o.id)}
                    style={{ flex: 1, padding: "6px 0", border: "1px solid #0e1116",
                             background: altPolicy === o.id ? "#0e1116" : "#fff",
                             color: altPolicy === o.id ? "#fafaf7" : "#0e1116",
                             fontSize: 11, cursor: "pointer",
                             fontFamily: "Inter, sans-serif" }}>{o.label}</button>
                ))}
              </div>
              {altPolicy !== "hold" && (
                <Slider label="Magnitude" min={0.25} max={8} step={0.25} unit="pp"
                        value={altMag} onChange={setAltMag} />
              )}
            </div>
          </div>

          <SectionLabel style={{ marginTop: 24 }}>Quick start</SectionLabel>
          <div style={{ background: "#fff", border: "1px solid #e4e0d6" }}>
            {[
              { label: "What if Fed didn't cut in 2008?", c: "US", y: 2008, p: "hold" },
              { label: "What if Fed hiked in 2021 not 2022?", c: "US", y: 2021, p: "hike", m: 3 },
              { label: "What if BoJ raised rates in 2010?", c: "JP", y: 2010, p: "hike", m: 2 },
              { label: "What if Turkey hiked aggressively in 2018?", c: "TR", y: 2018, p: "hike", m: 10 },
              { label: "What if ECB cut harder in 2012?", c: "EZ", y: 2012, p: "cut", m: 1.5 },
            ].map((q, i) => (
              <button key={i} onClick={() => {
                setCountry(q.c); setStartYear(q.y); setAltPolicy(q.p);
                if (q.m) setAltMag(q.m);
              }}
                style={{ width: "100%", textAlign: "left", padding: "10px 12px",
                         background: "transparent", border: "none",
                         borderBottom: "1px solid #f0ece2", cursor: "pointer",
                         fontFamily: "Inter, sans-serif", fontSize: 11, color: "#3a3530" }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                CPI inflation: actual vs counterfactual
              </div>
              <LineChart
                series={[
                  { id: "real", label: "Actual", color: "#0e1116", points: cpiHist.map(d => ({ x: d.year, y: d.value })) },
                  { id: "cf",   label: "Counterfactual", color: "oklch(0.55 0.18 25)", points: altCpi },
                ]}
                height={240} zeroLine
                events={[{ x: startYear, label: "branch" }]} />
            </div>
            <div style={{ background: "#fff", border: "1px solid #e4e0d6", padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                Policy rate: actual vs counterfactual
              </div>
              <LineChart
                series={[
                  { id: "real", label: "Actual", color: "#0e1116", points: rateHist.map(d => ({ x: d.year, y: d.value })) },
                  { id: "cf",   label: "Counterfactual", color: "oklch(0.55 0.13 220)", points: altRateSeries },
                ]}
                height={240} zeroLine
                events={[{ x: startYear, label: "branch" }]} />
            </div>
          </div>

          <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e4e0d6", padding: 16 }}>
            <SubLabel>Reading the result</SubLabel>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#3a3530",
                        fontFamily: "'IBM Plex Serif', Georgia, serif", margin: 0 }}>
              From {startYear}, the model branches off real history. The {altPolicy === "hold" ? "rate is held flat" : altPolicy === "cut" ? `rate is cut by ${altMag}pp` : `rate is hiked by ${altMag}pp`} and
              the IS-Phillips-Taylor system propagates forward. The gap between actual and counterfactual
              shows the implied causal effect of the policy change — under the model's assumptions,
              not the messy real world.
            </p>
            <p style={{ fontSize: 11, color: "#8a8474", marginTop: 8 }}>
              ⚠ Stylized model. Lags ≈ 1 year, no foreign sector, no expectations un-anchoring above 20%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScenarioLabApp });
