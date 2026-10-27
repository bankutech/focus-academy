import React from 'react';
import { rupees } from './chartData';

export function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white rounded border border-slate-200 p-4 sm:p-5 ${className}`}>
      <div className="mb-3.5 pb-2.5 border-b border-slate-100">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyChart({ message = 'Nothing to chart yet.' }) {
  return (
    <div className="h-40 flex items-center justify-center text-xs font-medium text-slate-400 border border-dashed border-slate-200 rounded">
      {message}
    </div>
  );
}

const polar = (cx, cy, r, angle) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];

const arcPath = (cx, cy, rOuter, rInner, start, end) => {
  const large = end - start > Math.PI ? 1 : 0;
  const [x1, y1] = polar(cx, cy, rOuter, start);
  const [x2, y2] = polar(cx, cy, rOuter, end);
  const [x3, y3] = polar(cx, cy, rInner, end);
  const [x4, y4] = polar(cx, cy, rInner, start);
  return `M${x1} ${y1} A${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
};

export function DonutChart({ data, centerLabel, centerValue, format = rupees, label }) {
  const rows = data.filter((d) => d.value > 0);
  const total = rows.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <EmptyChart />;

  const size = 160;
  const c = size / 2;
  const slices = rows.reduce((acc, d) => {
    const start = acc.length ? acc[acc.length - 1].end : -Math.PI / 2;
    const sweep = (d.value / total) * Math.PI * 2;
    const end = rows.length === 1 ? start + Math.PI * 2 - 0.0001 : start + sweep;
    acc.push({ ...d, start, end, path: arcPath(c, c, 78, 50, start, end), pct: Math.round((d.value / total) * 100) });
    return acc;
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40 flex-shrink-0" role="img" aria-label={label || 'Distribution chart'}>
        {slices.map((s) => (
          <path key={s.label} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2">
            <title>{`${s.label}: ${format(s.value)} (${s.pct}%)`}</title>
          </path>
        ))}
        <text x={c} y={c - 2} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.6 }}>
          {(centerLabel || 'TOTAL').toUpperCase()}
        </text>
        <text x={c} y={c + 13} textAnchor="middle" className="fill-[#0F172A]" style={{ fontSize: 15, fontWeight: 800 }}>
          {centerValue ?? format(total)}
        </text>
      </svg>
      <ul className="w-full space-y-1.5 min-w-0">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
              <span className="text-slate-600 font-semibold truncate">{s.label}</span>
            </span>
            <span className="font-mono font-bold text-[#0F172A] flex-shrink-0">
              {format(s.value)} <span className="text-slate-400 font-semibold">· {s.pct}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarChart({ data, format = (n) => n, label, height = 190, showAxisMax = true }) {
  if (!data.length || data.every((d) => !d.value)) return <EmptyChart />;
  const width = Math.max(280, data.length * 54);
  const padTop = 18;
  const padBottom = 34;
  const plotHeight = height - padTop - padBottom;
  const ceiling = Math.max(...data.map((d) => d.max || d.value), 1);
  const slot = width / data.length;
  const barWidth = Math.min(34, slot * 0.6);
  const ticks = [0.5, 1].map((t) => ({ y: padTop + plotHeight * (1 - t), value: Math.round(ceiling * t) }));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width }} className="w-full" role="img" aria-label={label || 'Bar chart'}>
        {ticks.map((t) => (
          <g key={t.y}>
            <line x1="0" x2={width} y1={t.y} y2={t.y} stroke="#E2E8F0" strokeDasharray="3 4" />
            {showAxisMax && (
              <text x="2" y={t.y - 3} className="fill-slate-400" style={{ fontSize: 8, fontWeight: 600 }}>
                {format(t.value)}
              </text>
            )}
          </g>
        ))}
        <line x1="0" x2={width} y1={padTop + plotHeight} y2={padTop + plotHeight} stroke="#CBD5E1" />
        {data.map((d, i) => {
          const h = Math.max(d.value ? 2 : 0, (d.value / ceiling) * plotHeight);
          const x = i * slot + (slot - barWidth) / 2;
          const y = padTop + plotHeight - h;
          return (
            <g key={`${d.label}-${i}`}>
              {d.max && <rect x={x} y={padTop} width={barWidth} height={plotHeight} rx="3" fill="#F1F5F9" />}
              <rect x={x} y={y} width={barWidth} height={h} rx="3" fill={d.color || '#0F172A'}>
                <title>{`${d.fullLabel || d.label}: ${d.sub || format(d.value)}`}</title>
              </rect>
              <text x={x + barWidth / 2} y={Math.max(10, y - 4)} textAnchor="middle" className="fill-[#0F172A]" style={{ fontSize: 9, fontWeight: 700 }}>
                {d.sub || format(d.value)}
              </text>
              <text x={x + barWidth / 2} y={height - 14} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 9, fontWeight: 600 }}>
                {d.label.length > 9 ? `${d.label.slice(0, 8)}…` : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
