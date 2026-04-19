const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-sm ${colorFor(name)} ${className}`}
      style={{ width: 44, height: 44, minWidth: 44 }}
    >
      {initials}
    </div>
  );
}
