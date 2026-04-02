import { cn } from "@/lib/utils";

interface LogoLoaderProps {
  size?: number;
  className?: string;
  text?: string;
}

export function LogoLoader({ size = 48, className, text = "Loading..." }: LogoLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-loader"
      >
        {/* Bar 1 - shortest */}
        <rect x="4" y="28" width="8" height="16" rx="2" fill="hsl(var(--gold))" className="logo-bar logo-bar-1" />
        {/* Bar 2 - medium */}
        <rect x="16" y="18" width="8" height="26" rx="2" fill="hsl(var(--gold-light))" className="logo-bar logo-bar-2" />
        {/* Bar 3 - tallest */}
        <rect x="28" y="8" width="8" height="36" rx="2" fill="hsl(var(--gold))" className="logo-bar logo-bar-3" />
        {/* Trend line */}
        <polyline
          points="8,28 20,20 32,10 44,6"
          stroke="hsl(var(--teal))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="logo-line"
        />
        {/* Dot at end of line */}
        <circle cx="44" cy="6" r="3" fill="hsl(var(--teal))" className="logo-dot" />
      </svg>
      {text && <p className="text-muted-foreground text-sm">{text}</p>}
    </div>
  );
}
