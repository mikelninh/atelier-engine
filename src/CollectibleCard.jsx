import React from "react";
import { PixelSneaker } from "./SneakerVisual.jsx";
import { WORLDS, getFlavorText, getGameStats, getRarity, getSneakerName } from "./sneakerEngine.js";

function Stat({ label, value, icon }) {
  return (
    <div className="rift-card-stat">
      <span className="rift-card-stat-icon">{icon}</span>
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

export default function CollectibleCard({ sneaker, compact = false }) {
  const world = WORLDS[sneaker.world] || WORLDS.sky;
  const rarity = getRarity(sneaker);
  const stats = getGameStats(sneaker);
  const name = getSneakerName(sneaker);
  const flavor = getFlavorText(sneaker);

  return (
    <article
      className={"rift-card " + (compact ? "rift-card-compact" : "")}
      style={{ "--world": world.css.glow, "--world2": world.css.glow2, "--rarity": rarity.color }}
    >
      <div className="rift-card-stars" />
      <div className="rift-card-top">
        <span className="rift-brand-mini">RIFTSOLE</span>
        <span className="rift-card-tagline">COLLECT THE STEP</span>
      </div>

      <div className="rift-card-rarity">
        <span>{rarity.gem}</span>
        <b>{rarity.label}</b>
        <span>{rarity.gem}</span>
      </div>

      <div className="rift-card-world">
        <div className="rift-card-world-copy">
          <small>{world.name}</small>
          <span>{world.tagline}</span>
        </div>
        <div className="rift-card-stage">
          <div className="rift-card-aura" />
          <PixelSneaker sneaker={sneaker} className="rift-card-sprite" />
          <div className="rift-card-pedestal">
            <span>{sneaker.world === "ember" ? "SHADOW STEPS" : sneaker.world === "moss" ? "HIGHER TRAILS" : "LIGHTER STEPS"}</span>
            <span>BRIGHTER DAYS</span>
          </div>
        </div>
      </div>

      <div className="rift-card-name">{name}</div>

      <div className="rift-card-stats">
        <Stat label="SPEED" value={stats.speed} icon="➤" />
        <Stat label="STYLE" value={stats.style} icon="✦" />
        <Stat label="GRIP" value={stats.grip} icon="◉" />
      </div>

      <blockquote>{flavor}</blockquote>

      <div className="rift-card-foot">
        <span>DNA #{String(sneaker.seed).slice(-6).padStart(6, "0")}</span>
        <strong>STEP INTO MORE</strong>
      </div>
    </article>
  );
}
