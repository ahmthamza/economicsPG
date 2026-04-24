// Quiz blocks — per-module. Drop one into any Briefing view.
// <QuizBlock id="rates" /> — reads QUIZZES[id].

const QUIZZES = {
  rates: {
    title: "Test yourself: Interest rates",
    questions: [
      {
        q: "When a central bank raises its policy rate, what usually happens to CPI inflation 12–18 months later?",
        options: ["It rises faster", "It falls (with a lag)", "It stays exactly the same", "It becomes negative immediately"],
        a: 1,
        why: "Tighter money → weaker demand → slower price growth. The lag (called the 'transmission mechanism') is typically 6–18 months. This is why central banks have to act preemptively."
      },
      {
        q: "Japan's policy rate has not exceeded 0.5% for roughly 30 years. What's the most likely explanation?",
        options: ["The BOJ is incompetent", "Persistent deflationary pressure + aging demographics kept inflation below target", "Japanese law prohibits higher rates", "The economy is too small to need them"],
        a: 1,
        why: "Demographic decline + a debt overhang after 1990 = chronic demand weakness and a deflationary bias. Raising rates would have made both worse."
      },
      {
        q: "If CPI is 8% and the policy rate is 5%, what is the real interest rate?",
        options: ["13%", "5%", "−3%", "3%"],
        a: 2,
        why: "Real rate = nominal − inflation = 5% − 8% = −3%. Negative real rates mean borrowers are effectively paid to borrow — strongly stimulative, exactly what you DON'T want during inflation."
      }
    ]
  },
  inflation: {
    title: "Test yourself: Inflation",
    questions: [
      {
        q: "Why did most central banks converge on a 2% inflation target rather than 0%?",
        options: ["Tradition", "Nominal wage rigidity + ZLB headroom: a tiny buffer prevents deflation spirals and gives room to cut rates in recessions", "2% is the average historical inflation rate", "Political pressure"],
        a: 1,
        why: "Wages are sticky downward — firms won't easily cut them. Mild inflation lets real wages adjust without nominal cuts. It also gives a rate-cutting buffer above the zero bound."
      },
      {
        q: "During the 2022 inflation spike, core CPI stayed high even after headline CPI fell. Why?",
        options: ["Measurement error", "Core excludes volatile food & energy — the initial shock was energy-driven, but services inflation persisted", "Core always lags headline by one year", "Core only uses imports"],
        a: 1,
        why: "Headline came down as oil prices normalized. But wage-driven services inflation (rent, healthcare, restaurants) kept core elevated for another year."
      },
      {
        q: "An economy's CPI is rising 4% per year for five years. Purchasing power of a fixed pension falls by roughly:",
        options: ["4%", "20% (5 × 4%)", "About 18%", "Exactly 0% — indexing handles it"],
        a: 2,
        why: "Compounding: (1.04)⁵ ≈ 1.217, so prices are ~21.7% higher, meaning a fixed cash pension buys about 1/1.217 ≈ 82% of what it did — an 18% loss."
      }
    ]
  },
  gdp: {
    title: "Test yourself: GDP",
    questions: [
      {
        q: "Country A has GDP of $10tn and population 300m. Country B has GDP of $2tn and population 50m. Which citizen is 'richer' on average?",
        options: ["Country A ($33k pc)", "Country B ($40k pc)", "Same", "Can't tell without inflation"],
        a: 1,
        why: "$10tn / 300m = $33.3k. $2tn / 50m = $40k. Per-capita is the better welfare proxy; aggregate GDP tells you economic weight."
      },
      {
        q: "Real GDP growth of 2% in a year means:",
        options: ["Prices rose 2%", "Total production rose 2% after removing the effect of price changes", "The population grew 2%", "Exports rose 2%"],
        a: 1,
        why: "'Real' means inflation-adjusted. Nominal GDP growth = real growth + inflation. If nominal GDP rose 6% and inflation was 4%, real growth was 2%."
      },
      {
        q: "During COVID (2020), global GDP contracted by the largest peacetime amount on record. What made the recovery unusual?",
        options: ["It didn't recover", "Unprecedented fiscal + monetary coordination → V-shape rebound in months, not years", "Only China recovered", "It took a full decade like 2008"],
        a: 1,
        why: "Direct transfers + zero rates + massive QE → balance sheets didn't collapse. The recovery took quarters, not the years seen after 2008."
      }
    ]
  },
  money: {
    title: "Test yourself: Money supply",
    questions: [
      {
        q: "Which is the broadest commonly-used money measure?",
        options: ["M0", "M1", "M2", "Gold reserves"],
        a: 2,
        why: "M0 ⊂ M1 ⊂ M2. M2 adds savings and time deposits. Broader measures like M3 exist but are discontinued in the US."
      },
      {
        q: "US M2 grew ~25% in 2020. According to the quantity theory (crudely), what should happen?",
        options: ["Nothing — money is neutral", "Either prices or output must rise sharply, or velocity must fall", "Deflation of 25%", "GDP rises by exactly 25%"],
        a: 1,
        why: "MV = PY. If M jumps 25%, then P, Y, or V must absorb it. In 2020–21 velocity fell (savings bulge), then in 2022 P caught up — inflation."
      },
      {
        q: "QE expands the central bank balance sheet. Does it mechanically create M2?",
        options: ["Yes, directly", "No — QE expands reserves (M0). M2 only expands if banks then lend against those reserves", "Only if the government prints cash", "It always causes hyperinflation"],
        a: 1,
        why: "QE swaps bonds for reserves. Reserves aren't spent by households — they're inside the banking system. M2 only rises if banks choose to expand credit. Post-2008 they mostly didn't."
      }
    ]
  },
  monetary: {
    title: "Test yourself: Monetary policy",
    questions: [
      {
        q: "The Taylor rule prescribes raising rates when:",
        options: ["Inflation falls below target", "Inflation exceeds target OR output exceeds potential", "Always", "Only during elections"],
        a: 1,
        why: "i = r* + π + φπ(π−π*) + φy(y−y*). Higher π or higher y-gap → higher prescribed i. Symmetric: it cuts when both fall."
      },
      {
        q: "What's the 'zero lower bound' problem?",
        options: ["Nominal policy rates can't go meaningfully below zero, so in deep recessions the central bank can't cut further", "Inflation can't go below zero", "The Fed's building is at sea level", "GDP can't be negative"],
        a: 0,
        why: "Cash has zero yield; people would withdraw if rates went deeply negative. This limits how much stimulus conventional policy can give. QE and forward guidance are responses."
      },
      {
        q: "Why do central banks target expectations rather than the current policy rate alone?",
        options: ["Tradition", "Long-term rates, investment decisions, and wage bargaining all depend on expected future rates, not just today's", "They don't", "Markets set rates anyway"],
        a: 1,
        why: "A 30-year mortgage rate reflects the expected path of short rates over 30 years. If the Fed credibly signals a cutting cycle, long rates fall even before any cut happens."
      }
    ]
  },
  phillips: {
    title: "Test yourself: Phillips curve",
    questions: [
      {
        q: "A flat Phillips curve implies:",
        options: ["Unemployment and inflation move together", "Unemployment changes don't translate into inflation changes — expectations well-anchored", "Central banks are obsolete", "Hyperinflation is coming"],
        a: 1,
        why: "If people expect 2% inflation regardless of the labor market, then demand changes move output (and unemployment) without moving prices much. This was the 2008–2019 regime."
      },
      {
        q: "In 2022 unemployment was near historic lows AND inflation hit 9%. Which of these best explains it?",
        options: ["Phillips curve finally worked", "A supply shock (energy, shipping, labor supply) pushed inflation up vertically, outside the Phillips trade-off", "Random noise", "Statistical error"],
        a: 1,
        why: "Classic Phillips: inflation rises as unemployment falls. The 2022 episode wasn't that — it was a supply-side push. The trade-off didn't vanish; it was overridden."
      },
      {
        q: "Why does the Phillips curve slope steepen when inflation gets high?",
        options: ["Magic", "Expectations un-anchor: workers and firms demand bigger wage/price adjustments, so the curve steepens rapidly", "Math error", "Always stays the same"],
        a: 1,
        why: "When people stop believing inflation will return to 2%, they price in expected future inflation into contracts — self-fulfilling acceleration. This is what Volcker had to break in 1980."
      }
    ]
  },
  fx: {
    title: "Test yourself: Exchange rates",
    questions: [
      {
        q: "The Turkish lira has depreciated roughly 10,000× against USD since 1990. Most of this reflects:",
        options: ["Random walk", "Persistent inflation differential: chronic 2-digit lira inflation vs. 2-3% USD inflation compounds into massive depreciation", "US manipulation", "Bad luck"],
        a: 1,
        why: "Purchasing power parity: currencies tend to adjust toward their relative price levels over time. If TR inflates 20%/year and US at 2%, the lira must fall ~18%/year on average."
      },
      {
        q: "Japan's yen traded ~¥80/USD in 2011 and ~¥150 in 2024. For a Japanese exporter, this is:",
        options: ["Bad news — Japanese goods more expensive abroad", "Good news — same yen price looks cheap to foreigners; exports become more competitive", "Neutral", "Irrelevant"],
        a: 1,
        why: "Weak currency = cheap exports. A ¥10,000 product used to cost foreigners $125, now costs $67. Japanese manufacturers love a weak yen; consumers (paying for imports) hate it."
      },
      {
        q: "If a country has higher interest rates than its trading partners, 'carry trade' logic predicts its currency should:",
        options: ["Depreciate", "Appreciate, as investors chase yield (though long-run it depreciates per uncovered interest parity)", "Stay fixed", "Crash"],
        a: 1,
        why: "Short-run: high rates attract capital, currency strengthens. Long-run: the country with higher rates usually also has higher expected inflation, so the currency 'should' weaken to offset — UIP doesn't hold cleanly in practice."
      }
    ]
  },
  fiscal: {
    title: "Test yourself: Fiscal policy",
    questions: [
      {
        q: "Japan's debt/GDP is over 250% — yet bond yields remain low and inflation was below 2% for decades. What explains it?",
        options: ["Miracle", "Domestic savers hold most JGBs + BOJ buys the rest + no inflation for most of that period = no pressure on yields", "Lies", "Hidden taxes"],
        a: 1,
        why: "A country with its own currency, debt in that currency, held largely domestically, at low inflation, faces different constraints than Greece in 2010. The relevant risk isn't default — it's inflation/credibility."
      },
      {
        q: "When r (interest on debt) < g (GDP growth), debt/GDP tends to:",
        options: ["Explode", "Decline automatically, even with modest deficits, because the denominator grows faster than the numerator", "Stay fixed", "Become negative"],
        a: 1,
        why: "This is the 'r-g' argument (Blanchard 2019). When r < g, governments can run primary deficits and still see debt/GDP fall. The US and most advanced economies were in this regime 2010–2021."
      },
      {
        q: "The 2020–21 fiscal-monetary response is sometimes called 'helicopter money light'. Why?",
        options: ["It fell from helicopters literally", "Governments transferred cash to households while central banks bought the debt — close to direct money-financed fiscal stimulus", "It had no effect", "Only rich people got it"],
        a: 1,
        why: "'Pure' helicopter money = CB credits household accounts directly. The 2020 episode was close: treasury cut checks, CB bought treasury debt with new reserves. Combined effect was similar to debt-free transfer."
      }
    ]
  }
};

function QuizBlock({ id }) {
  const quiz = QUIZZES[id];
  const { on } = useEdu();
  const [answers, setAnswers] = React.useState({});
  const [showWhy, setShowWhy] = React.useState({});
  if (!on || !quiz) return null;

  const correct = quiz.questions.filter((q, i) => answers[i] === q.a).length;
  const total = quiz.questions.length;
  const allAnswered = Object.keys(answers).length === total;

  return (
    <div style={{ marginTop: 36, padding: "28px 32px",
                  background: "#f0ece2", borderTop: "2px solid #0e1116" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between",
                    marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                        letterSpacing: 2, textTransform: "uppercase",
                        color: "#8a8474", marginBottom: 6 }}>Self-check</div>
          <div style={{ fontFamily: "'IBM Plex Serif', Georgia, serif",
                        fontSize: 24, letterSpacing: -0.5 }}>
            {quiz.title}
          </div>
        </div>
        {allAnswered && (
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14 }}>
            Score: <b>{correct}/{total}</b>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gap: 20 }}>
        {quiz.questions.map((q, i) => {
          const picked = answers[i];
          const answered = picked !== undefined;
          return (
            <div key={i} style={{ background: "#fafaf7", padding: "16px 18px",
                                  border: "1px solid #e4e0d6" }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                               color: "#8a8474", minWidth: 24 }}>Q{i + 1}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.5,
                               fontFamily: "'IBM Plex Serif', Georgia, serif" }}>
                  {q.q}
                </span>
              </div>
              <div style={{ display: "grid", gap: 6, paddingLeft: 34 }}>
                {q.options.map((opt, oi) => {
                  const isPicked = picked === oi;
                  const isCorrect = q.a === oi;
                  let bg = "transparent", color = "#0e1116", border = "1px solid #d8d4cc";
                  if (answered) {
                    if (isCorrect) { bg = "oklch(0.92 0.08 145)"; border = "1px solid oklch(0.55 0.15 145)"; }
                    else if (isPicked) { bg = "oklch(0.92 0.08 25)"; border = "1px solid oklch(0.55 0.18 25)"; }
                  }
                  return (
                    <button key={oi} onClick={() => !answered && setAnswers(a => ({ ...a, [i]: oi }))}
                      disabled={answered}
                      style={{ textAlign: "left", padding: "8px 12px",
                               background: bg, color, border,
                               cursor: answered ? "default" : "pointer",
                               fontSize: 12.5, lineHeight: 1.4,
                               fontFamily: "Inter, sans-serif" }}>
                      <span style={{ fontFamily: "JetBrains Mono, monospace",
                                     fontSize: 10, color: "#8a8474", marginRight: 8 }}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                      {answered && isCorrect && <span style={{ marginLeft: 8, color: "oklch(0.45 0.15 145)" }}>✓</span>}
                      {answered && isPicked && !isCorrect && <span style={{ marginLeft: 8, color: "oklch(0.5 0.18 25)" }}>✗</span>}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <div style={{ marginTop: 12, marginLeft: 34, padding: "10px 12px",
                              background: "#f5f1e8", fontSize: 12, lineHeight: 1.55,
                              fontFamily: "'IBM Plex Serif', Georgia, serif",
                              color: "#3a3530", borderLeft: "3px solid #0e1116" }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                                 letterSpacing: 1.5, textTransform: "uppercase",
                                 color: "#8a8474", marginRight: 8 }}>Why</span>
                  {q.why}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {allAnswered && (
        <button onClick={() => setAnswers({})}
          style={{ marginTop: 18, padding: "8px 14px",
                   background: "transparent", border: "1px solid #0e1116",
                   fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                   letterSpacing: 1.5, textTransform: "uppercase",
                   cursor: "pointer", color: "#0e1116" }}>
          ↻ Retry
        </button>
      )}
    </div>
  );
}

Object.assign(window, { QuizBlock, QUIZZES });
