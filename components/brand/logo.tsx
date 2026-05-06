// Placeholder Veri logo — clean SVG approximation of the V-mark + globe motif.
// Swap this for the actual asset (drop the file at /public/brand/veri-logo.svg)
// and the component below will pick it up automatically.

import Image from "next/image";

interface VeriLogoProps {
  className?: string;
  variant?: "mark" | "wordmark";
}

export function VeriLogo({ className = "h-10", variant = "mark" }: VeriLogoProps) {
  // Once the real SVG is in /public/brand/veri-logo.svg, this can be replaced with:
  // return <Image src="/brand/veri-logo.svg" alt="Veri" width={48} height={48} className={className} priority />;
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 64 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
        aria-label="Veri"
      >
        <defs>
          <linearGradient id="veri-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#C9D2DD" />
            <stop offset="100%" stopColor="#7C8B9C" />
          </linearGradient>
        </defs>
        {/* Stylised V/wing mark — approximation of the Veri brand mark */}
        <path
          d="M14 4 C 26 4, 36 4, 36 4 L 36 60 C 36 70, 28 76, 18 76 C 10 76, 4 70, 4 60 L 4 14 C 4 8, 8 4, 14 4 Z"
          fill="url(#veri-grad)"
          opacity="0.95"
        />
        {/* Tiny globe accent in the upper-right, matching the brand mark */}
        <g transform="translate(46, 8)" stroke="#E6ECF3" strokeWidth="0.7" fill="none">
          <circle cx="6" cy="6" r="6" />
          <ellipse cx="6" cy="6" rx="6" ry="2.5" />
          <ellipse cx="6" cy="6" rx="2.5" ry="6" />
          <line x1="0" y1="6" x2="12" y2="6" />
          <line x1="6" y1="0" x2="6" y2="12" />
        </g>
      </svg>
      {variant === "wordmark" && (
        <span className="text-veri-text font-semibold tracking-wide">Veri</span>
      )}
    </div>
  );
}
