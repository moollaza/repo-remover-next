"use client";

import { Button } from "@heroui/react";

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
  return (
    <Button
      className={className}
      color={color}
      onPress={() => scrollToID(targetId)}
      size={size}
      variant={variant}
    >
      {children}
    </Button>
  );
}