"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TypewriterTextProps = {
  text: string;
  speed?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
};

export function TypewriterText({
  text,
  speed = 90,
  className,
  as: Component = "h2",
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCaret, setShowCaret] = useState(true);

  useEffect(() => {
    setDisplayedText("");
    setShowCaret(true);

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    const typingDuration = text.length * speed;
    const hideCaretTimer = setTimeout(
      () => setShowCaret(false),
      typingDuration + 2500
    );

    return () => {
      clearInterval(timer);
      clearTimeout(hideCaretTimer);
    };
  }, [text, speed]);

  return (
    <Component className={cn("inline", className)}>
      {displayedText}
      {showCaret && (
        <span
          className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-primary align-baseline"
          aria-hidden
        />
      )}
    </Component>
  );
}
