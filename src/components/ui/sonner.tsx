"use client";

import { Toaster as Sonner } from "sonner";

interface ToasterProps {
  theme?: "light" | "dark" | "system";
}

const Toaster = ({ theme = "dark" }: ToasterProps) => {
  return (
    <Sonner
      theme={theme}
      position="top-right"
      richColors
      closeButton
    />
  );
};

export { Toaster };
