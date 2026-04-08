import type { CSSProperties } from "react";

// ── Palette ───────────────────────────────────────────────────────────────────
// Six teintes cohérentes avec le design system Jobizy (brand navy, orange,
// accent bleu, vert, violet, or). Sélectionnée de façon déterministe par
// la somme des charCodes du nom → toujours la même couleur pour un même nom.

const PALETTES = [
  { bg: "#17324d", fg: "#ffffff" }, // navy brand
  { bg: "#f26a21", fg: "#ffffff" }, // orange brand
  { bg: "#2f8cab", fg: "#ffffff" }, // accent blue
  { bg: "#1a7f5a", fg: "#ffffff" }, // success green
  { bg: "#6e4b9e", fg: "#ffffff" }, // purple
  { bg: "#ad7a16", fg: "#ffffff" }, // gold
];

function getPalette(name: string) {
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTES[code % PALETTES.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

// ── Avatar ────────────────────────────────────────────────────────────────────

export function Avatar({
  name,
  url,
  size = 40,
  radius = "50%",
}: {
  name: string;
  url?: string | null;
  size?: number;
  radius?: string;
}) {
  const base: CSSProperties = { width: size, height: size, borderRadius: radius, flexShrink: 0 };

  if (url) {
    return <img alt={name} src={url} style={{ ...base, objectFit: "cover", display: "block" }} />;
  }

  const { bg, fg } = getPalette(name);
  return (
    <div
      aria-label={name}
      style={{
        ...base,
        background: bg,
        color: fg,
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        letterSpacing: "0.03em",
        userSelect: "none",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Presets DiceBear ──────────────────────────────────────────────────────────
// DiceBear v9 — SVG générés côté serveur, aucune clé API, gratuit.
// doc : https://www.dicebear.com/styles/
//
// Choix des styles pour refléter la diversité canadienne :
//   - Clients        → micah   : portrait face-only, conçu pour les petits cercles,
//                                 skinColor en hex pour diversité explicite
//   - Prestataires   → personas : portraits semi-réalistes pro, diversité par seed
//
// Pourquoi micah et pas avataaars ?
//   avataaars génère un personnage torse/épaules → la tête est coupée dans un
//   cercle de 40-64px. micah cadre exactement le visage → toujours lisible.

const DB = "https://api.dicebear.com/9.x";

// skinColor hex pour micah — carnations représentatives du Canada multiculturel
// (valeurs tirées de la palette officielle DiceBear micah)
const SKIN = {
  fair:       "ffdbb4", // clair européen/québécois
  golden:     "edb98a", // doré / Asie du Sud
  tan:        "d08b5b", // basané
  medBrown:   "ae5d29", // brun moyen
  darkBrown:  "694d3d", // brun foncé
  deepDark:   "4a312c", // très foncé
} as const;

// Clients — micah : visage centré, diversité explicite, prénoms canadiens
export const CLIENT_AVATAR_PRESETS: string[] = [
  `${DB}/micah/svg?seed=Sophie&skinColor[]=${SKIN.fair}&backgroundColor=b6e3f4`,
  `${DB}/micah/svg?seed=Amara&skinColor[]=${SKIN.deepDark}&backgroundColor=ffd5dc`,
  `${DB}/micah/svg?seed=Mei&skinColor[]=${SKIN.golden}&backgroundColor=c0aede`,
  `${DB}/micah/svg?seed=Emma&skinColor[]=${SKIN.fair}&backgroundColor=d1f4d1`,
  `${DB}/micah/svg?seed=Priya&skinColor[]=${SKIN.tan}&backgroundColor=fde2c0`,
  `${DB}/micah/svg?seed=Fatima&skinColor[]=${SKIN.medBrown}&backgroundColor=f4d4b6`,
  `${DB}/micah/svg?seed=Lucas&skinColor[]=${SKIN.fair}&backgroundColor=dde8ff`,
  `${DB}/micah/svg?seed=Marcus&skinColor[]=${SKIN.darkBrown}&backgroundColor=ffe8d6`,
  `${DB}/micah/svg?seed=Kenji&skinColor[]=${SKIN.golden}&backgroundColor=e8f5e9`,
  `${DB}/micah/svg?seed=Omar&skinColor[]=${SKIN.medBrown}&backgroundColor=f3e5f5`,
  `${DB}/micah/svg?seed=Liam&skinColor[]=${SKIN.fair}&backgroundColor=e0f7fa`,
  `${DB}/micah/svg?seed=Carlos&skinColor[]=${SKIN.tan}&backgroundColor=fff8e1`,
];

// Prestataires — personas : portraits semi-réalistes d'aspect professionnel,
// diversité générée automatiquement par le seed (pas de paramètre skinColor)
export const PROVIDER_AVATAR_PRESETS: string[] = [
  `${DB}/personas/svg?seed=Isabelle&backgroundColor=b6e3f4`,
  `${DB}/personas/svg?seed=Mohammed&backgroundColor=ffd5dc`,
  `${DB}/personas/svg?seed=Yuki&backgroundColor=c0aede`,
  `${DB}/personas/svg?seed=David&backgroundColor=d1f4d1`,
  `${DB}/personas/svg?seed=Aisha&backgroundColor=fde2c0`,
  `${DB}/personas/svg?seed=Jean&backgroundColor=f4d4b6`,
  `${DB}/personas/svg?seed=Ananya&backgroundColor=ffd5dc`,
  `${DB}/personas/svg?seed=Michael&backgroundColor=b6e3f4`,
  `${DB}/personas/svg?seed=Nadia&backgroundColor=c0aede`,
  `${DB}/personas/svg?seed=Alex&backgroundColor=d1f4d1`,
  `${DB}/personas/svg?seed=Tariq&backgroundColor=fde2c0`,
  `${DB}/personas/svg?seed=Marie&backgroundColor=f4d4b6`,
];

// ── AvatarPicker ──────────────────────────────────────────────────────────────

export function AvatarPicker({
  value,
  onChange,
  presets,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  presets: string[];
  label?: string;
}) {
  return (
    <div className="avatar-picker-wrap">
      {label && <p className="avatar-picker-label">{label}</p>}
      <div className="avatar-picker-grid">
        {presets.map((url) => (
          <button
            className={value === url ? "avatar-option avatar-option-active" : "avatar-option"}
            key={url}
            onClick={() => onChange(value === url ? "" : url)}
            title="Choisir cet avatar"
            type="button"
          >
            <img alt="" src={url} />
          </button>
        ))}
      </div>
    </div>
  );
}
