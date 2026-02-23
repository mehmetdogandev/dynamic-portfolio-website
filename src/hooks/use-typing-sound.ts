"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useTypingSound(): () => void {
  const audioContextRef = useRef<AudioContext | null>(null);
  const canPlayRef = useRef(false);

  const play = useCallback(() => {
    if (!canPlayRef.current) return;
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === "suspended") return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
    gain.gain.setValueAtTime(0.012, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      if (canPlayRef.current) return;
      const AudioCtx = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      canPlayRef.current = true;
    };

    const events = ["click", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => document.addEventListener(ev, handleInteraction, { once: true, passive: true }));

    return () => {
      events.forEach((ev) => document.removeEventListener(ev, handleInteraction));
    };
  }, []);

  return play;
}
