
"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-clipvobe-gray-800 group-[.toaster]:text-white group-[.toaster]:border-clipvobe-gray-700 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-clipvobe-gray-300",
          actionButton:
            "group-[.toast]:bg-clipvobe-cyan group-[.toast]:text-clipvobe-dark",
          cancelButton:
            "group-[.toast]:bg-clipvobe-gray-700 group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
