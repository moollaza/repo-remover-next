import clsx from "clsx";

import { analytics } from "@/utils/analytics";

interface ScrollButtonProps {
  children: React.ReactNode;
  className?: string;
  color?:
    | "danger"
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning";
  size?: "lg" | "md" | "sm";
  targetId: string;
  variant?:
    | "bordered"
    | "faded"
    | "flat"
    | "ghost"
    | "light"
    | "shadow"
    | "solid";
}

const scrollToID = (id: string) => {
  const element = document.getElementById(id);
  element?.scrollIntoView({ behavior: "smooth" });
};

const colorMap: Record<string, string> = {
  danger: "bg-danger text-white hover:bg-danger/90",
  default: "bg-default text-foreground hover:bg-default/90",
  primary: "bg-primary text-white hover:bg-primary/90",
  secondary: "bg-secondary text-white hover:bg-secondary/90",
  success: "bg-success text-white hover:bg-success/90",
  warning: "bg-warning text-foreground hover:bg-warning/90",
};

const variantMap: Record<string, (color: string) => string> = {
  bordered: (color) =>
    `bg-transparent border-2 border-${color} text-${color} hover:bg-${color}/10`,
  flat: (color) => `bg-${color}/20 text-${color} hover:bg-${color}/30`,
  ghost: (color) =>
    `bg-transparent border-2 border-${color} text-${color} hover:bg-${color} hover:text-white`,
  light: (color) => `bg-transparent text-${color} hover:bg-${color}/10`,
  shadow: (color) =>
    `bg-${color} text-white shadow-lg shadow-${color}/40 hover:bg-${color}/90`,
  solid: () => "", // handled by colorMap
};

const sizeMap: Record<string, string> = {
  lg: "px-6 py-3 text-base",
  md: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

export default function ScrollButton({
  children,
  className,
  color = "primary",
  size = "lg",
  targetId,
  variant = "solid",
}: ScrollButtonProps) {
  const handleClick = () => {
    // Track "Get Started" clicks when scrolling to the token form
    if (targetId === "github-token-form") {
      analytics.trackGetStartedClick();
    }

    scrollToID(targetId);
  };

  // Build classes based on variant and color
  let variantClass: string;
  if (variant === "solid" || !variantMap[variant]) {
    variantClass = colorMap[color] ?? colorMap.primary;
  } else {
    variantClass = variantMap[variant](color);
  }

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        sizeMap[size],
        variantClass,
        className,
      )}
      onClick={handleClick}
      type="button"
    >
      {children}
    </button>
  );
}
