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
      <rect x="0" y="0" width="16" height="16" fill="#f94144" />
      <rect x="16" y="0" width="16" height="16" fill="#f9c74f" />
      <rect x="0" y="16" width="16" height="16" fill="#43aa8b" />
      <rect x="16" y="16" width="16" height="16" fill="#277da1" />
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
