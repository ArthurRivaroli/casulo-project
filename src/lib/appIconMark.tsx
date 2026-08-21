export function AppIconMark({ size }: { size: number }) {
  const ovalWidth = Math.round(size * 0.58);
  const ovalHeight = Math.round(size * 0.74);
  const borderWidth = Math.max(2, Math.round(size * 0.035));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #1e3a8a 100%)",
      }}
    >
      <div
        style={{
          width: ovalWidth,
          height: ovalHeight,
          borderRadius: "50%",
          background: "#ffffff",
          border: `${borderWidth}px solid #000000`,
        }}
      />
    </div>
  );
}
