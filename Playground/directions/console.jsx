// DIRECTION B — "The Console"
// Dense, scan-heavy, dark-mode workstation. All modules visible at once
// in a tiled grid; numerics dominate; monospace everywhere.

const { useState: useStateB, useMemo: useMemoB } = React;

function ConsoleApp({ width = 1320 }) {
  const [scenario, setScenario] = useStateB({
    rateShock: 0,        // bps shock to policy rate
    fiscalImpulse: 0,    // % of GDP
    supplyShock: 0,      // pp inflation shock
    horizon: 12,         // periods
  });
  const [focus, setFocus] = useStateB("US");
  const [hoverYear, setHoverYear] = useStateB(2024);

  // run scenario
  const baseSim = useMemoB(() => simulate({
    N: scenario.horizon,
    supplyShock: Array.from({ length: scenario.horizon }, () => 0),
    demandShock: Array.from({ length: scenario.horizon }, () => 0),
  }), [scenario.horizon]);

  const shockSim = useMemoB(() => simulate({
    N: scenario.horizon,
    supplyShock: Array.from({ length: scenario.horizon }, (_, t) => t < 4 ? scenario.supplyShock : 0),
    demandShock: Array.from({ length: scenario.horizon }, (_, t) => t < 6 ? scenario.fiscalImpulse : 0),
    initial: { pi: 2.0, u: 4.5, y_gap: 0, i: 2.0 + scenario.rateShock / 100, pi_e: 2.0 },
  }), [scenario]);

  const dark = "dark";
  const PAD = 16;

  return (
    <div style={{ width, background: "#0e1116", color: "#dde3ee",
                  fontFamily: "JetBrains Mono, monospace", minHeight: 900,
                  padding: PAD }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    paddingBottom: 12, borderBottom: "1px solid #2a3140", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 8, height: 8, background: "oklch(0.65 0.15 145)",
                        borderRadius: "50%", boxShadow: "0 0 8px oklch(0.65 0.15 145 / 0.6)" }} />
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
                        color: "#7a8599" }}>Macro Console</div>
          <div style={{ fontSize: 10, color: "#5a6478" }}>v2.0 · LIVE · {COUNTRY_ORDER.length} economies</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 10, color: "#7a8599" }}>
          <span>F1 Help</span><span>F2 Export</span><span>F5 Refresh</span>
          <span style={{ color: "oklch(0.7 0.15 145)" }}>● {new Date().toISOString().slice(0,10)}</span>
        </div>
      </div>

      {/* Top KPI strip — horizontal scroll watchlist, one column per country */}
      <div style={{ background: "#2a3140", border: "1px solid #2a3140",
                    marginBottom: 12, overflowX: "auto" }}>
      <div style={{ display: "grid",
                    gridTemplateColumns: `repeat(${COUNTRY_ORDER.length}, minmax(110px, 1fr))`,
                    gap: 1 }}>
        {COUNTRY_ORDER.map(c => {
          const cpi = latestNonNull(MACRO_DATA.cpi[c]);
          const rate = latestNonNull(MACRO_DATA.policyRate[c]);
          const gdp = latestNonNull(MACRO_DATA.gdpGrowth[c]);
          const cpiArr = MACRO_DATA.cpi[c] || [];
          const cpiPrev = cpiArr.slice(-2)[0];
          const cpiD = cpi && cpiPrev?.value != null ? cpi.value - cpiPrev.value : 0;
          const isFocus = focus === c;
          return (
            <div key={c} onClick={() => setFocus(c)}
              style={{ background: isFocus ? "#1f2632" : "#181d27",
                       padding: 10, cursor: "pointer", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999,
                                 background: MACRO_DATA.COUNTRIES[c].color, display: "inline-block" }} />
                  {c}
                </span>
                {isFocus && <span style={{ fontSize: 8, color: "oklch(0.7 0.15 145)" }}>●FOCUS</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2,
                            fontSize: 9, color: "#7a8599" }}>
                <span>CPI</span>
                <span style={{ textAlign: "right",
                               color: cpi?.value > 5 ? "oklch(0.7 0.18 25)" : cpi?.value < 0 ? "oklch(0.65 0.15 250)" : "#dde3ee" }}>
                  {cpi?.value?.toFixed(1)}
                </span>
                <span>RATE</span>
                <span style={{ textAlign: "right" }}>{rate?.value?.toFixed(2)}</span>
                <span>GDP</span>
                <span style={{ textAlign: "right",
                               color: gdp?.value < 0 ? "oklch(0.7 0.18 25)" : "oklch(0.65 0.15 145)" }}>
                  {gdp?.value > 0 ? "+" : ""}{gdp?.value?.toFixed(1)}
                </span>
              </div>
              <div style={{ marginTop: 6 }}>
                <Sparkline values={(MACRO_DATA.cpi[c] || []).slice(-15).map(d => d.value).filter(v => v != null)}
                           width={120} height={20} color="oklch(0.7 0.15 25)" />
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Main grid: 12 cols */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)",
                    gridAutoRows: "min-content", gap: 12 }}>

        {/* Block: Focus country detail */}
        <Panel span={5} kicker={`/${focus}/CPI_RATE`} title={`${MACRO_DATA.COUNTRIES[focus].name} — CPI vs policy rate`}>
          <LineChart
            series={[
              { id: "cpi", label: "CPI", color: "oklch(0.7 0.18 25)",
                points: MACRO_DATA.cpi[focus].map(d => ({ x: d.year, y: d.value })) },
              { id: "r",   label: "Rate", color: "oklch(0.7 0.13 220)",
                points: MACRO_DATA.policyRate[focus].map(d => ({ x: d.year, y: d.value })) },
            ]}
            theme="dark" height={220} zeroLine />
        </Panel>

        {/* Block: GDP growth */}
        <Panel span={4} kicker={`/${focus}/GDP_YOY`} title="Real GDP growth">
          <BarChart
            data={MACRO_DATA.gdpGrowth[focus].slice(-15).map(d => ({
              label: String(d.year).slice(2),
              value: d.value,
            }))}
            theme="dark" height={200} signed
            color={d => d.value >= 0 ? "oklch(0.6 0.13 145)" : "oklch(0.6 0.18 25)"} />
        </Panel>

        {/* Block: Live data table */}
        <Panel span={3} kicker="/SNAPSHOT" title="2024 vitals">
          <Vitals code={focus} />
        </Panel>

        {/* Block: Yield/rate ranking */}
        <Panel span={3} kicker="/RATES/TABLE" title="Policy rates">
          <RatesTable />
        </Panel>

        {/* Block: Inflation table */}
        <Panel span={3} kicker="/CPI/TABLE" title="CPI YoY %">
          <CpiTable />
        </Panel>

        {/* Block: FX board */}
        <Panel span={6} kicker="/FX/USD" title="FX vs USD — index, start = 100">
          <LineChart
            series={["EZ","UK","JP","CN","IN","BR","TR"].map(c => {
              const arr = MACRO_DATA.fxUsd[c];
              const first = arr.find(d => d.value != null)?.value;
              return {
                id: c, label: c, color: MACRO_DATA.COUNTRIES[c].color,
                points: arr.map(d => ({ x: d.year, y: d.value != null && first ? Math.log10((d.value/first)*100) : null })),
              };
            })}
            theme="dark" height={220} yLabel="log₁₀(idx)" />
        </Panel>

        {/* Block: Scenario builder */}
        <Panel span={4} kicker="/SCENARIO/INPUT" title="Scenario inputs">
          <div style={{ fontSize: 10, color: "#7a8599", marginBottom: 8, lineHeight: 1.5 }}>
            Apply shocks to a small DSGE-lite model. Outputs propagate via Taylor + IS + Phillips.
          </div>
          <ConsoleSlider label="Rate shock" min={-300} max={300} step={25}
                         value={scenario.rateShock} unit="bps"
                         onChange={v => setScenario({...scenario, rateShock: v})} />
          <ConsoleSlider label="Fiscal impulse" min={-3} max={5} step={0.25}
                         value={scenario.fiscalImpulse} unit="%GDP"
                         onChange={v => setScenario({...scenario, fiscalImpulse: v})} />
          <ConsoleSlider label="Supply shock" min={-2} max={5} step={0.25}
                         value={scenario.supplyShock} unit="pp π"
                         onChange={v => setScenario({...scenario, supplyShock: v})} />
          <ConsoleSlider label="Horizon" min={4} max={24} step={1}
                         value={scenario.horizon} unit="q"
                         onChange={v => setScenario({...scenario, horizon: v})} />
          <button onClick={() => setScenario({rateShock:0, fiscalImpulse:0, supplyShock:0, horizon:12})}
            style={{ width: "100%", marginTop: 4, padding: "6px 0", background: "transparent",
                     border: "1px solid #2a3140", color: "#7a8599", fontSize: 10,
                     fontFamily: "JetBrains Mono, monospace", cursor: "pointer",
                     letterSpacing: 1 }}>
            ESC ▸ RESET
          </button>
        </Panel>

        {/* Block: Scenario output */}
        <Panel span={5} kicker="/SCENARIO/OUTPUT" title="Impulse response — inflation, unemployment, rate">
          <LineChart
            series={[
              { id: "pi", label: "π",  color: "oklch(0.7 0.18 25)",
                points: shockSim.map(d => ({ x: d.t, y: d.pi })) },
              { id: "u",  label: "u",  color: "oklch(0.7 0.13 220)",
                points: shockSim.map(d => ({ x: d.t, y: d.u })) },
              { id: "i",  label: "i",  color: "oklch(0.75 0.15 90)",
                points: shockSim.map(d => ({ x: d.t, y: d.i })) },
              { id: "y",  label: "y*", color: "oklch(0.65 0.15 145)",
                points: shockSim.map(d => ({ x: d.t, y: d.y_gap })) },
            ]}
            theme="dark" height={220} zeroLine xLabel="quarters" />
        </Panel>

        {/* Block: Scenario terminal output */}
        <Panel span={3} kicker="/SCENARIO/LOG" title="Numeric trace">
          <ScenarioLog data={shockSim} />
        </Panel>

        {/* Block: Phillips */}
        <Panel span={4} kicker="/PHILLIPS" title="Phillips scatter — selected">
          <Scatter data={MACRO_DATA.cpi[focus].map((d, i) => {
            const u = MACRO_DATA.unemployment[focus][i]?.value;
            if (u == null || d.value == null) return null;
            return {
              x: u, y: d.value, r: d.year >= 2020 ? 5 : 3,
              color: d.year >= 2020 ? "oklch(0.7 0.18 25)" : d.year >= 2008 ? "oklch(0.7 0.13 220)" : "#dde3ee",
            };
          }).filter(Boolean)} theme="dark" width={400} height={240}
          xLabel="u, %" yLabel="π, % yoy" />
        </Panel>

        {/* Block: Money */}
        <Panel span={4} kicker="/MONEY" title="M2 growth, % yoy">
          <LineChart
            series={["US","EZ","JP","CN"].map(c => ({
              id: c, label: c, color: MACRO_DATA.COUNTRIES[c].color,
              points: MACRO_DATA.m2Growth[c].slice(-20).map(d => ({ x: d.year, y: d.value })),
            }))}
            theme="dark" height={210} zeroLine yLabel="%" />
        </Panel>

        {/* Block: Debt/GDP */}
        <Panel span={4} kicker="/DEBT_GDP" title="Govt debt as % of GDP, 2024">
          <BarChart
            data={COUNTRY_ORDER
              .filter(c => hasDataFor(c, "debtGdp"))
              .map(c => ({
                label: c, value: latestNonNull(MACRO_DATA.debtGdp[c])?.value || 0,
              })).sort((a, b) => b.value - a.value)}
            theme="dark" height={210}
            color="oklch(0.7 0.15 280)" />
        </Panel>
      </div>

      {/* Bottom status bar */}
      <div style={{ marginTop: 12, padding: "8px 12px", background: "#181d27",
                    border: "1px solid #2a3140", display: "flex",
                    justifyContent: "space-between", fontSize: 10, color: "#7a8599" }}>
        <span>FOCUS:{focus} ◇ HORIZON:{scenario.horizon}q ◇ SHOCK:π+{scenario.supplyShock} fiscal:{scenario.fiscalImpulse}%GDP rate:{scenario.rateShock}bps</span>
        <span>READY ◢ all systems nominal</span>
      </div>
    </div>
  );
}

function Panel({ span = 4, kicker, title, children }) {
  return (
    <div style={{ gridColumn: `span ${span}`, background: "#181d27",
                  border: "1px solid #2a3140", padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    marginBottom: 10 }}>
        <span style={{ fontSize: 9, color: "oklch(0.7 0.15 25)", letterSpacing: 1 }}>{kicker}</span>
        <span style={{ fontSize: 11, color: "#dde3ee" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ConsoleSlider({ label, min, max, step, value, unit, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10,
                    color: "#9aa5ba", marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color: value === 0 ? "#7a8599" : "oklch(0.75 0.15 90)" }}>
          {value > 0 ? "+" : ""}{value}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={e => onChange(parseFloat(e.target.value))}
             style={{ width: "100%", accentColor: "oklch(0.75 0.15 90)" }} />
    </div>
  );
}

function Vitals({ code }) {
  const last = (k) => latestNonNull(MACRO_DATA[k][code])?.value;
  const stocks = MACRO_DATA.moneyStocks[code];
  const rows = [
    ["CPI yoy",     last("cpi"),         "%"],
    ["Policy rate", last("policyRate"),  "%"],
    ["GDP growth",  last("gdpGrowth"),   "%"],
    ["Unemp",       last("unemployment"),"%"],
    ["GDP/cap",     last("gdpPerCapita"), "$"],
    ["M2 growth",   last("m2Growth"),    "%"],
    ["FX/USD",      last("fxUsd"),       ""],
    ["Debt/GDP",    last("debtGdp"),     "%"],
    ["M2 stock",    stocks?.M2,          " " + stocks?.unit],
  ];
  return (
    <div style={{ fontSize: 11 }}>
      {rows.map(([label, val, unit]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between",
                                  padding: "4px 0", borderBottom: "1px solid #2a3140" }}>
          <span style={{ color: "#9aa5ba" }}>{label}</span>
          <span style={{ color: "#dde3ee" }}>
            {val == null ? "—" : (typeof val === "number" ? (val < 1 && val > -1 ? val.toFixed(3) : val < 100 ? val.toFixed(2) : val.toFixed(0)) : val)}{unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function RatesTable() {
  const rows = COUNTRY_ORDER.map(c => {
    const arr = MACRO_DATA.policyRate[c];
    const last = latestNonNull(arr);
    const prev = arr.slice(-2)[0];
    return { code: c, val: last?.value, delta: last && prev?.value != null ? last.value - prev.value : null };
  }).filter(r => r.val != null).sort((a, b) => (b.val ?? 0) - (a.val ?? 0));
  return (
    <div style={{ maxHeight: 280, overflowY: "auto" }}>
    <table style={{ width: "100%", fontSize: 10, color: "#dde3ee" }}>
      <tbody>
        {rows.map(r => (
          <tr key={r.code} style={{ borderBottom: "1px solid #2a3140" }}>
            <td style={{ padding: "4px 0", color: "#9aa5ba" }}>{r.code}</td>
            <td style={{ textAlign: "right" }}>{r.val?.toFixed(2)}</td>
            <td style={{ textAlign: "right", paddingLeft: 8,
                         color: r.delta == null ? "#5a6478" : r.delta > 0 ? "oklch(0.7 0.18 25)" : "oklch(0.7 0.13 220)" }}>
              {r.delta == null ? "—" : (r.delta > 0 ? "▲" : r.delta < 0 ? "▼" : "·") + Math.abs(r.delta).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

function CpiTable() {
  const rows = COUNTRY_ORDER.map(c => {
    const arr = MACRO_DATA.cpi[c];
    const last = latestNonNull(arr);
    const prev = arr.slice(-2)[0];
    return { code: c, val: last?.value, delta: last && prev?.value != null ? last.value - prev.value : null };
  }).filter(r => r.val != null).sort((a, b) => (b.val ?? 0) - (a.val ?? 0));
  return (
    <div style={{ maxHeight: 280, overflowY: "auto" }}>
    <table style={{ width: "100%", fontSize: 10, color: "#dde3ee" }}>
      <tbody>
        {rows.map(r => (
          <tr key={r.code} style={{ borderBottom: "1px solid #2a3140" }}>
            <td style={{ padding: "4px 0", color: "#9aa5ba" }}>{r.code}</td>
            <td style={{ textAlign: "right",
                         color: r.val > 8 ? "oklch(0.7 0.18 25)" : r.val < 0 ? "oklch(0.7 0.13 220)" : "#dde3ee" }}>
              {r.val?.toFixed(1)}
            </td>
            <td style={{ textAlign: "right", paddingLeft: 8, color: "#5a6478" }}>
              {r.delta == null ? "—" : (r.delta > 0 ? "+" : "") + r.delta.toFixed(1)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

function ScenarioLog({ data }) {
  return (
    <div style={{ fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                  background: "#0e1116", padding: 8, height: 220, overflow: "auto",
                  border: "1px solid #2a3140" }}>
      <div style={{ color: "oklch(0.7 0.15 145)", marginBottom: 4 }}>{">"} sim init OK · 4 vars · IS-Phillips-Taylor</div>
      <div style={{ color: "#5a6478", marginBottom: 6 }}>t   π     u     i     y*</div>
      {data.map(d => (
        <div key={d.t} style={{ color: "#dde3ee", lineHeight: 1.4 }}>
          {String(d.t).padStart(2, "0")}  {fmtN(d.pi)} {fmtN(d.u)} {fmtN(d.i)} {fmtN(d.y_gap)}
        </div>
      ))}
      <div style={{ color: "oklch(0.7 0.15 145)", marginTop: 4 }}>{">"} sim done · {data.length} steps</div>
    </div>
  );
}

function fmtN(v) {
  if (v == null) return "  —  ";
  const s = (v >= 0 ? "+" : "") + v.toFixed(2);
  return s.padStart(6, " ");
}

Object.assign(window, { ConsoleApp });
