/**
 * Générateur OG images brand L'Observatoire des Pros.
 *
 * Pattern satori + resvg-js, pattern reusable STACK-2026 (expert-menuiserie
 * validé 23/04 : 97 articles, 100s build).
 *
 * Design : palette éditoriale (paper + ink + or), Fraunces italic pour le
 * display, Inter pour les meta, mention d'édition en bandeau haut, accent or
 * en bandeau bas.
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";

const fontsDir = path.join(process.cwd(), "src", "assets", "fonts");

// Chargement au module-load pour amortir sur les N générations build-time
const FRAUNCES_500 = fs.readFileSync(path.join(fontsDir, "Fraunces-500-italic.woff"));
const FRAUNCES_600 = fs.readFileSync(path.join(fontsDir, "Fraunces-600-italic.woff"));
const INTER_500 = fs.readFileSync(path.join(fontsDir, "Inter-500.woff"));
const INTER_700 = fs.readFileSync(path.join(fontsDir, "Inter-700.woff"));
const INTER_800 = fs.readFileSync(path.join(fontsDir, "Inter-800.woff"));

export const COLORS = {
  paper: "#F7F3EC",
  ink: "#1A1614",
  inkSoft: "#4A4038",
  observatoire: "#1E3A52",
  or: "#B8863D",
  cachet: "#8B2E2A",
  paperShade: "#EEE8DD",
};

export type OgPillVariant = "or" | "observatoire" | "cachet" | "ghost";

export interface OgPill {
  label: string;
  variant?: OgPillVariant;
}

export interface OgOptions {
  /** Méta-label du haut, petit caps (ex "Édition N°1 · Classement") */
  kicker: string;
  /** Titre éditorial, Fraunces italic display (3 lignes max idéalement) */
  title: string;
  /** Sous-titre factuel, Inter 500 (1-2 lignes) */
  subtitle?: string;
  /** Pills en bas (metier, dept, count, certif) */
  pills?: OgPill[];
  /** Folio en bas à droite ("lobservatoiredespros.com") */
  folio?: string;
}

const pillBg = (v: OgPillVariant | undefined) => {
  switch (v) {
    case "or":
      return { bg: "rgba(184, 134, 61, 0.12)", border: "rgba(184, 134, 61, 0.55)", color: "#8A5F1F" };
    case "observatoire":
      return { bg: "rgba(30, 58, 82, 0.10)", border: "rgba(30, 58, 82, 0.45)", color: COLORS.observatoire };
    case "cachet":
      return { bg: "rgba(139, 46, 42, 0.10)", border: "rgba(139, 46, 42, 0.45)", color: COLORS.cachet };
    default:
      return { bg: "transparent", border: "rgba(26, 22, 20, 0.30)", color: COLORS.ink };
  }
};

/** Monogramme OdP : O barré de la longue-vue Observatoire, accent or. */
function logoMark(size = 64) {
  return {
    type: "svg",
    props: {
      width: size,
      height: size,
      viewBox: "0 0 64 64",
      children: [
        {
          type: "circle",
          props: { cx: 32, cy: 32, r: 28, fill: "none", stroke: COLORS.ink, strokeWidth: 2 },
        },
        {
          type: "path",
          props: {
            d: "M 8 32 L 56 32",
            stroke: COLORS.ink,
            strokeWidth: 1.2,
          },
        },
        {
          type: "path",
          props: {
            d: "M 32 8 L 32 56",
            stroke: COLORS.ink,
            strokeWidth: 1.2,
          },
        },
        {
          type: "circle",
          props: { cx: 32, cy: 32, r: 6, fill: COLORS.or },
        },
        {
          type: "circle",
          props: { cx: 32, cy: 32, r: 2.5, fill: COLORS.paper },
        },
      ],
    },
  };
}

export async function renderOgPng(opts: OgOptions): Promise<Buffer> {
  const { kicker, title, subtitle, pills = [], folio = "lobservatoiredespros.com" } = opts;

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          width: "1200px",
          height: "630px",
          backgroundColor: COLORS.paper,
          padding: "64px 72px",
          fontFamily: "Inter",
          color: COLORS.ink,
          position: "relative",
        },
        children: [
          // Trame subtile en haut (trait éditorial)
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                backgroundColor: COLORS.ink,
                display: "flex",
              },
            },
          },
          // Bandeau haut : logo + wordmark
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: { display: "flex", alignItems: "center", gap: 18 },
                    children: [
                      logoMark(56),
                      {
                        type: "div",
                        props: {
                          style: { display: "flex", flexDirection: "column" },
                          children: [
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 15,
                                  fontWeight: 700,
                                  letterSpacing: 3,
                                  textTransform: "uppercase",
                                  color: COLORS.ink,
                                },
                                children: "L'Observatoire",
                              },
                            },
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontFamily: "Fraunces",
                                  fontStyle: "italic",
                                  fontSize: 26,
                                  fontWeight: 500,
                                  color: COLORS.ink,
                                  marginTop: -2,
                                },
                                children: "des Pros",
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                // Kicker
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: 2.5,
                      textTransform: "uppercase",
                      color: COLORS.or,
                      padding: "6px 14px",
                      border: `1px solid ${COLORS.or}`,
                      borderRadius: 999,
                    },
                    children: kicker,
                  },
                },
              ],
            },
          },
          // Spacer
          { type: "div", props: { style: { flex: 1, display: "flex" } } },
          // Titre display Fraunces italic
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                fontFamily: "Fraunces",
                fontStyle: "italic",
                fontSize: title.length > 90 ? 54 : title.length > 60 ? 62 : 72,
                fontWeight: 600,
                lineHeight: 1.06,
                letterSpacing: -1.5,
                color: COLORS.ink,
                maxWidth: "100%",
                textWrap: "balance",
              },
              children: title,
            },
          },
          // Subtitle (optional)
          ...(subtitle
            ? [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontFamily: "Inter",
                      fontSize: 22,
                      fontWeight: 500,
                      color: COLORS.inkSoft,
                      marginTop: 20,
                      lineHeight: 1.35,
                      maxWidth: "85%",
                    },
                    children: subtitle,
                  },
                },
              ]
            : []),
          // Spacer
          { type: "div", props: { style: { flex: 1, display: "flex" } } },
          // Pills + folio
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                width: "100%",
                borderTop: `1px solid ${COLORS.paperShade}`,
                paddingTop: 24,
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: { display: "flex", gap: 10, flexWrap: "wrap" },
                    children: pills.slice(0, 4).map((p) => {
                      const c = pillBg(p.variant);
                      return {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            padding: "6px 14px",
                            backgroundColor: c.bg,
                            border: `1px solid ${c.border}`,
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: 1.2,
                            textTransform: "uppercase",
                            color: c.color,
                          },
                          children: p.label,
                        },
                      };
                    }),
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: 14,
                      fontWeight: 500,
                      letterSpacing: 1.5,
                      color: COLORS.inkSoft,
                    },
                    children: folio,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Fraunces", data: FRAUNCES_500, weight: 500, style: "italic" },
        { name: "Fraunces", data: FRAUNCES_600, weight: 600, style: "italic" },
        { name: "Inter", data: INTER_500, weight: 500, style: "normal" },
        { name: "Inter", data: INTER_700, weight: 700, style: "normal" },
        { name: "Inter", data: INTER_800, weight: 800, style: "normal" },
      ],
    }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  return resvg.render().asPng();
}
