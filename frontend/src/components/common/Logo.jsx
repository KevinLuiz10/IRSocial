export default function Logo({ className = "" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill="var(--color-brand)" />
      <path
        d="M9 23V9m5 14V9h5a4 4 0 0 1 0 8h-5m5 0 4 6"
        fill="none"
        stroke="var(--color-paper)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
