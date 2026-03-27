"use client";

import { ElementType } from "react";
import { useStyleTheme } from "@/components/StyleThemeProvider";

interface PencilTextProps {
  children: string;
  as?: ElementType;
  className?: string;
  /** ms per character, default 38 */
  speed?: number;
}

/** Renders text that appears character-by-character like a pencil writing,
 *  only active in the sketchy theme. Falls back to plain element otherwise. */
export function PencilText({
  children,
  as: Tag = "span",
  className,
  speed = 38,
}: PencilTextProps) {
  const { styleTheme } = useStyleTheme();

  if (styleTheme !== "sketchy") {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag className={className} aria-label={children}>
      {Array.from(children).map((char, i) => {
        // Pseudo-random tilt per character (-3 to +3 deg), deterministic by index
        const rot = (((i * 37 + 11) % 13) - 6) * 0.5;
        return (
          <span
            key={i}
            aria-hidden="true"
            style={{
              display: "inline-block",
              opacity: 0,
              transformOrigin: "bottom center",
              ["--char-rot" as string]: `${rot}deg`,
              animation: "pencil-char 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards",
              animationDelay: `${i * speed}ms`,
            }}
          >
            {char === " " ? "\u00a0" : char}
          </span>
        );
      })}
    </Tag>
  );
}
