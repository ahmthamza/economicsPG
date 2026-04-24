// Lightweight SVG chart primitives — line, area, bar, scatter
// All charts share a consistent axis/grid system.

const { useMemo, useState, useRef, useEffect, useCallback } = React;

// ----- utilities -----
function extent(arr, fn = v => v) {
  let lo = Infinity, hi = -Infinity;
  for (const v of arr) {
    const x = fn(v);
    if (x == null || isNaN(x)) continue;
    if (x < lo) lo = x;
    if (x > hi) hi = x;
  }
  return [lo, hi];
}

function niceNum(range, round) {
  const exp = Math.floor(Math.log10(range));
  const frac = range / Math.pow(10, exp);
  let nice;
  if (round) {
    if (frac < 1.5) nice = 1;
    else if (frac < 3) nice = 2;
    else if (frac < 7) nice = 5;
    else nice = 10;
  } else {
    if (frac <= 1) nice = 1;
    else if (frac <= 2) nice = 2;
    else if (frac <= 5) nice = 5;
    else nice = 10;
  }
  return nice * Math.pow(10, exp);
}

function ticks(min, max, count = 5) {
  const range = niceNum(max - min, false);
  const step = niceNum(range / (count - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const out = [];
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) out.push(+v.toFixed(10));
  return { ticks: out, min: niceMin, max: niceMax };
}

function fmt(v, opts = {}) {
  if (v == null || isNaN(v)) return "—";
  const { unit = "", decimals } = opts;
  let s;
  if (Math.abs(v) >= 1e12) s = (v / 1e12).toFixed(decimals ?? 1) + "T";
  else if (Math.abs(v) >= 1e9) s = (v / 1e9).toFixed(decimals ?? 1) + "B";
  else if (Math.abs(v) >= 1e6) s = (v / 1e6).toFixed(decimals ?? 1) + "M";
  else if (Math.abs(v) >= 1e3) s = v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  else s = v.toFixed(decimals ?? (Math.abs(v) >= 10 ? 1 : 2));
  return s + unit;
}

// ----- axes -----
function Axes({ x, y, width, height, padding, xLabel, yLabel, theme = "light" }) {
  const stroke = theme === "dark" ? "#2a3140" : "#d8d4cc";
  const text   = theme === "dark" ? "#7a8599" : "#7a7468";
  return (
    <g>
      {/* gridlines */}
      {y.ticks.map((t, i) => {
        const yp = y.scale(t);
        return (
          <g key={"y" + i}>
            <line x1={padding.l} x2={width - padding.r} y1={yp} y2={yp}
                  stroke={stroke} strokeWidth={0.5} strokeDasharray={t === 0 ? "0" : "2,3"} />
            <text x={padding.l - 6} y={yp + 3} fontSize={10} fill={text}
                  textAnchor="end" fontFamily="JetBrains Mono, monospace">
              {fmt(t)}
            </text>
          </g>
        );
      })}
      {x.ticks.map((t, i) => {
        const xp = x.scale(t);
        return (
          <g key={"x" + i}>
            <text x={xp} y={height - padding.b + 14} fontSize={10} fill={text}
                  textAnchor="middle" fontFamily="JetBrains Mono, monospace">
              {x.format ? x.format(t) : t}
            </text>
          </g>
        );
      })}
      {/* axes */}
      <line x1={padding.l} x2={width - padding.r}
            y1={height - padding.b} y2={height - padding.b}
            stroke={stroke} strokeWidth={1} />
      {yLabel && (
        <text x={padding.l} y={padding.t - 8} fontSize={10} fill={text}
              fontFamily="JetBrains Mono, monospace" textAnchor="start">
          {yLabel}
        </text>
      )}
      {xLabel && (
        <text x={width - padding.r} y={height - 4} fontSize={10} fill={text}
              fontFamily="JetBrains Mono, monospace" textAnchor="end">
          {xLabel}
        </text>
      )}
    </g>
  );
}

// ----- LineChart -----
function LineChart({
  series,        // [{ id, label, color, points: [{x,y}] }]
  width = 600,
  height = 280,
  padding = { t: 24, r: 16, b: 28, l: 44 },
  xLabel, yLabel,
  events = [],   // [{ x, label }]
  yDomain,
  theme = "light",
  hover = true,
  formatY,
  zeroLine = false,
}) {
  const ref = useRef(null);
  const [hi, setHi] = useState(null);

  const allX = series.flatMap(s => s.points.map(p => p.x));
  const allY = series.flatMap(s => s.points.map(p => p.y));
  const [xMin, xMax] = extent(allX);
  const [yMinR, yMaxR] = yDomain || extent(allY);
  const yT = ticks(yMinR, yMaxR, 5);
  const xT = ticks(xMin, xMax, 6);

  const xScale = v => padding.l + ((v - xT.min) / (xT.max - xT.min)) * (width - padding.l - padding.r);
  const yScale = v => height - padding.b - ((v - yT.min) / (yT.max - yT.min)) * (height - padding.t - padding.b);

  const xAxis = { ticks: xT.ticks, scale: xScale, format: v => Math.round(v) };
  const yAxis = { ticks: yT.ticks, scale: yScale };

  const path = (pts) => {
    let d = "";
    let started = false;
    for (const p of pts) {
      if (p.y == null || isNaN(p.y)) { started = false; continue; }
      d += (started ? " L" : "M") + xScale(p.x) + "," + yScale(p.y);
      started = true;
    }
    return d;
  };

  function onMove(e) {
    if (!hover) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (width / rect.width);
    if (px < padding.l || px > width - padding.r) { setHi(null); return; }
    // find nearest x
    let best = null, bestD = Infinity;
    for (const s of series) {
      for (const p of s.points) {
        if (p.y == null) continue;
        const d = Math.abs(xScale(p.x) - px);
        if (d < bestD) { bestD = d; best = p.x; }
      }
    }
    setHi(best);
  }

  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${height}`} width="100%" height={height}
         onMouseMove={onMove} onMouseLeave={() => setHi(null)}
         style={{ display: "block", overflow: "visible" }}>
      <Axes x={xAxis} y={yAxis} width={width} height={height} padding={padding}
            xLabel={xLabel} yLabel={yLabel} theme={theme} />
      {zeroLine && yT.min < 0 && yT.max > 0 && (
        <line x1={padding.l} x2={width - padding.r}
              y1={yScale(0)} y2={yScale(0)}
              stroke={theme === "dark" ? "#3a4250" : "#9b958a"} strokeWidth={0.8} />
      )}
      {/* events — stagger labels vertically to avoid overlap when close */}
      {(() => {
        const sorted = events
          .map(ev => ({ ...ev, xp: xScale(ev.x) }))
          .filter(ev => ev.xp >= padding.l && ev.xp <= width - padding.r)
          .sort((a, b) => a.xp - b.xp);
        const placed = [];
        return sorted.map((ev, i) => {
          // pick a row such that no prior label within 90px is on the same row
          let row = 0;
          while (placed.some(p => p.row === row && Math.abs(p.xp - ev.xp) < 90)) row++;
          placed.push({ row, xp: ev.xp });
          const ty = padding.t + 8 + row * 11;
          return (
            <g key={i} opacity={0.55}>
              <line x1={ev.xp} x2={ev.xp} y1={padding.t} y2={height - padding.b}
                    stroke={theme === "dark" ? "#5a6478" : "#bdb5a4"}
                    strokeWidth={0.5} strokeDasharray="2,4" />
              <text x={ev.xp + 3} y={ty} fontSize={9}
                    fill={theme === "dark" ? "#7a8599" : "#8a8474"}
                    fontFamily="Inter, sans-serif">
                {ev.label}
              </text>
            </g>
          );
        });
      })()}
      {/* lines */}
      {series.map((s) => (
        <g key={s.id}>
          <path d={path(s.points)} fill="none" stroke={s.color}
                strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {/* hover crosshair */}
      {hi != null && (
        <g>
          <line x1={xScale(hi)} x2={xScale(hi)} y1={padding.t} y2={height - padding.b}
                stroke={theme === "dark" ? "#4a5468" : "#9b958a"} strokeWidth={0.6} />
          {series.map(s => {
            const p = s.points.find(pp => pp.x === hi);
            if (!p || p.y == null) return null;
            return (
              <g key={s.id + "h"}>
                <circle cx={xScale(hi)} cy={yScale(p.y)} r={3}
                        fill={theme === "dark" ? "#0e1116" : "#fafaf7"}
                        stroke={s.color} strokeWidth={1.5} />
              </g>
            );
          })}
          <g transform={`translate(${Math.min(xScale(hi) + 8, width - 130)}, ${padding.t + 4})`}>
            <rect width={120} height={18 + series.filter(s => s.points.find(p => p.x === hi)?.y != null).length * 14}
                  fill={theme === "dark" ? "#181d27" : "#ffffff"}
                  stroke={theme === "dark" ? "#2a3140" : "#d8d4cc"}
                  strokeWidth={0.5} rx={2} />
            <text x={6} y={12} fontSize={10} fontFamily="JetBrains Mono, monospace"
                  fill={theme === "dark" ? "#dde3ee" : "#0e1116"}>
              {Math.round(hi)}
            </text>
            {series.map((s, i) => {
              const p = s.points.find(pp => pp.x === hi);
              if (!p || p.y == null) return null;
              return (
                <g key={s.id + "t"} transform={`translate(0, ${24 + i * 14})`}>
                  <rect x={6} y={-6} width={6} height={6} fill={s.color} />
                  <text x={16} y={0} fontSize={10} fontFamily="JetBrains Mono, monospace"
                        fill={theme === "dark" ? "#dde3ee" : "#0e1116"}>
                    {s.label.slice(0, 6)} {(formatY ? formatY(p.y) : p.y.toFixed(2))}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      )}
    </svg>
  );
}

// ----- AreaChart -----
function AreaChart({ data, color = "#0e1116", width = 600, height = 220, padding = { t: 16, r: 16, b: 28, l: 44 }, theme = "light", yLabel }) {
  const xs = data.map(d => d.x), ys = data.map(d => d.y);
  const [xMin, xMax] = extent(xs), [yMinR, yMaxR] = extent(ys);
  const yT = ticks(Math.min(0, yMinR), yMaxR, 4);
  const xT = ticks(xMin, xMax, 5);
  const xScale = v => padding.l + ((v - xT.min) / (xT.max - xT.min)) * (width - padding.l - padding.r);
  const yScale = v => height - padding.b - ((v - yT.min) / (yT.max - yT.min)) * (height - padding.t - padding.b);
  const baseY = yScale(Math.max(yT.min, 0));

  let path = "";
  let area = `M${xScale(xs[0])},${baseY}`;
  data.forEach((d, i) => {
    if (d.y == null) return;
    path += (i === 0 ? "M" : "L") + xScale(d.x) + "," + yScale(d.y);
    area += ` L${xScale(d.x)},${yScale(d.y)}`;
  });
  area += ` L${xScale(xs[xs.length-1])},${baseY} Z`;

  const xAxis = { ticks: xT.ticks, scale: xScale, format: v => Math.round(v) };
  const yAxis = { ticks: yT.ticks, scale: yScale };
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block" }}>
      <Axes x={xAxis} y={yAxis} width={width} height={height} padding={padding} theme={theme} yLabel={yLabel} />
      <path d={area} fill={color} opacity={0.12} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} />
    </svg>
  );
}

// ----- BarChart (vertical) -----
function BarChart({ data, color = "#0e1116", width = 600, height = 220, padding = { t: 16, r: 16, b: 36, l: 44 }, theme = "light", labelFmt = v => v, signed = false }) {
  const ys = data.map(d => d.value);
  const yMaxR = Math.max(...ys, 0);
  const yMinR = signed ? Math.min(...ys, 0) : 0;
  const yT = ticks(yMinR, yMaxR, 4);
  const yScale = v => height - padding.b - ((v - yT.min) / (yT.max - yT.min)) * (height - padding.t - padding.b);
  const innerW = width - padding.l - padding.r;
  const bw = innerW / data.length;
  const baseY = yScale(0);
  const stroke = theme === "dark" ? "#2a3140" : "#d8d4cc";
  const text   = theme === "dark" ? "#7a8599" : "#7a7468";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block" }}>
      {yT.ticks.map((t, i) => {
        const yp = yScale(t);
        return (
          <g key={i}>
            <line x1={padding.l} x2={width - padding.r} y1={yp} y2={yp}
                  stroke={stroke} strokeWidth={0.5} strokeDasharray={t === 0 ? "0" : "2,3"} />
            <text x={padding.l - 6} y={yp + 3} fontSize={10} fill={text}
                  textAnchor="end" fontFamily="JetBrains Mono, monospace">{fmt(t)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = padding.l + i * bw + bw * 0.15;
        const w = bw * 0.7;
        const c = typeof color === "function" ? color(d, i) : color;
        const top = d.value >= 0 ? yScale(d.value) : baseY;
        const h = Math.abs(yScale(d.value) - baseY);
        return (
          <g key={i}>
            <rect x={x} y={top} width={w} height={h} fill={c} />
            <text x={x + w / 2} y={height - padding.b + 14} fontSize={9} fill={text}
                  textAnchor="middle" fontFamily="JetBrains Mono, monospace">
              {labelFmt(d.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ----- Scatter -----
function Scatter({ data, width = 480, height = 320, padding = { t: 24, r: 24, b: 36, l: 48 }, xLabel, yLabel, theme = "light", connect = false }) {
  const xs = data.map(d => d.x), ys = data.map(d => d.y);
  const xT = ticks(...extent(xs), 5);
  const yT = ticks(...extent(ys), 5);
  const xScale = v => padding.l + ((v - xT.min) / (xT.max - xT.min)) * (width - padding.l - padding.r);
  const yScale = v => height - padding.b - ((v - yT.min) / (yT.max - yT.min)) * (height - padding.t - padding.b);
  const xAxis = { ticks: xT.ticks, scale: xScale, format: v => v.toFixed(1) };
  const yAxis = { ticks: yT.ticks, scale: yScale };

  let line = "";
  if (connect) {
    data.forEach((d, i) => { line += (i ? "L" : "M") + xScale(d.x) + "," + yScale(d.y); });
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block", overflow: "visible" }}>
      <Axes x={xAxis} y={yAxis} width={width} height={height} padding={padding} xLabel={xLabel} yLabel={yLabel} theme={theme} />
      {connect && <path d={line} fill="none" stroke={theme === "dark" ? "#3a4250" : "#bdb5a4"} strokeWidth={0.7} />}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xScale(d.x)} cy={yScale(d.y)} r={d.r || 3.5}
                  fill={d.color || (theme === "dark" ? "#dde3ee" : "#0e1116")}
                  fillOpacity={d.opacity ?? 0.85} />
          {d.label && (
            <text x={xScale(d.x) + 5} y={yScale(d.y) - 4} fontSize={9}
                  fill={theme === "dark" ? "#7a8599" : "#7a7468"}
                  fontFamily="JetBrains Mono, monospace">{d.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ----- Sparkline -----
function Sparkline({ values, width = 80, height = 24, color = "#0e1116", fill = false }) {
  const valid = values.filter(v => v != null && !isNaN(v));
  if (!valid.length) return <svg width={width} height={height} />;
  const [lo, hi] = extent(valid);
  const span = hi - lo || 1;
  const step = width / (values.length - 1);
  let d = "", area = "";
  let started = false;
  values.forEach((v, i) => {
    if (v == null) { started = false; return; }
    const x = i * step;
    const y = height - 2 - ((v - lo) / span) * (height - 4);
    d += (started ? "L" : "M") + x + "," + y;
    area += (started ? "L" : "M") + x + "," + y;
    started = true;
  });
  area += ` L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {fill && <path d={area} fill={color} opacity={0.12} />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.2} />
    </svg>
  );
}

// expose
Object.assign(window, { LineChart, AreaChart, BarChart, Scatter, Sparkline, fmt, ticks, extent });
