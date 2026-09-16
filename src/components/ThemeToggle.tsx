import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "ghost" | "outline";
  size?: "sm" | "default" | "icon";
}

export function ThemeToggle({ className, variant = "ghost", size = "sm" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        "gap-1.5 transition-colors focus-visible:ring-1",
        isDark ? "text-muted-foreground hover:text-foreground" : "text-foreground hover:text-primary",
        className
      )}
      title={isDark ? "Switch to Ash Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Ash Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-gold shrink-0" />
          <span className="hidden md:inline text-xs font-medium">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-primary shrink-0" />
          <span className="hidden md:inline text-xs font-medium">Dark</span>
        </>
      )}
    </Button>
  );
}
