/** On-screen LED label — first word of participant full name. */
export function ledParticipantDisplayName(
  fullName: string | undefined | null,
): string {
  const trimmed = fullName?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}
