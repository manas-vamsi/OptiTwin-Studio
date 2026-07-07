// Tiny sparkline — pure render, no state.
export default function Spark({ points }: { points: string }) {
  const id = "sg" + points.length + points.charCodeAt(0);
  const area = `M8,40 L${points.replace(/ /g, " L")} L220,40 Z`;
  return (
    <svg className="spark" viewBox="0 0 220 40" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(201,168,106,0.28)" />
          <stop offset="1" stopColor="rgba(201,168,106,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke="#C9A86A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
