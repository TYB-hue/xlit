"use client";

import { useEffect, useRef } from "react";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    // Mobile Safari evaluates these element properties before deciding whether
    // autoplay is permitted. Set both attributes and properties explicitly.
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playSilently = () => {
      void video.play().catch(() => {
        // Browsers that still decline autoplay keep the poster/gradient visible.
      });
    };

    const resumeWhenVisible = () => {
      if (!document.hidden) playSilently();
    };

    playSilently();
    video.addEventListener("canplay", playSilently, { once: true });
    document.addEventListener("visibilitychange", resumeWhenVisible);

    return () => {
      video.removeEventListener("canplay", playSilently);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 -z-20 h-full w-full object-cover"
      autoPlay
      loop
      muted
      defaultMuted
      playsInline
      preload="metadata"
      poster="/products/texturebg.jpg"
      aria-hidden="true"
    >
      <source src="/videos/bg.mp4" type="video/mp4" />
    </video>
  );
}
