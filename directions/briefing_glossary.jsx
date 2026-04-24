// Glossary full-page tab — searchable, alphabetical. Uses GLOSSARY from lib/edu.jsx.

function GlossaryView() {
  const [query, setQuery] = React.useState("");
  const entries = Object.entries(GLOSSARY)
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => a.key.localeCompare(b.key));
  const q = query.trim().toLowerCase();
  const filtered = q
    ? entries.filter(e => e.key.includes(q) || e.short.toLowerCase().includes(q) || (e.long || "").toLowerCase().includes(q))
    : entries;

  return (
    <>
      <ModuleHead kicker="09 · Glossary"
        title="Terms, briefly and then at length."
        dek="Every underlined term in The Briefing lives here. Search by name or description. Think of it as the appendix you actually use." />

      <div style={{ marginBottom: 24 }}>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search terms or definitions…"
          style={{ width: "100%", maxWidth: 520,
                   padding: "10px 14px", fontSize: 14,
                   border: "1px solid #d8d4cc", background: "#fafaf7",
                   fontFamily: "Inter, sans-serif", outline: "none",
                   color: "#0e1116" }} />
        <div style={{ fontSize: 11, color: "#8a8474", marginTop: 8,
                      fontFamily: "JetBrains Mono, monospace" }}>
          {filtered.length} of {entries.length} terms
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0,
                    borderTop: "1px solid #e4e0d6" }}>
        {filtered.map(e => (
          <div key={e.key}
            style={{ borderBottom: "1px solid #e4e0d6",
                     borderRight: "1px solid #e4e0d6",
                     padding: "18px 20px 20px" }}>
            <div style={{ fontFamily: "'IBM Plex Serif', Georgia, serif",
                          fontSize: 18, letterSpacing: -0.3,
                          textTransform: "capitalize",
                          marginBottom: 8 }}>
              {e.key}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#0e1116",
                          fontFamily: "'IBM Plex Serif', Georgia, serif",
                          marginBottom: e.long ? 10 : 0 }}>
              {e.short}
            </div>
            {e.long && (
              <div style={{ fontSize: 11.5, lineHeight: 1.55, color: "#5a5349",
                            fontFamily: "Inter, sans-serif",
                            paddingTop: 10, borderTop: "1px dashed #d8d4cc" }}>
                {e.long}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center",
                        color: "#8a8474", fontSize: 13,
                        fontFamily: "'IBM Plex Serif', Georgia, serif",
                        fontStyle: "italic" }}>
            No terms match "{query}".
          </div>
        )}
      </div>
    </>
  );
}

Object.assign(window, { GlossaryView });
