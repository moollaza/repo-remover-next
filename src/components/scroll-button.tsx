"use client";

import { Button } from "@heroui/react";

import { analytics } from "@/utils/analytics";

interface ScrollButtonProps {
  children: React.ReactNode;
  className?: string;
  color?: "danger" | "default" | "primary" | "secondary" | "success" | "warning";
  size?: "lg" | "md" | "sm";
  targetId: string;
  variant?: "bordered" | "faded" | "flat" | "ghost" | "light" | "shadow" | "solid";
}

const scrollToID = (id: string) => {
  const element = document.getElementById(id);
  element?.scrollIntoView({ behavior: "smooth" });
};

export default function ScrollButton({
  children,
  className,
  color = "primary",
  size = "lg",
  targetId,
  variant = "solid"
}: ScrollButtonProps) {
  const handlePress = () => {
    // Track "Get Started" clicks when scrolling to the token form
    if (targetId === "github-token-form") {
      analytics.trackGetStartedClick();
    }

    scrollToID(targetId);
  };

  return (
    <Button
      className={className}
      color={color}
      onPress={handlePress}
      size={size}
      variant={variant}
    >
      {children}
    </Button>
  );
}