type Props = {
  className?: string;
  size?: number;
};

export function CowIcon({ className = "", size = 24 }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="LMHTS"
    >
      {/* Horns */}
      <path d="M2 4c1 2 2 3 4 3" />
      <path d="M22 4c-1 2-2 3-4 3" />
      {/* Head */}
      <ellipse cx="12" cy="11" rx="7" ry="6" />
      {/* Ears */}
      <path d="M5.5 8.5C4 7.5 3 7 2 7" />
      <path d="M18.5 8.5C20 7.5 21 7 22 7" />
      {/* Eyes */}
      <circle cx="9.5" cy="10" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="10" r="0.75" fill="currentColor" stroke="none" />
      {/* Muzzle */}
      <ellipse cx="12" cy="14.5" rx="3.5" ry="2.5" />
      {/* Nostrils */}
      <circle cx="10.5" cy="14.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="14.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
