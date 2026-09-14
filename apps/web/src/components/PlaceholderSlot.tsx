/**
 * Named placeholder slots for regions waiting on backend data/modules.
 * Every slot lists its name + the endpoint that will feed it, so wiring
 * later is mechanical: replace <PlaceholderSlot name="X" .../> with the
 * real component when the module lands.
 */
export function PlaceholderSlot({
  name,
  feeds,
  note,
}: {
  name: string;
  feeds: string;
  note?: string;
}) {
  return (
    <div
      style={{
        border: "2px dashed #C8C4BC",
        borderRadius: 8,
        padding: "20px 24px",
        margin: "24px 0",
        background: "#F7F5F0",
      }}
    >
      <div
        style={{
          fontFamily: "monospace, monospace",
          fontSize: 12,
          letterSpacing: "0.08em",
          fontWeight: 700,
          color: "#111",
        }}
      >
        [SLOT: {name}]
      </div>
      <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>
        Wire up: <strong>{feeds}</strong>
      </div>
      {note && (
        <div style={{ fontSize: 12.5, color: "#888", marginTop: 4 }}>{note}</div>
      )}
    </div>
  );
}
