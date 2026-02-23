"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTypingSound } from "@/hooks/use-typing-sound";

type SequentialTypewriterProps = {
  texts: string[];
  speed?: number;
  blinkCount?: number;
  blinkInterval?: number;
  playKeySound?: boolean;
  className?: string;
};

export function SequentialTypewriter({
  texts,
  speed = 90,
  blinkCount = 3,
  blinkInterval = 500,
  playKeySound: enableKeySound = true,
  className,
}: SequentialTypewriterProps) {
  const playKeySoundFn = useTypingSound();
  const playRef = useRef(playKeySoundFn);
  playRef.current = playKeySoundFn;
  const [phase, setPhase] = useState<"typing" | "blinking">("typing");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedLength, setDisplayedLength] = useState(0);
  const [blinkStep, setBlinkStep] = useState(0);
  const [showCaret, setShowCaret] = useState(true);

  const currentText = texts[currentIndex] ?? "";
  const isComplete = currentIndex >= texts.length;

  useEffect(() => {
    if (isComplete) {
      const hideTimer = setTimeout(() => setShowCaret(false), 1500);
      return () => clearTimeout(hideTimer);
    }

    if (phase === "typing") {
      if (displayedLength >= currentText.length) {
        setPhase("blinking");
        setBlinkStep(0);
        return;
      }
      const timer = setTimeout(() => {
        if (enableKeySound) playRef.current();
        setDisplayedLength((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }

    if (phase === "blinking") {
      if (blinkStep >= blinkCount) {
        if (currentIndex + 1 >= texts.length) {
          setShowCaret(false);
          setCurrentIndex(texts.length);
          return;
        }
        setCurrentIndex((prev) => prev + 1);
        setDisplayedLength(0);
        setPhase("typing");
        return;
      }
      const timer = setTimeout(() => setBlinkStep((s) => s + 1), blinkInterval);
      return () => clearTimeout(timer);
    }
  }, [
    phase,
    currentIndex,
    displayedLength,
    blinkStep,
    currentText.length,
    speed,
    blinkCount,
    blinkInterval,
    texts.length,
    isComplete,
  ]);

  if (texts.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {texts.map((text, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex;
        const displayValue =
          isPast ? text : isActive ? text.slice(0, displayedLength) : "";

        if (displayValue === "" && !isPast) return null;

        const showCursor = isActive && showCaret && phase === "typing";
        const showBlinkCursor =
          isActive &&
          showCaret &&
          phase === "blinking" &&
          blinkStep < blinkCount;

        if (i === 0) {
          return (
            <h2
              key={i}
              className="font-heading text-xl font-bold tracking-tight md:text-2xl text-foreground"
            >
              {displayValue}
              {(showCursor || showBlinkCursor) && (
                <span
                  className={cn(
                    "ml-0.5 inline-block h-[1em] w-[2px] align-baseline",
                    showBlinkCursor ? "animate-pulse bg-primary" : "bg-primary"
                  )}
                  aria-hidden
                />
              )}
            </h2>
          );
        }

        if (i === 1) {
          return (
            <p
              key={i}
              className="text-muted-foreground text-sm md:text-base"
            >
              {displayValue}
              {(showCursor || showBlinkCursor) && (
                <span
                  className={cn(
                    "ml-0.5 inline-block h-[1em] w-[2px] align-baseline",
                    showBlinkCursor ? "animate-pulse bg-primary" : "bg-primary"
                  )}
                  aria-hidden
                />
              )}
            </p>
          );
        }

        const isQuoteDone = isPast || (isActive && displayedLength >= text.length);
        return (
          <blockquote
            key={i}
            className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground text-sm"
          >
            &ldquo;{displayValue}
            {(showCursor || showBlinkCursor) && (
              <span
                className={cn(
                  "ml-0.5 inline-block h-[1em] w-[2px] align-baseline",
                  showBlinkCursor ? "animate-pulse bg-primary" : "bg-primary"
                )}
                aria-hidden
              />
            )}
            {isQuoteDone && "\u201D"}
          </blockquote>
        );
      })}
    </div>
  );
}
