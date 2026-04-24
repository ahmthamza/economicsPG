// Data sources & methodology — full-page tab for The Briefing.
// Builds trust by showing where the numbers come from.

function DataSourcesView() {
  const SOURCES = [
    { metric: "Policy rates", source: "FRED, central bank historical series",
      coverage: "1990–2024, 15 economies directly; remainder via IMF IFS",
      note: "Year-end (Dec 31) observation. Rounded to 2 dp. For Türkiye, TCMB 1-week repo (current) and O/N (legacy pre-2010)." },
    { metric: "CPI (headline)", source: "World Bank WDI · FP.CPI.TOTL.ZG, FRED CPIAUCSL",
      coverage: "1990–2024, all 37 economies",
      note: "% year-over-year. Not seasonally adjusted. Brazil pre-1994 reflects Real Plan redenomination." },
    { metric: "Real GDP growth", source: "World Bank WDI · NY.GDP.MKTP.KD.ZG",
      coverage: "1990–2024, 34 economies; missing: KZ pre-1993, RU pre-1993",
      note: "Annual % change in constant local currency. IMF WEO used where WDI lags." },
    { metric: "GDP per capita", source: "World Bank WDI · NY.GDP.PCAP.CD",
      coverage: "1990–2024, all 37 economies",
      note: "Current USD, market exchange rates. For PPP comparisons, adjust separately." },
    { metric: "Unemployment", source: "World Bank WDI · SL.UEM.TOTL.ZS (ILO harmonized)",
      coverage: "1991–2024, 32 economies",
      note: "ILO definition (active job search in last 4 weeks). Comparability is imperfect across labor-market structures." },
    { metric: "Money supply (M0/M1/M2)", source: "National central banks, IMF IFS",
      coverage: "2024 snapshot for 8 major economies",
      note: "Units vary by country (shown on each bar). M2 definition differs slightly — US and EZ include retail MMFs, Japan uses M2+CDs." },
    { metric: "FX vs USD", source: "FRED DEXUSEU / DEXJPUS / etc., BIS broad indices",
      coverage: "1990–2024, 36 economies (US excluded)",
      note: "Spot end-of-period. Indexed to 100 at series start. For EZ pre-1999, synthetic ECU/euro." },
    { metric: "Government debt / GDP", source: "IMF GDD, OECD Economic Outlook, World Bank",
      coverage: "1990–2024, 28 economies with full coverage",
      note: "General government gross debt. Excludes liabilities of public corporations and implicit pension debt." },
    { metric: "Historical events annotations", source: "Author curation",
      coverage: "1990–2024",
      note: "Selected global regime breaks (1994 Mexican peso, 1997 Asian crisis, 2008 GFC, 2020 COVID, 2022 inflation, 2023 Credit Suisse)." }
  ];

  return (
    <>
      <ModuleHead kicker="About the data"
        title="Where the numbers come from, and how to read them."
        dek="Every chart in this Playground is backed by public, attributable data. This page lists the sources, units, coverage, and known caveats for each metric — because a chart without a source is a chart you can't argue with." />

      <div style={{ background: "#f5f1e8", padding: "16px 20px", marginBottom: 28,
                    fontSize: 12.5, lineHeight: 1.6,
                    fontFamily: "'IBM Plex Serif', Georgia, serif", color: "#3a3530",
                    borderLeft: "3px solid #0e1116" }}>
        Data is baked into the app as a static snapshot compiled from public sources in late 2024.
        This is by design: it guarantees offline reproducibility, but it does mean the most
        recent quarter may lag the live figure at your central bank. For production forecasting,
        connect to the primary source directly.
      </div>

      <Card kicker="Fig. 01" title="Sources by metric">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12,
                        fontFamily: "Inter, sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #0e1116" }}>
              {["Metric", "Source", "Coverage", "Methodology note"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px 10px 0",
                                     fontSize: 10, color: "#8a8474",
                                     textTransform: "uppercase", letterSpacing: 1.5,
                                     fontFamily: "JetBrains Mono, monospace",
                                     fontWeight: 500,
                                     width: h === "Methodology note" ? "38%" :
                                             h === "Metric" ? "16%" : "23%" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SOURCES.map(s => (
              <tr key={s.metric} style={{ borderBottom: "1px solid #e4e0d6", verticalAlign: "top" }}>
                <td style={{ padding: "14px 12px 14px 0", fontWeight: 500,
                             fontFamily: "'IBM Plex Serif', Georgia, serif", fontSize: 13 }}>
                  {s.metric}
                </td>
                <td style={{ padding: "14px 12px 14px 0", color: "#3a3530",
                             fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                  {s.source}
                </td>
                <td style={{ padding: "14px 12px 14px 0", color: "#3a3530", fontSize: 12 }}>
                  {s.coverage}
                </td>
                <td style={{ padding: "14px 0", color: "#5a5349", fontSize: 12,
                             lineHeight: 1.5, fontStyle: "italic",
                             fontFamily: "'IBM Plex Serif', Georgia, serif" }}>
                  {s.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        <Card kicker="Note" title="Country coverage">
          <div style={{ fontSize: 12.5, lineHeight: 1.6,
                        fontFamily: "'IBM Plex Serif', Georgia, serif", color: "#3a3530" }}>
            <p style={{ marginTop: 0 }}>
              37 economies covering ~85% of world GDP. Representation is intentional: all G7,
              BRICS+, major emerging markets, and instructive outliers (Türkiye for chronic
              inflation, Japan for deflation + ZLB, Argentina for policy failure).
            </p>
            <p>
              Eurozone (EZ) is treated as a single economy where ECB-level data exists
              (policy rate, ECB balance sheet), and aggregate-country data for the rest.
              Individual EZ members (DE, FR, IT, ES, NL, etc.) appear separately where useful.
            </p>
            <p style={{ marginBottom: 0 }}>
              For economies with missing observations, charts show gaps rather than interpolation.
              Gaps are more honest than fake points.
            </p>
          </div>
        </Card>
        <Card kicker="Note" title="Model calibration">
          <div style={{ fontSize: 12.5, lineHeight: 1.6,
                        fontFamily: "'IBM Plex Serif', Georgia, serif", color: "#3a3530" }}>
            <p style={{ marginTop: 0 }}>
              The Taylor-rule calculator, Phillips curve scatter, and Sandbox IS-LM defaults
              are initialized from rolling 5-year means of the focus country. Changing country
              recalibrates — so "what would the Fed prescribe" and "what would the TCMB prescribe"
              use different r*, π*, and Phillips slope.
            </p>
            <p style={{ marginBottom: 0 }}>
              Scenario Lab simulations use a stylized 4-equation New Keynesian skeleton
              (IS, Phillips, Taylor, expectations). Outcomes are illustrative, not forecasts.
              The Lab is a teaching tool, not a model the Fed uses.
            </p>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card kicker="Citation" title="If you use this in your own work">
          <div style={{ fontSize: 12.5, lineHeight: 1.6,
                        fontFamily: "'IBM Plex Serif', Georgia, serif", color: "#3a3530" }}>
            <p style={{ marginTop: 0 }}>
              Cite the primary data source (FRED, WDI, IMF), not this Playground. Example:
            </p>
            <div style={{ background: "#f5f1e8", padding: "10px 14px", marginTop: 10,
                          fontFamily: "JetBrains Mono, monospace", fontSize: 11, lineHeight: 1.55,
                          color: "#0e1116" }}>
              Federal Reserve Bank of St. Louis. "Federal Funds Effective Rate" [FEDFUNDS].
              Retrieved from FRED, https://fred.stlouisfed.org/series/FEDFUNDS, 2024.
            </div>
            <p style={{ marginTop: 14, marginBottom: 0 }}>
              For the interactive models (Taylor, Phillips, Sandbox, Lab), cite as:
            </p>
            <div style={{ background: "#f5f1e8", padding: "10px 14px", marginTop: 10,
                          fontFamily: "JetBrains Mono, monospace", fontSize: 11, lineHeight: 1.55,
                          color: "#0e1116" }}>
              Yıldırım, A. H. (2024). <i>Economics Playground</i> — interactive macro models.
              Compiled educational tool.
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

Object.assign(window, { DataSourcesView });
