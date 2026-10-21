import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorColor?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorColor, variant = "default", ...props }, ref) => {
    const clampedValue = Math.min(Math.max(value, 0), 100);

    const getVariantColor = () => {
      if (indicatorColor) return "";
      switch (variant) {
        case "success":
          return "bg-emerald-500";
        case "warning":
          return "bg-amber-500";
        case "danger":
          return "bg-rose-500";
        default:
          return "bg-primary";
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2.5 w-full overflow-hidden rounded-full bg-secondary/60",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-in-out",
            getVariantColor()
          )}
          style={{
            transform: `translateX(-${100 - clampedValue}%)`,
            backgroundColor: indicatorColor,
          }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
