type LedParticipantNameTextProps = {
  nama?: string;
  fontSize: number;
  /** Degrees clockwise (from `participantName.rotate` in layout). */
  rotate?: number;
};

export function LedParticipantNameText({
  nama,
  fontSize,
  rotate = 0,
}: LedParticipantNameTextProps) {
  const display = nama?.trim();
  if (!display) {
    return null;
  }

  return (
    <div
      className="led-live-participant-name-wrap flex size-full items-end justify-center"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <p
        className="led-live-participant-name"
        style={{ fontSize, lineHeight: 1.05 }}
      >
        {display}
      </p>
    </div>
  );
}
