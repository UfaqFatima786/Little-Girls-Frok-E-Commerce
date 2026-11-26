import Particles, { ParticlesProvider } from "@tsparticles/react";
import { useEffect, useMemo, useState } from "react";
import { loadSlim } from "@tsparticles/slim";

const options = {
  fullScreen: { enable: false },
  fpsLimit: 45,
  particles: {
    color: { value: "#bd4078" },
    links: {
      enable: true,
      distance: 100,
      color: "#a3014a9f",
      opacity: 0.35,
      width: 1.2,
    },
    move: { enable: true, speed: 0.45 },
    number: { value: 30, density: { enable: true, area: 850 } },
    opacity: { value: 0.92 },
    shape: { type: "circle" },
    size: { value: { min: 2, max: 4 } },
  },
  detectRetina: true,
};

export default function ParticleBackground() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const updateMotionPreference = (event) =>
      setReducedMotion(event.matches);

    motionPreference.addEventListener("change", updateMotionPreference);
    return () =>
      motionPreference.removeEventListener("change", updateMotionPreference);
  }, []);

  const particleOptions = useMemo(
    () => ({
      ...options,
      particles: {
        ...options.particles,
        move: { ...options.particles.move, enable: !reducedMotion },
      },
    }),
    [reducedMotion],
  );

  return (
    <div className="hero-particles" aria-hidden="true">
      <ParticlesProvider init={loadSlim}>
        <Particles id="hero-particles" options={particleOptions} />
      </ParticlesProvider>
    </div>
  );
}
