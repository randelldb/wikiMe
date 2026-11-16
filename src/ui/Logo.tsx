/** WikiMe logo: a metro tile — four palette quadrants with a white W. */
export default function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect x="0" y="0" width="16" height="16" fill="#f04a4d" />
      <rect x="16" y="0" width="16" height="16" fill="#f0c357" />
      <rect x="0" y="16" width="16" height="16" fill="#48a589" />
      <rect x="16" y="16" width="16" height="16" fill="#2d7a9b" />
      <text
        x="16"
        y="22.5"
        textAnchor="middle"
        fontSize="17"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      >
        W
      </text>
    </svg>
  );
}
