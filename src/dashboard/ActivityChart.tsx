import React from 'react';

export interface ActivityPoint {
  date: string;
  hours: number;
  pages: number;
}

/** Sum consecutive points into buckets so long ranges stay legible (one bar per bucket). */
export function bucketPoints(data: ActivityPoint[], size: number): ActivityPoint[] {
  if (size <= 1) return data;
  const out: ActivityPoint[] = [];
  for (let i = 0; i < data.length; i += size) {
    const chunk = data.slice(i, i + size);
    out.push({
      date: chunk[0].date,
      hours: chunk.reduce((s, d) => s + d.hours, 0),
      pages: chunk.reduce((s, d) => s + d.pages, 0),
    });
  }
  return out;
}

const NICE_STEPS = [0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 10, 15, 20, 25, 50, 100];

/** Axis maximum = 4 gridline steps of a "nice" size, so the labels read 1.5 / 3 / 4.5 / 6 rather than 1.3 / 2.5 / 3.8. */
export function niceMax(value: number): number {
  const step = NICE_STEPS.find((s) => s * 4 >= value) ?? Math.ceil(value / 4);
  return step * 4;
}

const fmtHours = (h: number) => (h >= 10 ? Math.round(h).toString() : (Math.round(h * 10) / 10).toString());

/**
 * Bar chart drawn with plain DOM + CSS variables, so it follows the light/dark theme,
 * scales with its container and needs no resize handling.
 */
export const ActivityChart: React.FC<{ data: ActivityPoint[] }> = ({ data }) => {
  if (data.length === 0) return null;

  const max = niceMax(Math.max(...data.map((d) => d.hours)));
  const labelStep = Math.ceil(data.length / 8);
  const dense = data.length > 14;

  return (
    <div className="chart" style={{ ['--bar-gap' as string]: dense ? '3px' : '8px' }} role="img" aria-label="Research hours per day">
      <div className="chart__plot">
        <div className="chart__axis" aria-hidden="true">
          {[1, 0.75, 0.5, 0.25, 0].map((f) => (
            <span key={f}>{fmtHours(max * f)}h</span>
          ))}
        </div>
        {data.map((d) => (
          <div
            key={d.date}
            className="chart__col"
            tabIndex={0}
            aria-label={`${d.date}: ${fmtHours(d.hours)} hours, ${d.pages} pages`}
          >
            <span className="chart__tip">
              {d.date.slice(5)} · {fmtHours(d.hours)}h · {d.pages} {d.pages === 1 ? 'page' : 'pages'}
            </span>
            <div
              className={`chart__bar${d.hours === 0 ? ' chart__bar--empty' : ''}`}
              style={{ height: `${(d.hours / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="chart__labels" aria-hidden="true">
        {data.map((d, i) => (
          <span key={d.date} className="chart__label">
            {i % labelStep === 0 ? d.date.slice(5) : ''}
          </span>
        ))}
      </div>
    </div>
  );
};
