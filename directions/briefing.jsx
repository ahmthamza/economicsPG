// DIRECTION A — "The Briefing"
// Editorial dashboard. Restrained, thoughtful annotations, narrative captions.
// 8 modules, navigated via a left sidebar.

const { useState: useStateA, useMemo: useMemoA } = React;

function BriefingApp({ width = 1320, height = 900 }) {
  return <EduProvider initial={true}><BriefingInner width={width} height={height} /></EduProvider>;
}

function BriefingInner({ width, height }) {
  const [tab, setTab] = useStateA("rates");
  const [countries, setCountries] = useStateA(["US", "EZ", "UK", "JP"]);

  React.useEffect(() => {
    const h = (e) => setTab(e.detail);
    window.addEventListener("briefing-set-tab", h);
    return () => window.removeEventListener("briefing-set-tab", h);
  }, []);

  const NAV = [
  { id: "rates", n: "01", label: "Interest rates", sub: "Policy → economy" },
  { id: "inflation", n: "02", label: "Inflation & CPI", sub: "Price dynamics" },
  { id: "gdp", n: "03", label: "GDP & per capita", sub: "Real activity" },
  { id: "money", n: "04", label: "Money supply", sub: "M0 / M1 / M2" },
  { id: "monetary", n: "05", label: "Monetary policy", sub: "Taylor rule, QE" },
  { id: "phillips", n: "06", label: "Phillips curve", sub: "Unemp ↔ inflation" },
  { id: "fx", n: "07", label: "Exchange rates", sub: "FX vs USD" },
  { id: "fiscal", n: "08", label: "Fiscal vs monetary", sub: "Debt & policy mix" },
  { id: "glossary", n: "09", label: "Glossary", sub: "All terms, alphabetical" },
  { id: "sources", n: "10", label: "About the data", sub: "Sources & methods" }];


  const SIDEBAR_W = 240;
  const PAD = 36;

  return (
    <div style={{ width, minHeight: height, background: "#fafaf7",
      fontFamily: "Inter, sans-serif", color: "#0e1116",
      display: "flex" }}>
      {/* Sidebar */}
      <aside style={{ width: SIDEBAR_W, padding: `${PAD}px 24px`, borderRight: "1px solid #e4e0d6" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
            letterSpacing: 2, textTransform: "uppercase", color: "#8a8474" }}>
            The Briefing
          </div>
          <div style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontSize: 22,
            marginTop: 6, letterSpacing: -0.4, lineHeight: 1.1 }}>
            Macroeconomic<br />Playground
          </div>
          <div style={{ fontSize: 11, color: "#8a8474", marginTop: 10 }}>v1 · 1990–2024 · 37 economies

          </div>
        </div>
        <nav>
          {NAV.map((n) =>
          <div key={n.id} onClick={() => setTab(n.id)}
          style={{ padding: "10px 0", borderTop: "1px solid #e4e0d6",
            cursor: "pointer",
            opacity: tab === n.id ? 1 : 0.55,
            transition: "opacity .12s" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                color: "#8a8474", width: 18 }}>{n.n}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: tab === n.id ? 500 : 400 }}>{n.label}</div>
                  <div style={{ fontSize: 10, color: "#8a8474", marginTop: 2 }}>{n.sub}</div>
                </div>
              </div>
            </div>
          )}
          <div style={{ borderTop: "1px solid #e4e0d6" }} />
        </nav>
        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
            letterSpacing: 1.5, textTransform: "uppercase", color: "#8a8474",
            marginBottom: 10 }}>Reader mode</div>
          <EduToggle />
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
            letterSpacing: 1.5, textTransform: "uppercase", color: "#8a8474",
            marginBottom: 10 }}>Compare</div>
          <CountryPicker selected={countries} onChange={setCountries} />
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: `${PAD}px 48px`, overflow: "hidden" }}>
        {tab === "rates" && <RatesView countries={countries} />}
        {tab === "inflation" && <InflationView countries={countries} />}
        {tab === "gdp" && <GdpView countries={countries} />}
        {tab === "money" && <MoneyView countries={countries} />}
        {tab === "monetary" && <MonetaryView />}
        {tab === "phillips" && <PhillipsView countries={countries} />}
        {tab === "fx" && <FxView countries={countries} />}
        {tab === "fiscal" && <FiscalView countries={countries} />}
        {tab === "glossary" && <GlossaryView />}
        {tab === "sources" && <DataSourcesView />}
      </main>
    </div>);

}

// ---------- Headers ----------
function ModuleHead({ kicker, title, dek }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10,
        letterSpacing: 2, textTransform: "uppercase", color: "#8a8474",
        marginBottom: 8 }}>{kicker}</div>
      <h1 style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontSize: 40,
        margin: 0, letterSpacing: -1, lineHeight: 1.05, fontWeight: 400,
        maxWidth: 720 }}>{title}</h1>
      {dek && <p style={{ fontSize: 14, lineHeight: 1.5, color: "#3a3530",
        marginTop: 14, maxWidth: 620, fontFamily: "Inter, sans-serif" }}>{dek}</p>}
    </div>);

}

// ---------- Module: Rates ----------
function RatesView({ countries }) {
  const series = seriesFromData(MACRO_DATA.policyRate, countries);
  const cpiSeries = seriesFromData(MACRO_DATA.cpi, countries.slice(0, 1));
  const events = MACRO_DATA.EVENTS.filter((e) => [2008, 2020, 2022].includes(e.year)).
  map((e) => ({ x: e.year, label: e.label }));
  const lead = countries[0];
  return (
    <>
      <ModuleHead kicker="01 · Interest rates"
      title="The price of borrowing money — set by central banks, felt by everyone."
      dek={<>Policy rates are the lever that transmits <Term name="monetary policy">monetary policy</Term>. When inflation surges, central banks tighten. When growth falters, they cut. The chart below tracks the <Term name="policy rate">policy rate</Term> of major central banks across three full cycles.</>} />

      <WhatYoureLookingAt points={[
        { label: "What is it", text: <>The short-term interest rate set by central banks. Commercial-bank loans, mortgages, and deposits are all priced off it with a lag.</> },
        { label: "Why it matters", text: <>Higher rates = harder to borrow = slower economy + lower inflation. Lower rates = easier credit = faster growth + risk of inflation.</> },
        { label: "What to look for", text: <>Synchronized moves (everyone tightens together), divergence (Japan near zero while others hike), and the shape of each cycle.</> },
      ]} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, marginBottom: 24 }}>
        <Card kicker="Fig. 01" title="Policy rate, year-end (%)">
          <LineChart series={series} height={360} events={events}
          yLabel="% per year" zeroLine />
          <ReadLine>Sharp upward spikes = tightening cycles (crisis response). Plateaus near zero = the 2009–2021 ZLB era. Turkey and Brazil visibly operate in a different rate regime.</ReadLine>
        </Card>
        <div>
          {countries.map((c) => {
            const last = latestNonNull(MACRO_DATA.policyRate[c]);
            const prev = MACRO_DATA.policyRate[c].slice(-2)[0];
            return <KPI key={c} label={MACRO_DATA.COUNTRIES[c].name}
            value={last?.value?.toFixed(2) ?? "—"} unit="%"
            change={last && prev?.value != null ? last.value - prev.value : null}
            sub={`as of ${last?.year}`} />;
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card kicker="Fig. 02" title={`${MACRO_DATA.COUNTRIES[lead].name}: rate vs inflation`}>
          <LineChart
            series={[
            { id: "r", label: "Policy", color: "oklch(0.55 0.18 25)",
              points: MACRO_DATA.policyRate[lead].map((d) => ({ x: d.year, y: d.value })) },
            { id: "cpi", label: "CPI", color: "oklch(0.55 0.15 250)",
              points: MACRO_DATA.cpi[lead].map((d) => ({ x: d.year, y: d.value })) }]
            }
            height={300} events={events.slice(0, 2)} yLabel="%" zeroLine />
          <ReadLine>When the policy line (red) leads the CPI line (blue) downward, tightening is "working". When CPI races ahead while rates lag, the central bank is behind the curve.</ReadLine>
        </Card>
        <Card kicker="Editor's note" title="What to look for">
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "#3a3530",
            fontFamily: "'IBM Plex Serif', Georgia, serif" }}>
            <p style={{ marginTop: 0 }}>
              Three regimes stand out. <b>1990–2007</b>: the Great Moderation — rates ratchet down as
              inflation stays anchored. <b>2008–2021</b>: the zero lower bound era — Western central
              banks pinned at ~0%, while emerging markets ran hot. <b>2022–</b>: the synchronized
              tightening as supply shocks pushed CPI into the high single digits.
            </p>
            <p>
              Japan is the outlier across all three regimes — its policy rate has not exceeded 0.5%
              for nearly 30 years. Compare it to Turkey, where rates above 40% remain a live tool.
            </p>
          </div>
        </Card>
      </div>
      <QuizBlock id="rates" />
    </>);

}

// ---------- Module: Inflation ----------
function InflationView({ countries }) {
  const safeCountries = countries.filter((c) => c !== "BR" && c !== "TR"); // log scale would be needed
  const display = safeCountries.length ? safeCountries : ["US", "EZ"];
  const cpiSeries = seriesFromData(MACRO_DATA.cpi, display);
  const events = MACRO_DATA.EVENTS.filter((e) => [2008, 2020, 2022].includes(e.year)).
  map((e) => ({ x: e.year, label: e.label }));
  return (
    <>
      <ModuleHead kicker="02 · Inflation & CPI"
      title="The slow-burning tax on cash. Anchored, until it isn't."
      dek={<>The <Term name="cpi">Consumer Price Index</Term> measures the basket of what households buy. A 2% <Term name="inflation target">target</Term> — the modern central bank consensus — emerged from the 1990s. The 2022 shock was the first test in a generation.</>} />

      <WhatYoureLookingAt points={[
        { label: "What is it", text: <>CPI tracks how much more (or less) you pay this year vs. last year for the same basket of groceries, rent, transport, and services.</> },
        { label: "Why 2%", text: <>Low enough to feel stable; high enough to leave room to cut rates in a recession and avoid deflation traps.</> },
        { label: "What to look for", text: <>The 2022 breakout above 8% in advanced economies — the first since the early 1990s — and how long it takes to return to target.</> },
      ]} />

      <Card kicker="Fig. 01" title="CPI inflation, % year-over-year">
        <LineChart series={cpiSeries} height={380} events={events}
        yLabel="% yoy" zeroLine
        yDomain={[-2, Math.max(12, ...cpiSeries.flatMap((s) => s.points.map((p) => p.y || 0)))]} />
        <div style={{ fontSize: 11, color: "#8a8474", marginTop: 8,
          fontFamily: "Inter, sans-serif" }}>
          The dashed grey line at zero marks deflation territory. Japan spent 1999–2012 below it.
        </div>
        <ReadLine>Lines clustered near 2% = expectations anchored. A synchronized spike = a global supply shock (energy, shipping). Divergence = country-specific policy failure.</ReadLine>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        <Card kicker="Fig. 02" title="Brazil and Turkey, on log scale">
          <LineChart
            series={["BR", "TR"].map((c) => ({
              id: c, label: MACRO_DATA.COUNTRIES[c].name,
              color: MACRO_DATA.COUNTRIES[c].color,
              points: MACRO_DATA.cpi[c].
              map((d) => ({ x: d.year, y: d.value != null ? Math.log10(Math.max(0.5, d.value)) : null }))
            }))}
            height={280} yLabel="log₁₀(% yoy)" />
          <div style={{ fontSize: 11, color: "#8a8474", marginTop: 8 }}>
            Brazil's 1993 hyperinflation peaked near 2,500% — three orders of magnitude above today.
          </div>
        </Card>
        <Card kicker="Editor's note" title="The 2% target, and why it broke">
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "#3a3530",
            fontFamily: "'IBM Plex Serif', Georgia, serif" }}>
            <p style={{ marginTop: 0 }}>
              The 2% inflation target is a 1990s invention — first adopted by New Zealand in 1990,
              spreading to the Bank of England (1997) and Federal Reserve (2012). It assumes
              inflation expectations remain "anchored": households and firms keep negotiating
              wages and prices as if 2% will hold.
            </p>
            <p>
              The 2022 episode tested that anchor. Headline CPI in the US, UK, and eurozone
              breached 8–10%. So far, expectations have held — surveys still cluster near target —
              but the cost was the steepest tightening cycle since Volcker.
            </p>
          </div>
        </Card>
      </div>
      <QuizBlock id="inflation" />
    </>);

}

// ---------- Module: GDP ----------
function GdpView({ countries }) {
  const growthSeries = seriesFromData(MACRO_DATA.gdpGrowth, countries);
  const pcSeries = seriesFromData(MACRO_DATA.gdpPerCapita, countries);
  return (
    <>
      <ModuleHead kicker="03 · GDP & per capita"
      title="Real output, in the aggregate and per person."
      dek={<><Term name="gdp">GDP</Term> measures the value of everything produced. Per-capita is the closer proxy for living standards. The gaps between economies have closed dramatically since 1990 — but the level differences remain enormous.</>} />

      <WhatYoureLookingAt points={[
        { label: "What is it", text: <>Aggregate GDP = total production. Per-capita = GDP divided by population — what the average person produces (and roughly earns).</> },
        { label: "Why both", text: <>A large country can have a huge GDP but low living standards. Per-capita reveals productivity and wealth; aggregate reveals economic weight.</> },
        { label: "What to look for", text: <>The 2008 and 2020 troughs — how deep and how fast each economy recovered tells you about resilience.</> },
      ]} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card kicker="Fig. 01" title="Real GDP growth, % yoy">
          <LineChart series={growthSeries} height={320} zeroLine yLabel="% yoy"
          events={MACRO_DATA.EVENTS.filter((e) => [2008, 2020].includes(e.year)).map((e) => ({ x: e.year, label: e.label }))} />
        </Card>
        <Card kicker="Fig. 02" title="GDP per capita (current USD)">
          <LineChart series={pcSeries} height={320} yLabel="USD"
          formatY={(v) => "$" + fmt(v)} />
        </Card>
      </div>

      <Card kicker="Fig. 03" title="2024 snapshot — GDP per capita ranked">
        <BarChart
          data={COUNTRY_ORDER.
          filter((c) => hasDataFor(c, "gdpPerCapita")).
          map((c) => {
            const last = latestNonNull(MACRO_DATA.gdpPerCapita[c]);
            return { label: c, value: last?.value || 0,
              color: MACRO_DATA.COUNTRIES[c].color };
          }).
          sort((a, b) => b.value - a.value)}
          color={(d) => d.color} height={240} />
      </Card>
      <QuizBlock id="gdp" />
    </>);

}

// ---------- Module: Money ----------
function MoneyView({ countries }) {
  const m2 = seriesFromData(MACRO_DATA.m2Growth, countries);
  return (
    <>
      <ModuleHead kicker="04 · Money supply"
      title="M0, M1, M2 — the layered cake of money."
      dek={<><Term name="m0">M0</Term> is base money: physical cash plus bank reserves at the central bank. <Term name="m1">M1</Term> adds checking deposits. <Term name="m2">M2</Term> adds savings and time deposits. Most everyday spending power lives in M2.</>} />

      <WhatYoureLookingAt points={[
        { label: "What is it", text: <>The total quantity of money circulating in the economy. Layered from narrowest (M0 = cash + reserves) to broadest (M2 = cash + all major deposits).</> },
        { label: "Why it matters", text: <>When money grows much faster than output, prices usually rise. The 2020 surge in M2 preceded the 2022 inflation spike.</> },
        { label: "What to look for", text: <>The ratio of M2 to GDP (how "monetized" the economy is) and the growth rate of M2 relative to its long-run average.</> },
      ]} />

      <Card kicker="Fig. 01" title="2024 money stocks by aggregate (local currency)">
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {COUNTRY_ORDER.filter((c) => MACRO_DATA.moneyStocks[c]).map((c) => {
            const m = MACRO_DATA.moneyStocks[c];
            const max = Math.max(m.M0, m.M1, m.M2);
            const Bar = ({ label, val, color }) =>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ width: 22, fontFamily: "JetBrains Mono, monospace",
                fontSize: 9, color: "#8a8474" }}>{label}</span>
                <div style={{ flex: 1, height: 8, background: "#f0ece2" }}>
                  <div style={{ height: "100%", width: `${val / max * 100}%`, background: color }} />
                </div>
                <span style={{ width: 50, fontFamily: "JetBrains Mono, monospace",
                fontSize: 10, textAlign: "right" }}>
                  {val >= 100 ? val.toFixed(0) : val.toFixed(2)}
                </span>
              </div>;

            return (
              <div key={c} style={{ borderTop: "1px solid #e4e0d6", padding: "10px 0" }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4,
                  display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999,
                    background: MACRO_DATA.COUNTRIES[c].color, display: "inline-block" }} />
                  {MACRO_DATA.COUNTRIES[c].name}
                </div>
                <div style={{ fontSize: 9, color: "#8a8474", fontFamily: "JetBrains Mono, monospace",
                  marginBottom: 6 }}>{m.unit}</div>
                <Bar label="M0" val={m.M0} color="oklch(0.4 0.05 25)" />
                <Bar label="M1" val={m.M1} color="oklch(0.55 0.10 25)" />
                <Bar label="M2" val={m.M2} color={MACRO_DATA.COUNTRIES[c].color} />
              </div>);

          })}
        </div>
      </Card>

      <div style={{ marginTop: 24 }}>
        <Card kicker="Fig. 02" title="M2 growth rate, % yoy">
          <LineChart series={m2} height={300} yLabel="% yoy" zeroLine
          events={[{ x: 2020, label: "COVID stimulus" }]} />
          <div style={{ fontSize: 11, color: "#8a8474", marginTop: 8,
            fontFamily: "Inter, sans-serif" }}>
            The 2020–21 surge in US M2 growth (~25% peak) is unprecedented in the post-war record.
            It coincided with the largest fiscal transfer in peacetime history.
          </div>
        </Card>
      </div>
      <QuizBlock id="money" />
    </>);

}

// ---------- Module: Monetary policy (Taylor calculator + simulation) ----------
function MonetaryView() {
  const [pi, setPi] = useStateA(3.0);
  const [piStar, setPiStar] = useStateA(2.0);
  const [yGap, setYGap] = useStateA(0.5);
  const [rStar, setRStar] = useStateA(0.5);
  const [phiPi, setPhiPi] = useStateA(0.5);
  const [phiY, setPhiY] = useStateA(0.5);

  const taylor = taylorRate({ rStar, piStar, pi, output_gap: yGap, phiPi, phiY });

  // Simulate a 2022-like supply shock under different policy responses
  const N = 16;
  const shockArr = Array.from({ length: N }, (_, t) => t < 3 ? 3.0 : t < 6 ? 1.5 : 0);
  const sims = {
    aggressive: simulate({ N, supplyShock: shockArr, phiPi: 1.5, phiY: 0.5 }),
    standard: simulate({ N, supplyShock: shockArr, phiPi: 0.5, phiY: 0.5 }),
    dovish: simulate({ N, supplyShock: shockArr, phiPi: 0.2, phiY: 1.0 })
  };

  return (
    <>
      <ModuleHead kicker="05 · Monetary policy"
      title="The Taylor rule, and what happens when central banks follow it (or don't)."
      dek={<>John Taylor's 1993 rule prescribed a policy rate based on inflation and the <Term name="output gap">output gap</Term>. It became the canonical benchmark — cited even by central bankers who don't strictly follow it.</>} />

      <WhatYoureLookingAt points={[
        { label: "What is it", text: <>A formula that translates current inflation and economic slack into a prescribed policy rate. Simple, transparent, benchmarkable.</> },
        { label: "How to play", text: <>Move the sliders. Each click updates a live calculation and compares your prescribed rate to what the Fed is actually doing.</> },
        { label: "Why it's famous", text: <>It captures the rate that most central banks end up near — without pretending that policy reduces to arithmetic.</> },
      ]} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, marginBottom: 24 }}>
        <Card kicker="Calculator" title="Taylor rule">
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11,
            background: "#f5f1e8", padding: 12, marginBottom: 16,
            color: "#3a3530", lineHeight: 1.6 }}>
            i = r* + π + φ<sub>π</sub>(π − π*) + φ<sub>y</sub>(y − y*)
          </div>
          <Slider label="Current inflation π" min={-2} max={15} step={0.1} value={pi} onChange={setPi} unit="%" />
          <Slider label="Inflation target π*" min={0} max={5} step={0.1} value={piStar} onChange={setPiStar} unit="%" />
          <Slider label="Output gap (y − y*)" min={-6} max={6} step={0.1} value={yGap} onChange={setYGap} unit="%" />
          <Slider label="Neutral real rate r*" min={-1} max={3} step={0.1} value={rStar} onChange={setRStar} unit="%" />
          <Slider label="Inflation weight φπ" min={0} max={2} step={0.1} value={phiPi} onChange={setPhiPi} />
          <Slider label="Output weight φy" min={0} max={2} step={0.1} value={phiY} onChange={setPhiY} />
        </Card>

        <Card kicker="Output" title="Prescribed policy rate">
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 96,
            fontWeight: 400, letterSpacing: -3, lineHeight: 1,
            margin: "20px 0",
            color: taylor > 5 ? "oklch(0.55 0.18 25)" : taylor < 1 ? "oklch(0.55 0.15 250)" : "#0e1116" }}>
            {taylor.toFixed(2)}<span style={{ fontSize: 40, color: "#8a8474" }}>%</span>
          </div>
          <div style={{ fontSize: 12, color: "#3a3530", lineHeight: 1.6,
            fontFamily: "'IBM Plex Serif', Georgia, serif" }}>
            With your inputs, the rule prescribes a {taylor.toFixed(2)}% policy rate. The current
            US Fed Funds rate is 4.50%. The rule implies {taylor > 4.5 ? "the Fed is too dovish" :
            taylor < 4.5 ? "the Fed is too hawkish" : "the Fed is roughly on track"}.
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e4e0d6" }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
              letterSpacing: 1.5, textTransform: "uppercase",
              color: "#8a8474", marginBottom: 8 }}>Decomposition</div>
            <Row label="Neutral nominal (r* + π*)" value={(rStar + piStar).toFixed(2)} />
            <Row label="Inflation surprise φπ(π − π*)" value={(phiPi * (pi - piStar)).toFixed(2)} signed />
            <Row label="Activity φy(y − y*)" value={(phiY * yGap).toFixed(2)} signed />
            <Row label="Drift (π − π*)" value={(pi - piStar).toFixed(2)} signed />
          </div>
        </Card>
      </div>

      <Card kicker="Fig. 02" title="Supply shock simulation: three policy responses">
        <div style={{ fontSize: 12, color: "#3a3530", marginBottom: 12, lineHeight: 1.6,
          fontFamily: "'IBM Plex Serif', Georgia, serif", maxWidth: 720 }}>
          A persistent supply shock (e.g. energy prices) hits inflation for 6 quarters. Three
          central banks respond with different Taylor weights. Watch how inflation, unemployment,
          and the policy rate co-evolve over 16 periods.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
          { id: "aggressive", color: "oklch(0.55 0.18 25)", title: "Aggressive (φπ=1.5)" },
          { id: "standard", color: "#0e1116", title: "Standard (φπ=0.5)" },
          { id: "dovish", color: "oklch(0.55 0.15 250)", title: "Dovish (φπ=0.2)" }].
          map((c) =>
          <div key={c.id}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>{c.title}</div>
              <LineChart
              series={[
              { id: "i", label: "Rate", color: c.color,
                points: sims[c.id].map((d) => ({ x: d.t, y: d.i })) },
              { id: "pi", label: "Inflation", color: c.color + "88",
                points: sims[c.id].map((d) => ({ x: d.t, y: d.pi })) },
              { id: "u", label: "Unemp", color: "#0e1116",
                points: sims[c.id].map((d) => ({ x: d.t, y: d.u })) }]
              }
              width={400} height={200} zeroLine />
            </div>
          )}
        </div>
      </Card>
      <QuizBlock id="monetary" />
    </>);

}

function Row({ label, value, signed = false }) {
  const num = parseFloat(value);
  return (
    <div style={{ display: "flex", justifyContent: "space-between",
      padding: "4px 0", fontSize: 12 }}>
      <span style={{ color: "#3a3530" }}>{label}</span>
      <span style={{ fontFamily: "JetBrains Mono, monospace",
        color: signed ? num >= 0 ? "oklch(0.55 0.15 145)" : "oklch(0.55 0.18 25)" : "#0e1116" }}>
        {signed && num >= 0 ? "+" : ""}{value}
      </span>
    </div>);

}

// ---------- Module: Phillips ----------
function PhillipsView({ countries }) {
  const lead = countries[0] || "US";
  const c = MACRO_DATA.cpi[lead];
  const u = MACRO_DATA.unemployment[lead];
  const points = c.map((d, i) => ({
    x: u[i]?.value, y: d.value,
    label: d.year % 5 === 0 ? String(d.year).slice(2) : null,
    color: d.year >= 2020 ? "oklch(0.55 0.18 25)" : d.year >= 2008 ? "oklch(0.55 0.15 250)" : "#0e1116",
    opacity: 0.85
  })).filter((p) => p.x != null && p.y != null);

  return (
    <>
      <ModuleHead kicker="06 · Phillips curve"
      title="The trade-off that wasn't always there."
      dek={<>A.W. Phillips noticed in 1958 that British wage inflation moved inversely to unemployment. The relationship has shifted, flattened, vanished, and returned across regimes — a reminder that the <Term name="phillips curve">Phillips curve</Term> is not a structural law but a regime-dependent regularity.</>} />

      <WhatYoureLookingAt points={[
        { label: "What is it", text: <>A scatter plot of unemployment (x) against inflation (y) — each dot is one year.</> },
        { label: "What a curve means", text: <>A downward-sloping cloud = higher unemployment cools inflation, so the central bank has to choose a trade-off.</> },
        { label: "What flat means", text: <>Inflation doesn't respond to slack — either expectations are well-anchored, or the curve is temporarily dormant.</> },
      ]} />

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
        <Card kicker="Fig. 01" title={`${MACRO_DATA.COUNTRIES[lead].name}: scatter of (unemployment, inflation), 1990–2024`}>
          <Scatter data={points} width={520} height={400}
          xLabel="Unemployment, %" yLabel="CPI inflation, % yoy" />
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 10,
            color: "#8a8474", fontFamily: "Inter, sans-serif" }}>
            <span><span style={{ display: "inline-block", width: 8, height: 8,
                background: "#0e1116", marginRight: 6 }} />1990–2007</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8,
                background: "oklch(0.55 0.15 250)", marginRight: 6 }} />2008–2019</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8,
                background: "oklch(0.55 0.18 25)", marginRight: 6 }} />2020–2024</span>
          </div>
        </Card>
        <Card kicker="Editor's note" title="Reading the curve">
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "#3a3530",
            fontFamily: "'IBM Plex Serif', Georgia, serif" }}>
            <p style={{ marginTop: 0 }}>
              In the 1990s and 2000s the cloud sits in a tight band — unemployment 4–6%,
              inflation 2–4%. The slope is gentle but visible.
            </p>
            <p>
              Post-2008 the relationship "flattens": unemployment ranged from 4% to 10% but
              inflation barely moved. Many concluded the Phillips curve was dead.
            </p>
            <p>
              The 2022 cluster (red) reasserts the trade-off, but vertically. Inflation jumped
              to 8% with unemployment near record lows — a textbook supply-shock regime.
            </p>
          </div>
        </Card>
      </div>
      <QuizBlock id="phillips" />
    </>);

}

// ---------- Module: FX ----------
function FxView({ countries }) {
  const others = countries.filter((c) => c !== "US");
  const display = others.length ? others : ["EZ", "JP", "TR"];
  // index to 100 at first non-null year
  const series = display.map((c) => {
    const arr = MACRO_DATA.fxUsd[c];
    const first = arr.find((d) => d.value != null)?.value;
    return {
      id: c, label: MACRO_DATA.COUNTRIES[c].name,
      color: MACRO_DATA.COUNTRIES[c].color,
      points: arr.map((d) => ({ x: d.year, y: d.value != null && first ? d.value / first * 100 : null }))
    };
  });

  return (
    <>
      <ModuleHead kicker="07 · Exchange rates"
      title="What a dollar buys, indexed to 100 at series start."
      dek={<>Currencies float against each other. Persistent depreciation often signals chronic inflation, capital flight, or a current-account problem. The Turkish lira chart below is a generation-long story compressed into one line.</>} />

      <WhatYoureLookingAt points={[
        { label: "What is it", text: <>The price of a country's currency in US dollars — how many lira, yen, or euros it takes to buy one dollar.</> },
        { label: "Why indexed", text: <>Starting every series at 100 lets you compare % changes across very different nominal levels (¥150 vs. ₺30+ vs. €0.9).</> },
        { label: "What to look for", text: <>Smooth lines = stable monetary regime. Step changes = devaluations. Exponential climbs = persistent inflation differentials.</> },
      ]} />

      <Card kicker="Fig. 01" title="Local currency per USD, indexed (start = 100)">
        <LineChart series={series} height={380}
        yLabel="index" />
        <div style={{ fontSize: 11, color: "#8a8474", marginTop: 8 }}>
          Higher = more depreciated. The yen line is essentially flat over 35 years; the lira has risen
          ~10,000×.
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 }}>
        {display.slice(0, 4).map((c) => {
          const arr = MACRO_DATA.fxUsd[c];
          const last = arr[arr.length - 1];
          return (
            <Card key={c} kicker={c}
            title={`${MACRO_DATA.COUNTRIES[c].currency}/USD`} padding={14}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 22,
                fontWeight: 500, marginBottom: 6 }}>
                {last.value < 1 ? last.value.toFixed(2) : last.value < 100 ? last.value.toFixed(2) : last.value.toFixed(0)}
              </div>
              <Sparkline values={arr.map((d) => d.value)} width={140} height={32}
              color={MACRO_DATA.COUNTRIES[c].color} fill />
            </Card>);

        })}
      </div>
      <QuizBlock id="fx" />
    </>);

}

// ---------- Module: Fiscal ----------
function FiscalView({ countries }) {
  const debt = seriesFromData(MACRO_DATA.debtGdp, countries);
  return (
    <>
      <ModuleHead kicker="08 · Fiscal vs monetary"
      title="Two levers, one economy."
      dek={<><Term name="fiscal policy">Fiscal policy</Term> spends; <Term name="monetary policy">monetary policy</Term> borrows. The two operate on different time scales and answer to different masters. Their interaction — coordinated or otherwise — defines the macro regime.</>} />

      <WhatYoureLookingAt points={[
        { label: "Fiscal", text: <>Set by government: tax rates, transfers, infrastructure spend. Slow to deploy (legislation), but directly hits pockets.</> },
        { label: "Monetary", text: <>Set by central bank: policy rate, asset purchases. Fast, but works through credit markets, which lag 6–18 months.</> },
        { label: "Debt/GDP", text: <>Not a scary number by itself. What matters is whether the interest rate on the debt is above or below the growth rate of the economy.</> },
      ]} />

      <Card kicker="Fig. 01" title="Government debt, % of GDP">
        <LineChart series={debt} height={340} yLabel="% of GDP"
        events={[{ x: 2008, label: "GFC" }, { x: 2020, label: "COVID" }]} />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        <Card kicker="Concept" title="Who does what">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e4e0d6" }}>
                <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 500, color: "#8a8474",
                  fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}></th>
                <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 500, color: "#8a8474",
                  fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Fiscal</th>
                <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 500, color: "#8a8474",
                  fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Monetary</th>
              </tr>
            </thead>
            <tbody>
              {[
              ["Authority", "Treasury / Parliament", "Central bank"],
              ["Lever", "Spending & tax", "Policy rate, QE"],
              ["Time lag", "6–18 months", "9–18 months"],
              ["Targets", "Output, employment", "Inflation"],
              ["Constraint", "Debt sustainability", "ZLB, credibility"]].
              map((r) =>
              <tr key={r[0]} style={{ borderBottom: "1px solid #f0ece2" }}>
                  <td style={{ padding: "10px 0", fontWeight: 500 }}>{r[0]}</td>
                  <td style={{ padding: "10px 8px 10px 0", color: "#3a3530",
                  fontFamily: "'IBM Plex Serif', Georgia, serif" }}>{r[1]}</td>
                  <td style={{ padding: "10px 0", color: "#3a3530",
                  fontFamily: "'IBM Plex Serif', Georgia, serif" }}>{r[2]}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
        <Card kicker="Editor's note" title="The post-2020 blur">
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "#3a3530",
            fontFamily: "'IBM Plex Serif', Georgia, serif" }}>
            <p style={{ marginTop: 0 }}>
              The 2020–21 response was the cleanest example of fiscal-monetary co-ordination in
              decades. Treasuries cut checks; central banks bought the bonds.
            </p>
            <p>
              The Japanese debt ratio above 250% is the live experiment: a central bank that
              owns half its sovereign's bonds, financed at zero, with no inflation crisis until
              2022. Whether that was luck, demographics, or genuine demonstration of fiscal
              capacity is the most expensive open question in macro.
            </p>
          </div>
        </Card>
      </div>
      <QuizBlock id="fiscal" />
    </>);

}

Object.assign(window, { BriefingApp });