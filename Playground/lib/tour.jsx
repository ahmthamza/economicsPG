// Guided tour — a 6-stop historical walk through the Playground.
// Each stop navigates to a specific app/tab and explains what to look at.

const TOUR_STOPS = [
  {
    n: 1,
    era: "1980",
    kicker: "The Volcker shock",
    title: "How to kill double-digit inflation",
    body: "Paul Volcker raised the Fed Funds rate above 19% in 1981 — causing a deep recession but breaking the 1970s inflation psychology. It became the template every central banker still invokes. Look at Fig.01 on the Rates tab: even the 2022 tightening barely reaches half of Volcker's peak.",
    go: { app: "briefing", tab: "rates" },
    look: "Check the US line around 1981 — the spike above 15%."
  },
  {
    n: 2,
    era: "1990s",
    kicker: "Japan's lost decades",
    title: "When the zero lower bound stops being theoretical",
    body: "After the 1990 asset bust, Japan's inflation hovered near zero for 20 years. The BOJ cut rates to effectively zero and stayed there. It's the live demonstration of what happens when you can't cut further — and why advanced economies since 2008 have studied Japan obsessively.",
    go: { app: "briefing", tab: "inflation" },
    look: "The Japanese CPI line — long stretches below zero, a generation of deflation."
  },
  {
    n: 3,
    era: "2008",
    kicker: "The Global Financial Crisis",
    title: "Central banks discover the nuclear option",
    body: "When Lehman fell, the Fed cut from 5.25% to ~0% in 15 months and invented Quantitative Easing — buying trillions of dollars of bonds with newly created reserves. The balance sheet expanded from $900bn to $4.5tn. For the first time, 'unconventional' monetary policy went mainstream.",
    go: { app: "briefing", tab: "monetary" },
    look: "Play with the Taylor-rule calculator. Set π=0, y-gap=-4%: you'll see why the Fed wanted to cut below zero."
  },
  {
    n: 4,
    era: "2020",
    kicker: "COVID and helicopter money",
    title: "The fastest fiscal-monetary coordination in peacetime",
    body: "Within weeks, the Fed cut to zero, launched unlimited QE, and the US Treasury cut $1,200 checks to households. Other advanced economies followed. M2 grew ~25%. The recovery took quarters, not years — but the bill came due in 2022 as inflation.",
    go: { app: "briefing", tab: "money" },
    look: "The 2020 vertical spike in M2 growth — unprecedented outside wartime."
  },
  {
    n: 5,
    era: "2022",
    kicker: "The inflation shock",
    title: "Synchronized tightening, everywhere",
    body: "Supply chain disruption + energy shock + demand stimulus hangover → advanced-economy inflation to 8–10%. The Fed hiked 525bp in 16 months — the steepest cycle since Volcker. Every major central bank followed. Test this in the Scenario Lab: can you produce inflation without a rate response?",
    go: { app: "lab" },
    look: "Load the 'Inflation 2022' preset and see how different policy responses change the outcome."
  }
];

// Top-bar button that opens the tour. Props: onNavigate({app, tab}).
function TourLauncher({ onNavigate }) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      const stop = TOUR_STOPS[step];
      onNavigate && onNavigate(stop.go);
    }
  }, [open, step]);

  return (
    <>
      <button onClick={() => { setOpen(true); setStep(0); }}
        style={{ background: "transparent", border: "1px solid #2a3140",
                 color: "#dde3ee", padding: "6px 12px",
                 fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                 letterSpacing: 1, cursor: "pointer" }}>
        ✦ GUIDED TOUR
      </button>
      {open && <TourOverlay step={step} setStep={setStep} close={() => setOpen(false)} />}
    </>
  );
}

function TourOverlay({ step, setStep, close }) {
  const stop = TOUR_STOPS[step];
  const last = step === TOUR_STOPS.length - 1;
  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 200,
                  width: 440, background: "#fafaf7",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
                  border: "1px solid #0e1116",
                  fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", background: "#0e1116", color: "#fafaf7",
                    display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                         letterSpacing: 2, color: "#7a8599" }}>
            TOUR · {String(step + 1).padStart(2, "0")}/{String(TOUR_STOPS.length).padStart(2, "0")}
          </span>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                         letterSpacing: 1.5, color: "oklch(0.7 0.15 80)" }}>
            {stop.era}
          </span>
        </div>
        <button onClick={close}
          style={{ background: "transparent", border: "none", color: "#fafaf7",
                   fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}>
          ×
        </button>
      </div>
      {/* Body */}
      <div style={{ padding: "20px 22px 18px" }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                      letterSpacing: 1.5, textTransform: "uppercase",
                      color: "#8a8474", marginBottom: 6 }}>
          {stop.kicker}
        </div>
        <div style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontSize: 20,
                      letterSpacing: -0.4, lineHeight: 1.2, marginBottom: 12 }}>
          {stop.title}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: "#3a3530",
                      fontFamily: "'IBM Plex Serif', Georgia, serif",
                      marginBottom: 14 }}>
          {stop.body}
        </div>
        <div style={{ background: "#f5f1e8", padding: "10px 12px", fontSize: 12,
                      lineHeight: 1.5, color: "#0e1116",
                      borderLeft: "3px solid #0e1116",
                      fontFamily: "'IBM Plex Serif', Georgia, serif" }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                         letterSpacing: 1.5, textTransform: "uppercase",
                         color: "#8a8474", marginRight: 8 }}>Look for</span>
          {stop.look}
        </div>
      </div>
      {/* Dots */}
      <div style={{ display: "flex", gap: 6, padding: "0 22px 14px" }}>
        {TOUR_STOPS.map((_, i) => (
          <button key={i} onClick={() => setStep(i)}
            style={{ width: 22, height: 4, background: i === step ? "#0e1116" : "#d8d4cc",
                     border: "none", cursor: "pointer", padding: 0 }} />
        ))}
      </div>
      {/* Footer */}
      <div style={{ padding: "12px 18px", borderTop: "1px solid #e4e0d6",
                    display: "flex", gap: 10, justifyContent: "space-between" }}>
        <button onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
          style={{ background: "transparent", border: "1px solid #d8d4cc",
                   padding: "8px 14px", fontSize: 11,
                   fontFamily: "JetBrains Mono, monospace", letterSpacing: 1,
                   textTransform: "uppercase",
                   opacity: step === 0 ? 0.3 : 1,
                   cursor: step === 0 ? "default" : "pointer" }}>
          ← Previous
        </button>
        <button onClick={last ? close : () => setStep(step + 1)}
          style={{ background: "#0e1116", color: "#fafaf7", border: "none",
                   padding: "8px 16px", fontSize: 11,
                   fontFamily: "JetBrains Mono, monospace", letterSpacing: 1,
                   textTransform: "uppercase", cursor: "pointer" }}>
          {last ? "Finish ✓" : "Next →"}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { TourLauncher, TOUR_STOPS });
