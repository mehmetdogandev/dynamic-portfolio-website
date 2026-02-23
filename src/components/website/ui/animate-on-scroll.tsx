"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimationVariant = "fadeUp" | "fadeLeft" | "fadeRight" | "scale" | "slideUp";

type AnimateOnScrollProps = {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  className?: string;
};

function getVariants(variant: AnimationVariant, delay: number): Variants {
  const ease = [0.22, 1, 0.36, 1] as const;
  const map = {
    fadeUp: {
      hidden: { opacity: 0, y: 32 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease, delay },
      },
    },
    fadeLeft: {
      hidden: { opacity: 0, x: -40 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease, delay },
      },
    },
    fadeRight: {
      hidden: { opacity: 0, x: 40 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease, delay },
      },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease, delay },
      },
    },
    slideUp: {
      hidden: { opacity: 0, y: 48 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease, delay },
      },
    },
  };
  return map[variant] as Variants;
}

export function AnimateOnScroll({
  children,
  variant = "fadeUp",
  delay = 0,
  className,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const variants = getVariants(variant, delay);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
