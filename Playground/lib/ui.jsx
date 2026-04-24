// Shared module pieces — country picker, KPI cards, etc.
const { useState: useStateS, useMemo: useMemoS } = React;

// Primary 8 come first, then everything else alphabetically by name.
const PRIMARY_COUNTRIES = ["US", "EZ", "UK", "JP", "CN", "IN", "BR", "TR"];
const COUNTRY_ORDER = (() => {
  const all = Object.keys(MACRO_DATA.COUNTRIES);
  const rest = all
    .filter(c => !PRIMARY_COUNTRIES.includes(c))
    .sort((a, b) => MACRO_DATA.COUNTRIES[a].name.localeCompare(MACRO_DATA.COUNTRIES[b].name));
  return [...PRIMARY_COUNTRIES, ...rest];
})();

// Which series does a country have usable data in?
function hasDataFor(code, metric) {
  const ds = MACRO_DATA[metric];
  if (!ds || !ds[code]) return false;
  return ds[code].some(d => d.value != null);
}

function CountryChip({ code, active, onClick, theme = "light", disabled = false, onRemove = null }) {
  const c = MACRO_DATA.COUNTRIES[code];
  const dark = theme === "dark";
  // Both states share the same neutral chrome; only a small indicator changes.
  // Active chips get an "× remove" affordance and a filled dot.
  return (
    <button onClick={onClick} disabled={disabled}
      className="cchip"
      title={disabled ? `${c.name} — no data for this metric` : c.name}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 10px", border: "1px solid",
        borderColor: active
          ? (dark ? "#4a5160" : "#8a8474")
          : (dark ? "#2a3140" : "#d8d4cc"),
        background: "transparent",
        color: disabled
          ? (dark ? "#4a5160" : "#c8c4bc")
          : (dark ? "#dde3ee" : "#0e1116"),
        fontFamily: "JetBrains Mono, monospace", fontSize: 11,
        fontWeight: active ? 500 : 400,
        cursor: disabled ? "not-allowed" : "pointer", letterSpacing: 0.3,
        opacity: disabled ? 0.4 : 1,
      }}>
      <span style={{ width: 6, height: 6, borderRadius: 999,
                     background: active ? c.color : "transparent",
                     border: active ? "none" : `1px solid ${c.color}`,
                     display: "inline-block" }} />
      <span>{code}</span>
      {onRemove && (
        <span onClick={(e) => { e.stopPropagation(); onRemove(); }}
              style={{ marginLeft: 2, opacity: 0.5, cursor: "pointer",
                       fontSize: 13, lineHeight: 1 }}>×</span>
      )}
    </button>
  );
}

function CountryPicker({ selected, onChange, multi = true, theme = "light",
                         requireMetric = null, maxHeight = 140 }) {
  const [query, setQuery] = useStateS("");
  const dark = theme === "dark";

  function add(code) {
    if (selected.includes(code)) return;
    if (!multi) return onChange([code]);
    onChange([...selected, code]);
  }
  function remove(code) {
    if (!multi) return;
    if (selected.length === 1) return;
    onChange(selected.filter(c => c !== code));
  }

  const q = query.trim().toLowerCase();
  const unselected = COUNTRY_ORDER.filter(c => {
    if (selected.includes(c)) return false;
    if (!q) return true;
    const m = MACRO_DATA.COUNTRIES[c];
    return c.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Selected chips row */}
      {multi && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8,
          paddingBottom: 8, borderBottom: `1px dashed ${dark ? "#2a3140" : "#e4e0d6"}`,
        }}>
          {selected.length === 0 && (
            <span style={{ fontSize: 10, color: dark ? "#7a8599" : "#8a8474",
                           fontFamily: "Inter, sans-serif", fontStyle: "italic",
                           padding: "4px 0" }}>
              No economies selected.
            </span>
          )}
          {selected.map(code => (
            <CountryChip key={code} code={code} active={true}
                         theme={theme}
                         onClick={() => remove(code)}
                         onRemove={selected.length > 1 ? () => remove(code) : null} />
          ))}
        </div>
      )}

      {/* Filter input */}
      <input
        type="text" value={query} onChange={e => setQuery(e.target.value)}
        placeholder={`Add from ${COUNTRY_ORDER.length - selected.length} more…`}
        style={{
          width: "100%", boxSizing: "border-box", marginBottom: 8,
          padding: "6px 10px", fontSize: 11,
          fontFamily: "JetBrains Mono, monospace",
          background: dark ? "#0e1116" : "#fafaf7",
          border: `1px solid ${dark ? "#2a3140" : "#d8d4cc"}`,
          color: dark ? "#dde3ee" : "#0e1116", outline: "none",
          letterSpacing: 0.3,
        }}
      />

      {/* Candidate list */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 6,
        maxHeight, overflowY: "auto",
        padding: "2px 2px 2px 0",
      }}>
        {unselected.map(c => {
          const disabled = requireMetric ? !hasDataFor(c, requireMetric) : false;
          return (
            <CountryChip key={c} code={c} active={false}
                         disabled={disabled}
                         onClick={() => !disabled && add(c)} theme={theme} />
          );
        })}
        {unselected.length === 0 && (
          <div style={{
            fontSize: 11, color: dark ? "#7a8599" : "#8a8474",
            fontFamily: "Inter, sans-serif", padding: "6px 2px",
          }}>
            {q ? "No matches." : "All added."}
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value, unit = "", change, sub, theme = "light", size = "md" }) {
  const dark = theme === "dark";
  const valSize = size === "lg" ? 32 : size === "sm" ? 18 : 24;
  const positive = change != null && change >= 0;
  return (
    <div style={{ padding: size === "sm" ? "8px 0" : "12px 0",
                  borderTop: `1px solid ${dark ? "#2a3140" : "#e4e0d6"}` }}>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                    letterSpacing: 1.5, textTransform: "uppercase",
                    color: dark ? "#7a8599" : "#8a8474", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: valSize,
                      fontWeight: 500, color: dark ? "#dde3ee" : "#0e1116",
                      letterSpacing: -0.5, lineHeight: 1 }}>
          {value}<span style={{ fontSize: valSize * 0.5, color: dark ? "#7a8599" : "#8a8474" }}>{unit}</span>
        </div>
        {change != null && (
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                        color: positive ? "oklch(0.55 0.15 145)" : "oklch(0.55 0.18 25)" }}>
            {positive ? "▲" : "▼"} {Math.abs(change).toFixed(2)}
          </div>
        )}
      </div>
      {sub && <div style={{ fontSize: 10, color: dark ? "#7a8599" : "#8a8474",
                            marginTop: 4, fontFamily: "Inter, sans-serif" }}>{sub}</div>}
    </div>
  );
}

function Slider({ label, min, max, step = 0.1, value, onChange, unit = "", theme = "light" }) {
  const dark = theme === "dark";
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between",
                    fontFamily: "Inter, sans-serif", fontSize: 11,
                    color: dark ? "#9aa5ba" : "#3a3530", marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 500 }}>
          {Number(value).toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={e => onChange(parseFloat(e.target.value))}
             style={{ width: "100%", accentColor: dark ? "#dde3ee" : "#0e1116" }} />
    </label>
  );
}

function Tabs({ tabs, active, onChange, theme = "light" }) {
  const dark = theme === "dark";
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${dark ? "#2a3140" : "#e4e0d6"}`,
                  gap: 0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{ padding: "10px 16px", background: "transparent", border: "none",
                   borderBottom: `2px solid ${active === t.id ? (dark ? "#dde3ee" : "#0e1116") : "transparent"}`,
                   color: active === t.id ? (dark ? "#dde3ee" : "#0e1116") : (dark ? "#7a8599" : "#8a8474"),
                   fontFamily: "Inter, sans-serif", fontSize: 12, cursor: "pointer",
                   fontWeight: active === t.id ? 500 : 400, letterSpacing: 0.2 }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Card({ title, kicker, action, children, theme = "light", padding = 20 }) {
  const dark = theme === "dark";
  return (
    <div style={{ background: dark ? "#181d27" : "#ffffff",
                  border: `1px solid ${dark ? "#2a3140" : "#e4e0d6"}`,
                  padding }}>
      {(title || kicker) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      marginBottom: 14, gap: 12 }}>
          <div>
            {kicker && <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                                     letterSpacing: 1.5, textTransform: "uppercase",
                                     color: dark ? "#7a8599" : "#8a8474", marginBottom: 4 }}>{kicker}</div>}
            {title && <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14,
                                    fontWeight: 500, color: dark ? "#dde3ee" : "#0e1116",
                                    letterSpacing: -0.1 }}>{title}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function seriesFromData(dataset, codes) {
  return codes.map(code => ({
    id: code,
    label: MACRO_DATA.COUNTRIES[code].name,
    color: MACRO_DATA.COUNTRIES[code].color,
    points: dataset[code].map(d => ({ x: d.year, y: d.value })),
  }));
}

function latestNonNull(arr) {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i].value != null) return arr[i];
  return null;
}

Object.assign(window, { CountryChip, CountryPicker, KPI, Slider, Tabs, Card, seriesFromData, latestNonNull, COUNTRY_ORDER, PRIMARY_COUNTRIES, hasDataFor });
