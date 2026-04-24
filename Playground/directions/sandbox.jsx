// DIRECTION C — "The Sandbox"
// Whiteboard / node graph that visualises the macro propagation chain.
// User scrubs through time and watches values flow through nodes connected by edges.

const { useState: useStateC, useEffect: useEffectC, useMemo: useMemoC, useRef: useRefC } = React;

function SandboxApp({ width = 1320, height = 900 }) {
  const [t, setT] = useStateC(8);
  const [playing, setPlaying] = useStateC(false);
  const [supplyShock, setSupplyShock] = useStateC(2.0);
  const [demandShock, setDemandShock] = useStateC(0);
  const [policyMode, setPolicyMode] = useStateC("taylor");
  const [phiPi, setPhiPi] = useStateC(0.5);
  const [N] = useStateC(20);

  // play loop
  useEffectC(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT(prev => {
        const next = prev + 1;
        if (next >= N) { setPlaying(false); return N - 1; }
        return next;
      });
    }, 600);
    return () => clearInterval(id);
  }, [playing, N]);

  const sim = useMemoC(() => simulate({
    N,
    supplyShock: Array.from({ length: N }, (_, i) => i < 4 ? supplyShock : 0),
    demandShock: Array.from({ length: N }, (_, i) => i < 6 ? demandShock : 0),
    policy: policyMode,
    phiPi,
  }), [supplyShock, demandShock, policyMode, phiPi, N]);

  const cur = sim[t] || sim[0];
  const prev = sim[Math.max(0, t - 1)];

  return (
    <div style={{ width, minHeight: height, background: "#fafaf7",
                  fontFamily: "Inter, sans-serif", color: "#0e1116",
                  position: "relative" }}>

      {/* Top bar */}
      <div style={{ padding: "24px 36px", borderBottom: "1px solid #e4e0d6",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                        letterSpacing: 2, textTransform: "uppercase", color: "#8a8474" }}>
            The Sandbox
          </div>
          <h1 style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontSize: 32,
                       margin: "6px 0 0", letterSpacing: -0.6, fontWeight: 400 }}>
            Watch the macro engine think.
          </h1>
          <p style={{ fontSize: 13, color: "#3a3530", margin: "8px 0 0", maxWidth: 600 }}>
            Inject a shock. Pick a policy rule. Step through time and see how each variable propagates
            through the model — Phillips, Okun, IS, Taylor, all wired together.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <SandboxBtn onClick={() => { setT(0); setPlaying(true); }} primary>▶ Run</SandboxBtn>
          <SandboxBtn onClick={() => setPlaying(false)}>⏸ Pause</SandboxBtn>
          <SandboxBtn onClick={() => { setT(0); setPlaying(false); }}>⟲ Reset</SandboxBtn>
        </div>
      </div>

      {/* Main canvas */}
      <div style={{ padding: 36, display: "grid",
                    gridTemplateColumns: "260px 1fr 280px", gap: 24 }}>

        {/* LEFT: shock panel */}
        <div>
          <SectionLabel>1 · Inject shocks</SectionLabel>
          <ShockSlider label="Supply shock"
            sub="An exogenous bump to inflation, persisting 4 periods. Think: oil price spike."
            min={-2} max={6} step={0.25} value={supplyShock} unit="pp π"
            onChange={setSupplyShock}
            graphic={<ShockGlyph type="supply" />} />
          <ShockSlider label="Demand shock"
            sub="Fiscal impulse hitting output gap, 6 periods. Think: stimulus checks."
            min={-3} max={4} step={0.25} value={demandShock} unit="%GDP"
            onChange={setDemandShock}
            graphic={<ShockGlyph type="demand" />} />

          <SectionLabel style={{ marginTop: 28 }}>2 · Policy rule</SectionLabel>
          <PolicyToggle value={policyMode} onChange={setPolicyMode} />
          {policyMode === "taylor" && (
            <div style={{ marginTop: 12 }}>
              <Slider label="φπ — inflation weight" min={0} max={2} step={0.1}
                      value={phiPi} onChange={setPhiPi} />
            </div>
          )}
        </div>

        {/* CENTER: node graph */}
        <div>
          <SectionLabel>3 · Watch propagation</SectionLabel>
          <div style={{ background: "#ffffff", border: "1px solid #e4e0d6",
                        padding: 24, position: "relative", height: 480 }}>
            <NodeGraph cur={cur} prev={prev} t={t} />
          </div>

          {/* Time scrubber */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e0d6",
                        borderTop: "none", padding: "16px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12,
                          fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                          color: "#8a8474", marginBottom: 6 }}>
              <span>t = {t.toString().padStart(2, "0")}</span>
              <span style={{ color: "#bdb5a4" }}>/{N - 1}</span>
              <span style={{ marginLeft: "auto" }}>quarter {t + 1}</span>
            </div>
            <input type="range" min={0} max={N - 1} step={1} value={t}
                   onChange={e => { setT(parseInt(e.target.value)); setPlaying(false); }}
                   style={{ width: "100%", accentColor: "#0e1116" }} />
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 1fr)`,
                          gap: 1, marginTop: 6, height: 24 }}>
              {sim.map((s, i) => {
                const intensity = Math.min(1, Math.abs(s.pi - 2) / 6);
                return (
                  <div key={i} onClick={() => { setT(i); setPlaying(false); }}
                    title={`t=${i} π=${s.pi}`}
                    style={{ background: i === t ? "#0e1116" : `oklch(${0.95 - intensity * 0.5} ${0.02 + intensity * 0.15} 25)`,
                             cursor: "pointer", border: i === t ? "1px solid #0e1116" : "none" }} />
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: live values */}
        <div>
          <SectionLabel>Live state · t={t}</SectionLabel>
          <LiveValue label="Inflation π"   value={cur.pi}      prev={prev.pi}    target={2.0} unit="%" critical={5} />
          <LiveValue label="Unemployment u" value={cur.u}      prev={prev.u}    target={4.5} unit="%" critical={7} />
          <LiveValue label="Output gap"    value={cur.y_gap}   prev={prev.y_gap} target={0}   unit="%" critical={3} />
          <LiveValue label="Policy rate i" value={cur.i}       prev={prev.i}    target={2.5} unit="%" critical={6} />
          <LiveValue label="Inflation expectations" value={cur.pi_e} prev={prev.pi_e} target={2.0} unit="%" critical={4} />
        </div>
      </div>

      {/* Bottom: full timeline */}
      <div style={{ padding: "0 36px 36px" }}>
        <SectionLabel style={{ marginTop: 20 }}>4 · Full simulated path</SectionLabel>
        <div style={{ background: "#ffffff", border: "1px solid #e4e0d6", padding: 20 }}>
          <LineChart
            series={[
              { id: "pi", label: "Inflation",  color: "oklch(0.55 0.18 25)",
                points: sim.map(d => ({ x: d.t, y: d.pi })) },
              { id: "i",  label: "Policy",     color: "oklch(0.55 0.13 220)",
                points: sim.map(d => ({ x: d.t, y: d.i })) },
              { id: "u",  label: "Unemp",      color: "#0e1116",
                points: sim.map(d => ({ x: d.t, y: d.u })) },
              { id: "y",  label: "Output gap", color: "oklch(0.55 0.15 145)",
                points: sim.map(d => ({ x: d.t, y: d.y_gap })) },
            ]}
            height={260} zeroLine xLabel="quarters"
            events={[{ x: t, label: "now" }]} />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                  letterSpacing: 1.5, textTransform: "uppercase",
                  color: "#8a8474", marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

function SandboxBtn({ children, onClick, primary }) {
  return (
    <button onClick={onClick}
      style={{ padding: "8px 16px", background: primary ? "#0e1116" : "#fafaf7",
               color: primary ? "#fafaf7" : "#0e1116",
               border: "1px solid #0e1116", fontFamily: "Inter, sans-serif",
               fontSize: 12, cursor: "pointer", letterSpacing: 0.3 }}>
      {children}
    </button>
  );
}

function ShockSlider({ label, sub, min, max, step, value, onChange, unit, graphic }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e4e0d6",
                  padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 10, color: "#8a8474", marginTop: 2, lineHeight: 1.4,
                        maxWidth: 200 }}>{sub}</div>
        </div>
        {graphic}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between",
                    fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                    marginTop: 12, marginBottom: 4 }}>
        <span style={{ color: "#8a8474", fontSize: 9 }}>{min}</span>
        <span style={{ fontWeight: 500, color: value === 0 ? "#8a8474" : "oklch(0.55 0.18 25)" }}>
          {value > 0 ? "+" : ""}{value.toFixed(2)}{unit}
        </span>
        <span style={{ color: "#8a8474", fontSize: 9 }}>{max}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={e => onChange(parseFloat(e.target.value))}
             style={{ width: "100%", accentColor: "#0e1116" }} />
    </div>
  );
}

function ShockGlyph({ type }) {
  if (type === "supply") {
    return (
      <svg width={36} height={28} viewBox="0 0 36 28">
        <path d="M2 24 L10 24 L14 8 L20 16 L26 4 L34 18" stroke="oklch(0.55 0.18 25)"
              strokeWidth={1.4} fill="none" />
      </svg>
    );
  }
  return (
    <svg width={36} height={28} viewBox="0 0 36 28">
      <path d="M2 22 Q18 22 18 6 Q18 22 34 22" stroke="oklch(0.55 0.13 220)"
            strokeWidth={1.4} fill="none" />
    </svg>
  );
}

function PolicyToggle({ value, onChange }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e4e0d6",
                  display: "flex" }}>
      {[
        { id: "taylor", label: "Taylor rule", sub: "Reactive" },
        { id: "fixed",  label: "Fixed rate",  sub: "Passive" },
      ].map(opt => (
        <button key={opt.id} onClick={() => onChange(opt.id)}
          style={{ flex: 1, padding: 12, border: "none",
                   background: value === opt.id ? "#0e1116" : "transparent",
                   color: value === opt.id ? "#fafaf7" : "#3a3530",
                   cursor: "pointer", textAlign: "left",
                   fontFamily: "Inter, sans-serif" }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{opt.label}</div>
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{opt.sub}</div>
        </button>
      ))}
    </div>
  );
}

function LiveValue({ label, value, prev, target, unit, critical = 5 }) {
  const delta = value - prev;
  const dist = Math.abs(value - target);
  const intensity = Math.min(1, dist / critical);
  const color = `oklch(${0.5 + (1 - intensity) * 0.2} ${0.05 + intensity * 0.13} 25)`;
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e4e0d6",
                  padding: 14, marginBottom: 8 }}>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11,
                    color: "#3a3530", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 26,
                      letterSpacing: -0.4, fontWeight: 500, color, lineHeight: 1 }}>
          {value.toFixed(2)}<span style={{ fontSize: 12, color: "#8a8474" }}>{unit}</span>
        </div>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                      color: Math.abs(delta) < 0.01 ? "#8a8474" : delta > 0 ? "oklch(0.55 0.18 25)" : "oklch(0.55 0.15 145)" }}>
          {Math.abs(delta) < 0.01 ? "·" : delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}
        </div>
      </div>
      {/* Thermometer to target */}
      <div style={{ marginTop: 8, height: 2, background: "#f0ece2", position: "relative" }}>
        <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2,
                      width: 1, background: "#bdb5a4" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, height: "100%",
                      width: `${Math.min(50, intensity * 50)}%`,
                      transform: value > target ? "translateX(0)" : "translateX(-100%)",
                      background: color, transition: "all .3s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4,
                    fontSize: 9, color: "#8a8474",
                    fontFamily: "JetBrains Mono, monospace" }}>
        <span>target {target.toFixed(1)}{unit}</span>
        <span>Δ {(value - target).toFixed(2)}</span>
      </div>
    </div>
  );
}

// ----- Node graph: shows variables connected by labelled edges -----
function NodeGraph({ cur, prev, t }) {
  // Layout (in a 800x430 space)
  const W = 800, H = 430;
  const nodes = [
    { id: "shock_s", x: 80,  y: 60,   label: "Supply shock", val: null,    role: "input" },
    { id: "shock_d", x: 80,  y: 360,  label: "Demand shock", val: null,    role: "input" },
    { id: "pi_e",    x: 240, y: 60,   label: "Expectations π_e", val: cur.pi_e, role: "state" },
    { id: "y",       x: 240, y: 220,  label: "Output gap y*", val: cur.y_gap, role: "state" },
    { id: "u",       x: 400, y: 360,  label: "Unemployment u", val: cur.u, role: "state" },
    { id: "pi",      x: 560, y: 220,  label: "Inflation π", val: cur.pi, role: "state", critical: true },
    { id: "i",       x: 720, y: 60,   label: "Policy rate i", val: cur.i, role: "policy" },
  ];
  const edges = [
    { from: "shock_s", to: "pi", label: "+ε_s" },
    { from: "shock_d", to: "y",  label: "+ε_d" },
    { from: "pi_e",    to: "pi", label: "1·π_e" },
    { from: "y",       to: "u",  label: "Okun: u = u* − y/k" },
    { from: "u",       to: "pi", label: "Phillips: −β(u−u*)" },
    { from: "pi",      to: "i",  label: "Taylor: i = r* + π + φπ(π−π*) + φy·y" },
    { from: "i",       to: "y",  label: "IS: −α(i−π)", curve: "loop" },
  ];

  const N = Object.fromEntries(nodes.map(n => [n.id, n]));

  function strength(n) {
    if (n.val == null) return 0;
    if (n.id === "pi" || n.id === "pi_e") return Math.min(1, Math.abs(n.val - 2) / 6);
    if (n.id === "u") return Math.min(1, Math.abs(n.val - 4.5) / 5);
    if (n.id === "i") return Math.min(1, Math.abs(n.val - 2.5) / 6);
    return Math.min(1, Math.abs(n.val) / 4);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
         style={{ display: "block" }}>
      {/* edges */}
      {edges.map((e, i) => {
        const a = N[e.from], b = N[e.to];
        let d;
        if (e.curve === "loop") {
          // big arc back from i to y
          d = `M${a.x - 20},${a.y + 6} Q${a.x - 100},${(a.y + b.y) / 2} ${b.x + 30},${b.y - 30}`;
        } else {
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          d = `M${a.x},${a.y} Q${mx},${my - 10} ${b.x},${b.y}`;
        }
        // intensity from upstream node
        const s = strength(a);
        const opacity = 0.25 + s * 0.7;
        return (
          <g key={i}>
            <path d={d} fill="none"
                  stroke={s > 0.4 ? "oklch(0.55 0.15 25)" : "#3a3530"}
                  strokeWidth={1 + s * 1.5}
                  strokeOpacity={opacity}
                  markerEnd="url(#arrow)" />
            {(() => {
              const lx = e.curve === "loop" ? a.x - 90 : (a.x + b.x) / 2;
              const ly = e.curve === "loop" ? (a.y + b.y) / 2 : (a.y + b.y) / 2 - 18;
              return (
                <text x={lx} y={ly} fontSize={9}
                      fill="#3a3530"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle">{e.label}</text>
              );
            })()}
          </g>
        );
      })}

      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3a3530" />
        </marker>
      </defs>

      {/* nodes */}
      {nodes.map(n => {
        const s = strength(n);
        const fill = n.role === "input" ? "#fafaf7"
                   : n.role === "policy" ? "oklch(0.96 0.02 250)"
                   : `oklch(${0.97 - s * 0.05} ${0.02 + s * 0.15} 25)`;
        const stroke = n.role === "input" ? "#bdb5a4"
                     : n.critical && s > 0.5 ? "oklch(0.55 0.18 25)"
                     : "#0e1116";
        return (
          <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
            <rect x={-66} y={-26} width={132} height={52}
                  fill={fill} stroke={stroke}
                  strokeWidth={n.critical && s > 0.5 ? 1.5 : 1} rx={2} />
            <text y={-10} fontSize={9} fill="#8a8474"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace">
              {n.label}
            </text>
            <text y={14} fontSize={16}
                  fill={n.critical && s > 0.5 ? "oklch(0.45 0.18 25)" : "#0e1116"}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight={500}>
              {n.val == null ? "shock" : n.val.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* time stamp */}
      <text x={W - 8} y={H - 8} fontSize={10}
            fill="#8a8474" textAnchor="end"
            fontFamily="JetBrains Mono, monospace">t = {t}</text>
    </svg>
  );
}

Object.assign(window, { SandboxApp });
