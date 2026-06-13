export function FieldError({ error }: { error?: unknown }) {
  if (!error || typeof error !== "string") return null;
  return <p className="text-xs font-medium text-destructive">{error}</p>;
}
