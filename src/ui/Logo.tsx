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
      <rect x="0" y="0" width="16" height="16" fill="#d84245" />
      <rect x="16" y="0" width="16" height="16" fill="#d8af4e" />
      <rect x="0" y="16" width="16" height="16" fill="#40947b" />
      <rect x="16" y="16" width="16" height="16" fill="#286d8b" />
      <text
        x="16"
        y="22.5"
        textAnchor="middle"
        fontSize="17"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="Inter Variable, Inter, system-ui, sans-serif"
      >
        W
      </text>
    </svg>
  );
}
