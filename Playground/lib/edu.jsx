// Educational overlay primitives for The Briefing.
// Exports: EduProvider / useEdu, Term (hover gloss), WhatYoureLookingAt, ReadLine, GlossaryPopover.

const EduCtx = React.createContext({ on: true, toggle: () => {} });
function EduProvider({ children, initial = true }) {
  const [on, setOn] = React.useState(initial);
  return <EduCtx.Provider value={{ on, toggle: () => setOn(v => !v), set: setOn }}>
    {children}
  </EduCtx.Provider>;
}
function useEdu() { return React.useContext(EduCtx); }

// --- Glossary data ------------------------------------------------------
const GLOSSARY = {
  "policy rate": {
    short: "The short-term interest rate set by a central bank — the lever that transmits monetary policy.",
    long: "Also called the 'base rate' or 'official rate'. Commercial banks lend to each other overnight at rates very close to this. Changes propagate to mortgages, deposits, and corporate loans with a 6–18 month lag."
  },
  "cpi": {
    short: "Consumer Price Index — the change in price of a fixed basket of goods households buy.",
    long: "Measured monthly by statistical agencies. 'Headline' CPI includes everything; 'core' CPI excludes volatile food and energy to show underlying trend. Reported as % year-over-year."
  },
  "output gap": {
    short: "The % difference between actual GDP and potential GDP (what the economy could produce at full employment).",
    long: "A positive gap = overheating, likely inflationary. Negative gap = slack, recessionary. Notoriously hard to estimate in real time — often revised years later."
  },
  "real rate": {
    short: "Nominal policy rate minus expected inflation. The true cost of borrowing.",
    long: "A 5% nominal rate with 3% inflation is a 2% real rate. When real rates go negative, borrowing is effectively subsidized — strongly stimulative."
  },
  "phillips curve": {
    short: "The empirical inverse relationship between unemployment and inflation.",
    long: "Named after A.W. Phillips (1958). Slope varies by regime — steep in the 1970s, flat 2008–2019, potentially steep again post-2022. Not a structural law."
  },
  "taylor rule": {
    short: "John Taylor's 1993 formula that prescribes a policy rate from inflation and the output gap.",
    long: "i = r* + π + 0.5(π − π*) + 0.5(y − y*). Used as a benchmark to judge whether central banks are too hawkish or dovish. Many variants exist."
  },
  "m0": { short: "Base money: physical cash + commercial banks' reserves at the central bank.", long: "Sometimes called 'high-powered money'. The central bank controls it directly." },
  "m1": { short: "M0 + checking deposits. Money immediately spendable.", long: "Includes demand deposits and traveler's checks." },
  "m2": { short: "M1 + savings deposits + small time deposits + retail money market funds.", long: "The broadest commonly-used measure. What most people think of as 'the money supply'." },
  "neutral rate": {
    short: "The policy rate that neither stimulates nor restrains the economy — 'r*' in models.",
    long: "Unobservable; estimated to be ~0.5–1% real in advanced economies. Declined secularly since the 1980s. Matters because a 4% nominal rate is tight if r* is 0.5% but loose if r* is 2%."
  },
  "zlb": {
    short: "Zero Lower Bound — the floor below which policy rates traditionally could not go.",
    long: "Central banks since 2014 have experimented with slightly negative rates (ECB, BoJ), but bank profitability and cash storage costs limit how deeply negative they can go."
  },
  "qe": {
    short: "Quantitative Easing — central bank buys government bonds with newly created reserves.",
    long: "Used when policy rate is at the ZLB. Mechanism: compresses long-term yields, pushes investors into riskier assets. Expands central bank balance sheet."
  },
  "yoy": { short: "Year-over-year: the % change from the same period 12 months earlier.", long: "Standard for inflation reporting. Smooths seasonal variation." },
  "gdp": { short: "Gross Domestic Product: the total value of everything produced inside a country in a year.", long: "Measured three ways (output, income, expenditure) that theoretically agree. 'Real' GDP strips out inflation." },
  "fx": { short: "Foreign exchange — the price of one currency in terms of another.", long: "Floating exchange rates adjust continuously. Persistent depreciation usually reflects chronic inflation differentials or capital flight." },
  "inflation target": {
    short: "The inflation rate a central bank has publicly committed to deliver — typically 2%.",
    long: "First adopted by New Zealand (1990), spread through the 1990s. The Fed formalized 2% only in 2012. Symmetric in principle — deflation is equally unwelcome."
  },
  "fiscal policy": { short: "Government control of taxes and spending.", long: "Typically set annually by legislature. Slower to deploy than monetary policy, but with no zero lower bound." },
  "monetary policy": { short: "Central-bank control of the money supply and short-term interest rates.", long: "Operationally independent in most advanced economies. Primary tool is the policy rate." },
  "debt/gdp": { short: "Government debt divided by annual GDP — the standard solvency yardstick.", long: "A ratio, not a level — means a country with 100% debt/GDP and one with 200% have different implications. What matters is the growth rate minus interest rate." },
  "supply shock": { short: "A sudden change in the cost or availability of inputs — energy, labor, shipping.", long: "Pushes inflation and unemployment in the SAME direction (stagflation). Monetary policy can only address the inflation side." },
  "demand shock": { short: "A sudden change in spending appetite by households, firms, or government.", long: "Pushes inflation and output in the SAME direction. Monetary policy can directly counteract by raising or lowering rates." }
};

function Term({ name, children }) {
  const { on } = useEdu();
  const [open, setOpen] = React.useState(false);
  const key = (name || children || "").toString().toLowerCase();
  const entry = GLOSSARY[key];
  if (!on || !entry) return <>{children || name}</>;
  return (
    <span style={{ position: "relative", display: "inline-block" }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}>
      <span style={{ borderBottom: "1px dotted #8a8474", cursor: "help" }}>
        {children || name}
      </span>
      {open && (
        <span style={{ position: "absolute", bottom: "100%", left: "50%",
                       transform: "translateX(-50%)", marginBottom: 6,
                       width: 280, zIndex: 100, pointerEvents: "none",
                       background: "#0e1116", color: "#fafaf7",
                       padding: "10px 12px", fontSize: 11, lineHeight: 1.5,
                       fontFamily: "Inter, sans-serif",
                       boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                       textAlign: "left" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                        letterSpacing: 1.5, textTransform: "uppercase",
                        color: "#8a8474", marginBottom: 4 }}>
            {children || name}
          </div>
          <div style={{ marginBottom: entry.long ? 6 : 0 }}>{entry.short}</div>
          {entry.long && (
            <div style={{ color: "#a8a090", fontSize: 10.5, lineHeight: 1.45,
                          paddingTop: 6, borderTop: "1px solid #2a2520" }}>
              {entry.long}
            </div>
          )}
        </span>
      )}
    </span>
  );
}

// Section-intro panel. Render at top of each module view.
function WhatYoureLookingAt({ points }) {
  const { on } = useEdu();
  if (!on) return null;
  return (
    <div style={{ background: "#f5f1e8", borderLeft: "3px solid #0e1116",
                  padding: "14px 18px", marginBottom: 24,
                  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 16 }}>
      {points.map((p, i) => (
        <div key={i}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                        letterSpacing: 1.5, textTransform: "uppercase",
                        color: "#8a8474", marginBottom: 4 }}>{p.label}</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: "#0e1116",
                        fontFamily: "'IBM Plex Serif', Georgia, serif" }}>
            {p.text}
          </div>
        </div>
      ))}
    </div>
  );
}

// Single-sentence "read it like an economist" caption below a chart.
function ReadLine({ children }) {
  const { on } = useEdu();
  if (!on) return null;
  return (
    <div style={{ marginTop: 10, padding: "8px 0 0",
                  borderTop: "1px dashed #d8d4cc",
                  display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                     letterSpacing: 1.5, textTransform: "uppercase",
                     color: "#8a8474", whiteSpace: "nowrap",
                     paddingTop: 1 }}>Read it →</span>
      <span style={{ fontSize: 12, lineHeight: 1.5, color: "#3a3530",
                     fontFamily: "'IBM Plex Serif', Georgia, serif",
                     fontStyle: "italic" }}>
        {children}
      </span>
    </div>
  );
}

// Inline toggle — place wherever makes sense in the layout.
function EduToggle({ style = {} }) {
  const { on, toggle } = useEdu();
  return (
    <button onClick={toggle}
      style={{ display: "block", width: "100%", textAlign: "left",
               background: on ? "#0e1116" : "transparent",
               color: on ? "#fafaf7" : "#0e1116",
               border: "1px solid #0e1116",
               padding: "8px 10px", fontSize: 10,
               fontFamily: "JetBrains Mono, monospace",
               letterSpacing: 1.2, textTransform: "uppercase",
               cursor: "pointer", ...style }}>
      {on ? "● Student mode · on" : "○ Student mode · off"}
    </button>
  );
}

Object.assign(window, { EduProvider, useEdu, Term, WhatYoureLookingAt, ReadLine, EduToggle });
