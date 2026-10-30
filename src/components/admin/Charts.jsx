import React from 'react';
import { rupees } from './chartData';

export function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white rounded-none border border-slate-200 p-4 sm:p-5 min-w-0 max-w-full overflow-hidden flex flex-col justify-between ${className}`}>
      <div className="mb-3.5 pb-2.5 border-b border-slate-100">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {children}
      </div>
    </div>
  );
}

export function EmptyChart({ message = 'Nothing to chart yet.' }) {
  return (
    <div className="h-44 flex items-center justify-center text-xs font-medium text-slate-400 border border-dashed border-slate-200 rounded-none p-4 text-center">
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
  const { total, slices, size, c } = React.useMemo(() => {
    const validRows = (data || []).filter((d) => d && d.value > 0);
    const sum = validRows.reduce((acc, d) => acc + d.value, 0);
    const chartSize = 180;
    const center = chartSize / 2;
    if (sum === 0) return { rows: validRows, total: sum, slices: [], size: chartSize, c: center };

    const calculatedSlices = validRows.reduce((acc, d) => {
      const start = acc.length ? acc[acc.length - 1].end : -Math.PI / 2;
      const sweep = (d.value / sum) * Math.PI * 2;
      const end = validRows.length === 1 ? start + Math.PI * 2 - 0.0001 : start + sweep;
      acc.push({
        ...d,
        start,
        end,
        path: arcPath(center, center, 84, 54, start, end),
        pct: Math.round((d.value / sum) * 100),
      });
      return acc;
    }, []);

    return { rows: validRows, total: sum, slices: calculatedSlices, size: chartSize, c: center };
  }, [data]);

  if (total === 0) return <EmptyChart message="Nothing to chart yet." />;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 min-w-0 max-w-full">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-44 h-44 flex-shrink-0"
        role="img"
        aria-label={label || 'Distribution chart'}
      >
        {slices.map((s) => (
          <path key={s.label} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2">
            <title>{`${s.label}: ${format(s.value)} (${s.pct}%)`}</title>
          </path>
        ))}
        <text x={c} y={c - 4} textAnchor="middle" className="fill-slate-400 font-bold tracking-wider" style={{ fontSize: 9 }}>
          {(centerLabel || 'TOTAL').toUpperCase()}
        </text>
        <text x={c} y={c + 14} textAnchor="middle" className="fill-[#0F172A] font-extrabold" style={{ fontSize: 15 }}>
          {centerValue ?? format(total)}
        </text>
      </svg>

      <ul className="w-full space-y-2 min-w-0 flex-1">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-xs flex-shrink-0" style={{ background: s.color }} />
              <span className="text-slate-700 font-semibold truncate" title={s.label}>
                {s.label}
              </span>
            </span>
            <span className="font-mono font-bold text-[#0F172A] flex-shrink-0 text-right">
              {format(s.value)} <span className="text-slate-400 font-medium text-[11px]">({s.pct}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarChart({ data = [], format = (n) => n, label, height = 210, showAxisMax = true }) {
  const chartMath = React.useMemo(() => {
    if (!data.length || data.every((d) => !d.value)) return null;

    const shouldRotate = data.length > 7;
    const padLeft = showAxisMax ? 52 : 16;
    const padRight = 16;
    const padTop = 22;
    const padBottom = shouldRotate ? 52 : 34;
    const plotHeight = height - padTop - padBottom;

    const slotWidth = data.length > 8 ? 38 : data.length > 6 ? 42 : 48;
    const naturalWidth = padLeft + padRight + data.length * slotWidth;
    const width = Math.max(340, naturalWidth);
    const plotWidth = width - padLeft - padRight;
    const slot = plotWidth / data.length;
    const barWidth = Math.min(32, Math.max(14, slot * 0.55));

    const ceiling = Math.max(...data.map((d) => d.max || d.value), 1);
    const ticks = [0.5, 1].map((t) => ({
      y: padTop + plotHeight * (1 - t),
      value: Math.round(ceiling * t),
    }));

    return {
      shouldRotate,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotHeight,
      width,
      slot,
      barWidth,
      ceiling,
      ticks,
    };
  }, [data, height, showAxisMax]);

  if (!chartMath) {
    return <EmptyChart message="Nothing to chart yet." />;
  }

  const {
    shouldRotate,
    padLeft,
    padRight,
    padTop,
    plotHeight,
    width,
    slot,
    barWidth,
    ceiling,
    ticks,
  } = chartMath;

  return (
    <div className="overflow-x-auto max-w-full pb-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        role="img"
        aria-label={label || 'Bar chart'}
      >
        {ticks.map((t) => (
          <g key={t.y}>
            <line x1={padLeft} x2={width - padRight} y1={t.y} y2={t.y} stroke="#E2E8F0" strokeDasharray="3 4" />
            {showAxisMax && (
              <text x={padLeft - 6} y={t.y + 3} textAnchor="end" className="fill-slate-400 font-mono text-[9px] font-semibold">
                {format(t.value)}
              </text>
            )}
          </g>
        ))}

        <line x1={padLeft} x2={width - padRight} y1={padTop + plotHeight} y2={padTop + plotHeight} stroke="#CBD5E1" strokeWidth="1" />

        {data.map((d, i) => {
          const val = Number(d.value) || 0;
          const h = Math.max(val ? 3 : 0, (val / ceiling) * plotHeight);
          const x = padLeft + i * slot + (slot - barWidth) / 2;
          const y = padTop + plotHeight - h;
          const isFull = d.max && val >= d.max;
          const barColor = d.color || (isFull ? '#E11D48' : '#0F172A');
          const valueText = d.sub || format(val);
          const fullLabel = d.fullLabel || d.label;
          const displayLabel = d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label;

          return (
            <g key={`${d.label}-${i}`}>
              {d.max && (
                <rect x={x} y={padTop} width={barWidth} height={plotHeight} rx="3" fill="#F1F5F9">
                  <title>{`${fullLabel} (Max: ${d.max})`}</title>
                </rect>
              )}
              <rect x={x} y={y} width={barWidth} height={h} rx="3" fill={barColor}>
                <title>{`${fullLabel}: ${valueText}`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={Math.max(12, y - 5)}
                textAnchor="middle"
                className="fill-[#0F172A] font-mono font-bold text-[9px]"
              >
                {valueText}
              </text>
              <text
                x={x + barWidth / 2}
                y={shouldRotate ? height - 34 : height - 12}
                textAnchor={shouldRotate ? 'end' : 'middle'}
                transform={shouldRotate ? `rotate(-35 ${x + barWidth / 2} ${height - 34})` : undefined}
                className="fill-slate-600 font-semibold text-[9px]"
              >
                {displayLabel}
                <title>{fullLabel}</title>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
