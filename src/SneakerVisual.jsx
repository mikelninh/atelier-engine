import React, { useEffect, useRef } from "react";
import { PALETTES } from "./sneakerEngine.js";

function solePath(type, boldness) {
  const lift = Math.round((boldness - 50) * 0.22);
  if (type === "quiet") return `M92 292 C190 304 320 308 456 302 C548 299 611 287 650 267 L660 302 C594 327 486 337 342 337 C224 337 142 328 82 311 Z`;
  if (type === "split") return `M78 291 C170 302 266 309 349 307 L341 338 C247 340 157 330 78 312 Z M365 306 C489 307 584 292 651 262 L668 297 C596 329 492 341 374 338 Z`;
  if (type === "wave") return `M76 287 C152 314 234 285 318 310 C408 337 492 285 650 260 L671 296 C558 340 470 328 393 349 C310 371 218 331 77 315 Z`;
  return `M77 287 C172 307 276 301 351 309 C455 321 557 293 648 263 L666 300 C577 335 482 346 374 338 C265 349 162 333 80 314 Z M138 ${323 + lift} L190 ${303 + lift} L244 ${331 + lift} L306 ${307 + lift} L364 ${338 + lift} L425 ${311 + lift} L486 ${332 + lift} L546 ${300 + lift} L607 ${313 + lift}`;
}

function heelGeometry(heel) {
  if (heel === "fin") return <path d="M121 122 L92 67 L156 108 L171 187 Z" className="shoe-accent" />;
  if (heel === "halo") return <path d="M104 159 C66 130 68 87 116 79 C161 72 185 102 174 145" fill="none" className="shoe-accent-stroke" />;
  if (heel === "frame") return <path d="M112 130 L78 112 L74 231 L134 248" fill="none" className="shoe-accent-stroke" />;
  return null;
}

function upperDetails(upper) {
  if (upper === "panelled") return (
    <>
      <path d="M169 172 C244 188 310 183 374 190 L338 253 C282 248 224 245 166 236 Z" className="shoe-secondary" />
      <path d="M364 190 C438 198 510 215 575 246 L529 278 C463 253 407 248 337 253 Z" className="shoe-primary-light" />
    </>
  );
  if (upper === "sock") return <path d="M161 90 C192 99 210 121 211 166 L166 178 C158 144 151 119 161 90 Z" className="shoe-secondary" />;
  if (upper === "exo") return (
    <>
      <path d="M177 157 L268 184 L238 244 L162 226 Z" fill="none" className="shoe-accent-stroke thin" />
      <path d="M269 184 L389 197 L349 258 L238 244 Z" fill="none" className="shoe-accent-stroke thin" />
      <path d="M390 198 L501 224 L452 270 L349 258 Z" fill="none" className="shoe-accent-stroke thin" />
    </>
  );
  return <path d="M177 176 C280 183 421 199 534 242" fill="none" className="shoe-secondary-stroke" />;
}

function laces(type) {
  if (type === "hidden") return <path d="M269 183 C320 197 363 202 404 204" fill="none" className="shoe-accent-stroke thin" />;
  if (type === "speed") return [0,1,2,3].map((i) => <path key={i} d={`M${257 + i*30} ${184+i*5} L${286+i*28} ${225+i*4}`} className="shoe-accent-stroke thin" />);
  if (type === "cross") return [0,1,2].flatMap((i) => [
    <path key={"a"+i} d={`M${255+i*34} ${187+i*5} L${287+i*34} ${224+i*3}`} className="shoe-accent-stroke thin" />,
    <path key={"b"+i} d={`M${288+i*34} ${190+i*5} L${255+i*34} ${220+i*3}`} className="shoe-accent-stroke thin" />,
  ]);
  return [0,1,2,3].map((i) => <path key={i} d={`M${256 + i*30} ${188+i*5} L${278+i*29} ${222+i*4}`} className="shoe-accent-stroke thin" />);
}

export function SneakerVisual({ sneaker, className = "" }) {
  const palette = PALETTES[sneaker.palette] || PALETTES.moon;
  const toeTip = sneaker.toe === "sharp" ? 665 : sneaker.toe === "split" ? 648 : 655;
  const toeY = sneaker.toe === "sharp" ? 256 : 269;
  const heelTop = sneaker.heel === "low" ? 153 : 126;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ "--primary": palette.primary, "--secondary": palette.secondary, "--accent": palette.accent, "--sole": palette.sole }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_38%,rgba(255,255,255,.9),rgba(255,255,255,.18)_35%,transparent_65%)]" />
      <svg viewBox="0 0 720 420" className="relative h-full w-full drop-shadow-[0_28px_28px_rgba(25,23,20,.16)]" role="img" aria-label="Live generated sneaker">
        <ellipse cx="365" cy="343" rx="278" ry="25" fill="rgba(28,25,22,.10)" />
        <path
          d={`M120 280 C124 238 123 194 142 ${heelTop} C162 112 184 110 205 139 C223 165 236 176 272 181 C354 190 419 192 482 214 C536 232 584 249 ${toeTip} ${toeY} C650 288 600 298 544 299 L202 300 C162 300 134 294 120 280 Z`}
          className="shoe-primary"
        />
        {heelGeometry(sneaker.heel)}
        {upperDetails(sneaker.upper)}
        <path d="M187 145 C225 152 252 174 270 194 L238 239 C207 219 179 204 149 203" fill="none" className="shoe-secondary-stroke" />
        {laces(sneaker.lacing)}
        <path d={solePath(sneaker.sole, sneaker.soleBoldness)} className="shoe-sole" />
        {sneaker.toe === "split" && <path d="M600 257 C617 268 628 280 633 295" fill="none" className="shoe-accent-stroke thin" />}
        <path d="M154 273 C254 288 420 293 574 278" fill="none" stroke="rgba(255,255,255,.42)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="205" cy="278" r="7" className="shoe-accent" />
      </svg>
      <div className="absolute bottom-4 left-4 rounded-full border border-black/5 bg-white/65 px-3 py-1.5 text-[10px] uppercase tracking-[.2em] backdrop-blur">
        {sneaker.material} · {sneaker.upper} · {sneaker.sole}
      </div>
    </div>
  );
}

function drawPixelBase(ctx, sneaker) {
  const p = PALETTES[sneaker.palette] || PALETTES.moon;
  ctx.clearRect(0, 0, 64, 32);

  const soleY = sneaker.soleBoldness > 70 ? 25 : 24;
  const heelTop = sneaker.heel === "low" ? 13 : 10;
  const toeX = sneaker.toe === "sharp" ? 59 : 57;

  ctx.fillStyle = p.primary;
  ctx.beginPath();
  ctx.moveTo(9, 23);
  ctx.lineTo(10, heelTop);
  ctx.lineTo(13, 8);
  ctx.lineTo(18, 12);
  ctx.lineTo(22, 15);
  ctx.lineTo(35, 16);
  ctx.lineTo(45, 18);
  ctx.lineTo(toeX, 22);
  ctx.lineTo(56, 24);
  ctx.lineTo(15, 24);
  ctx.closePath();
  ctx.fill();

  if (sneaker.upper === "panelled" || sneaker.upper === "exo") {
    ctx.fillStyle = p.secondary;
    ctx.fillRect(15, 14, 9, 7);
    ctx.fillRect(25, 16, 10, 6);
    ctx.fillRect(37, 18, 10, 5);
  }
  if (sneaker.upper === "sock") {
    ctx.fillStyle = p.secondary;
    ctx.fillRect(12, 7, 5, 9);
  }

  ctx.fillStyle = p.accent;
  if (sneaker.heel === "fin") {
    ctx.fillRect(8, 7, 3, 7);
    ctx.fillRect(7, 6, 2, 4);
  } else if (sneaker.heel === "frame") {
    ctx.fillRect(7, 10, 2, 13);
    ctx.fillRect(8, 10, 5, 2);
  } else if (sneaker.heel === "halo") {
    ctx.fillRect(8, 8, 2, 7);
    ctx.fillRect(10, 6, 5, 2);
    ctx.fillRect(15, 8, 2, 5);
  }

  ctx.fillStyle = p.sole;
  ctx.fillRect(8, soleY, 48, 4);
  if (sneaker.sole === "sculpted") {
    ctx.fillStyle = p.secondary;
    for (let x = 12; x < 54; x += 8) ctx.fillRect(x, soleY + 3, 4, 2);
  } else if (sneaker.sole === "split") {
    ctx.clearRect(31, soleY + 1, 4, 4);
  } else if (sneaker.sole === "wave") {
    ctx.fillStyle = p.secondary;
    ctx.fillRect(14, soleY + 3, 7, 2);
    ctx.fillRect(27, soleY + 4, 8, 2);
    ctx.fillRect(42, soleY + 2, 8, 2);
  }

  ctx.fillStyle = p.accent;
  if (sneaker.lacing !== "hidden") {
    for (let i = 0; i < 4; i += 1) {
      const x = 23 + i * 4;
      ctx.fillRect(x, 17 + Math.floor(i / 2), 1, 4);
      if (sneaker.lacing === "cross") ctx.fillRect(x + 2, 17 + Math.floor(i / 2), 1, 4);
    }
  } else {
    ctx.fillRect(24, 18, 15, 1);
  }

  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.fillRect(15, 12, 5, 1);
  ctx.fillRect(39, 19, 7, 1);
  ctx.fillStyle = p.accent;
  ctx.fillRect(17, 22, 2, 2);

  if (sneaker.toe === "split") {
    ctx.clearRect(53, 22, 1, 2);
    ctx.fillStyle = p.accent;
    ctx.fillRect(53, 22, 1, 2);
  }
}

export function PixelSneaker({ sneaker, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    drawPixelBase(ctx, sneaker);
  }, [sneaker]);

  return (
    <canvas
      ref={ref}
      width="64"
      height="32"
      className={`pixel-canvas ${className}`}
      aria-label="64 by 32 game-ready pixel sneaker"
    />
  );
}

export function exportPixelSneaker(sneaker, scale = 1) {
  const base = document.createElement("canvas");
  base.width = 64;
  base.height = 32;
  const baseCtx = base.getContext("2d");
  baseCtx.imageSmoothingEnabled = false;
  drawPixelBase(baseCtx, sneaker);

  const output = document.createElement("canvas");
  output.width = 64 * scale;
  output.height = 32 * scale;
  const ctx = output.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, 0, output.width, output.height);

  const link = document.createElement("a");
  link.download = `atelier-sneaker-${sneaker.seed}-${64 * scale}x${32 * scale}.png`;
  link.href = output.toDataURL("image/png");
  link.click();
}
