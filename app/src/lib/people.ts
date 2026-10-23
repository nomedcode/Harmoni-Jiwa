const roleLabels: Record<string, string> = { psychiatrist: "Psikiater" };

/** `/employees` sends the backend role name; patients read it in Indonesian. */
export function roleLabel(role: string): string {
  return roleLabels[role.toLowerCase()] ?? role;
}

export function initials(name: string): string {
  const words = name.replace(/^dr\.?\s+/i, "").split(/[\s,]+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]!.toUpperCase()).join("");
}
