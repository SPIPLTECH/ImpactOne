export default function LineGraph() {
  const points = [
    [10, 90],
    [45, 40],
    [80, 65],
    [115, 25],
    [150, 55],
    [185, 15],
    [220, 45],
  ];

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`)
    .join(" ");

  return (
    <svg viewBox="0 0 240 110" width="100%" height="180">
      <path
        d={pathD}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="6" fill="#ffffff" />
      ))}
    </svg>
  );
}
