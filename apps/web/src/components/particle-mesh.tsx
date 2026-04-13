"use client";

import { useRef, useEffect } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  radius: number;
  opacity: number;
  pulseSpeed: number;
  pulseOffset: number;
  grabbed: boolean;      // frozen by click
  grabX: number;         // position when grabbed
  grabY: number;
}

interface ColorSet {
  primary: { r: number; g: number; b: number };
  accent: { r: number; g: number; b: number };
  lineOpacity: number;
  dotOpacity: number;
  glowOpacity: number;
  signalOpacity: number;
}

const DARK: ColorSet = {
  primary: { r: 124, g: 110, b: 246 },
  accent: { r: 167, g: 139, b: 250 },
  lineOpacity: 0.25,
  dotOpacity: 1,
  glowOpacity: 0.08,
  signalOpacity: 0.7,
};

const LIGHT: ColorSet = {
  primary: { r: 100, g: 80, b: 200 },
  accent: { r: 120, g: 70, b: 220 },
  lineOpacity: 0.35,
  dotOpacity: 0.9,
  glowOpacity: 0.15,
  signalOpacity: 0.8,
};

function getColors(): ColorSet {
  if (typeof document === "undefined") return DARK;
  return document.documentElement.classList.contains("dark") ? DARK : LIGHT;
}

export function ParticleMesh({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const maybeCtx = cvs.getContext("2d");
    if (!maybeCtx) return;
    const canvas = cvs;
    const ctx = maybeCtx;

    let animId: number;
    let disposed = false;
    let colors = getColors();

    // ── Config ──
    const PARTICLE_COUNT = 90;
    const CONNECTION_DIST = 140;
    const MOUSE_RADIUS = 260;
    const MOUSE_REPEL = 0.35;
    const BASE_SPEED = 0.25;
    const GRAB_RADIUS = 60;         // how close to grab a particle
    const MAX_STRETCH = 120;        // max drag stretch distance

    // ── State ──
    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let mouse = { x: -9999, y: -9999, active: false };

    // Drag state
    let isDragging = false;
    let dragVel = { x: 0, y: 0 };
    let prevDrag = { x: 0, y: 0 };
    let fieldVel = { x: 0, y: 0 };

    // Watch theme changes
    const observer = new MutationObserver(() => {
      colors = getColors();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 0.5 + 0.5) * BASE_SPEED;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx,
          vy,
          baseVx: vx,
          baseVy: vy,
          radius: Math.random() * 1.5 + 1,
          opacity: Math.random() * 0.4 + 0.3,
          pulseSpeed: Math.random() * 0.02 + 0.005,
          pulseOffset: Math.random() * Math.PI * 2,
          grabbed: false,
          grabX: 0,
          grabY: 0,
        });
      }
    }

    /** Convert page coords to canvas-local coords */
    function toLocal(pageX: number, pageY: number) {
      const rect = canvas.getBoundingClientRect();
      return { x: pageX - rect.left, y: pageY - rect.top };
    }

    function animate() {
      if (disposed) return;
      animId = requestAnimationFrame(animate);

      ctx.clearRect(0, 0, w, h);

      const now = performance.now() * 0.001;
      const { primary, accent, lineOpacity, dotOpacity, glowOpacity, signalOpacity } = colors;

      // Decay field velocity
      fieldVel.x *= 0.98;
      fieldVel.y *= 0.98;
      if (Math.abs(fieldVel.x) < 0.001) fieldVel.x = 0;
      if (Math.abs(fieldVel.y) < 0.001) fieldVel.y = 0;

      // ── Update particles ──
      for (const p of particles) {
        // Grabbed particles follow mouse with stretch limit
        if (p.grabbed && isDragging) {
          const dx = mouse.x - p.grabX;
          const dy = mouse.y - p.grabY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > MAX_STRETCH) {
            const scale = MAX_STRETCH / dist;
            p.x = p.grabX + dx * scale;
            p.y = p.grabY + dy * scale;
          } else {
            p.x = p.grabX + dx;
            p.y = p.grabY + dy;
          }
          continue; // skip normal movement
        }

        let moveX = p.vx + fieldVel.x;
        let moveY = p.vy + fieldVel.y;

        // Hover repel (only when not dragging)
        if (mouse.active && !isDragging) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * MOUSE_REPEL;
            moveX += (dx / dist) * force;
            moveY += (dy / dist) * force;
          }
        }

        p.x += moveX;
        p.y += moveY;

        p.vx += (p.baseVx - p.vx) * 0.01;
        p.vy += (p.baseVy - p.vy) * 0.01;

        const margin = 20;
        if (p.x < -margin) p.x = w + margin;
        if (p.x > w + margin) p.x = -margin;
        if (p.y < -margin) p.y = h + margin;
        if (p.y > h + margin) p.y = -margin;
      }

      // ── Draw connections ──
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Stretch connections further for grabbed particles
          const maxDist = (a.grabbed || b.grabbed)
            ? CONNECTION_DIST + MAX_STRETCH
            : CONNECTION_DIST;

          if (dist < maxDist) {
            let opacity = (1 - dist / maxDist) * lineOpacity;

            // Grabbed connections glow brighter
            if (a.grabbed || b.grabbed) {
              opacity = Math.min(opacity * 1.8, lineOpacity * 2);
            }

            let brightness = 0;
            if (mouse.active) {
              const mx = (a.x + b.x) / 2 - mouse.x;
              const my = (a.y + b.y) / 2 - mouse.y;
              const mDist = Math.sqrt(mx * mx + my * my);
              if (mDist < MOUSE_RADIUS) {
                brightness = (1 - mDist / MOUSE_RADIUS) * 0.3;
              }
            }

            const r = primary.r + (accent.r - primary.r) * brightness;
            const g = primary.g + (accent.g - primary.g) * brightness;
            const bl = primary.b + (accent.b - primary.b) * brightness;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${r | 0},${g | 0},${bl | 0},${opacity + brightness * 0.15})`;
            ctx.lineWidth = (a.grabbed || b.grabbed) ? 1.2 : 0.8;
            ctx.stroke();
          }
        }
      }

      // ── Draw particles ──
      for (const p of particles) {
        const pulse = Math.sin(now * p.pulseSpeed * 60 + p.pulseOffset) * 0.15 + 0.85;
        const alpha = p.opacity * pulse * dotOpacity;

        let glow = false;
        if (p.grabbed) {
          glow = true;
        } else if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS * 0.5) glow = true;
        }

        if (glow) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * (p.grabbed ? 6 : 4), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${accent.r},${accent.g},${accent.b},${alpha * glowOpacity * (p.grabbed ? 2 : 1)})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (p.grabbed ? 1.8 : glow ? 1.3 : 1), 0, Math.PI * 2);
        const c = (glow || p.grabbed) ? accent : primary;
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
        ctx.fill();
      }

      // ── Signal pulse ──
      const pulseIdx = Math.floor(now * 0.5) % particles.length;
      const pA = particles[pulseIdx];
      const pB = particles[(pulseIdx + 7) % particles.length];
      if (pA && pB && !pA.grabbed && !pB.grabbed) {
        const dx = pA.x - pB.x;
        const dy = pA.y - pB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST * 1.2) {
          const t = (now * 0.8) % 1;
          const px = pA.x + (pB.x - pA.x) * t;
          const py = pA.y + (pB.y - pA.y) * t;

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${accent.r},${accent.g},${accent.b},${signalOpacity})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(px, py, 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${accent.r},${accent.g},${accent.b},${signalOpacity * 0.12})`;
          ctx.fill();
        }
      }
    }

    // ── Event handlers (on document to catch through overlays) ──
    const onMouseMove = (e: MouseEvent) => {
      const pos = toLocal(e.clientX, e.clientY);
      // Only track if mouse is within canvas bounds
      if (pos.x >= 0 && pos.x <= w && pos.y >= 0 && pos.y <= h) {
        mouse.x = pos.x;
        mouse.y = pos.y;
        mouse.active = true;
      } else {
        mouse.active = false;
      }

      if (isDragging) {
        dragVel.x = pos.x - prevDrag.x;
        dragVel.y = pos.y - prevDrag.y;
        prevDrag.x = pos.x;
        prevDrag.y = pos.y;
      }
    };

    const onMouseLeave = () => {
      mouse.active = false;
      if (isDragging) {
        releaseGrabbed();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const pos = toLocal(e.clientX, e.clientY);
      if (pos.x < 0 || pos.x > w || pos.y < 0 || pos.y > h) return;

      isDragging = true;
      prevDrag.x = pos.x;
      prevDrag.y = pos.y;
      dragVel.x = 0;
      dragVel.y = 0;

      // Grab nearby particles
      for (const p of particles) {
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < GRAB_RADIUS) {
          p.grabbed = true;
          p.grabX = p.x;
          p.grabY = p.y;
        }
      }
    };

    function releaseGrabbed() {
      // Release grabbed particles with a snap-back spring
      for (const p of particles) {
        if (p.grabbed) {
          // Give them velocity based on stretch direction
          const dx = p.x - p.grabX;
          const dy = p.y - p.grabY;
          p.vx = dx * 0.05 + dragVel.x * 0.1;
          p.vy = dy * 0.05 + dragVel.y * 0.1;
          p.grabbed = false;
        }
      }
      // Also apply drag vel to field
      fieldVel.x += dragVel.x * 0.08;
      fieldVel.y += dragVel.y * 0.08;
      const maxField = 3;
      fieldVel.x = Math.max(-maxField, Math.min(maxField, fieldVel.x));
      fieldVel.y = Math.max(-maxField, Math.min(maxField, fieldVel.y));

      isDragging = false;
    }

    const onPointerUp = () => {
      if (isDragging) {
        releaseGrabbed();
      }
    };

    // ── Init ──
    resize();
    createParticles();

    // Use document-level listeners so events pass through z-indexed overlays
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);

    const onResize = () => {
      resize();
      for (const p of particles) {
        if (p.x > w) p.x = Math.random() * w;
        if (p.y > h) p.y = Math.random() * h;
      }
    };
    window.addEventListener("resize", onResize);

    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      observer.disconnect();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
