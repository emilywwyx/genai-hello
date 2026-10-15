export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

export function fullName(p: { first_name: string | null; last_name: string | null } | null): string {
  if (!p) return '';
  return [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
}
