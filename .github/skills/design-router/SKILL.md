---
name: design-router
description: Router for 67 bundled design themes. Use whenever building or restyling UI and a visual direction is needed — it maps the desired vibe (minimal, playful, retro, enterprise, glassmorphism, etc.) to the right theme file to load. Trigger on "design style", "make it look...", "UI theme", "visual direction", or any request to build a page/app with a specific aesthetic.
license: MIT
metadata:
  author: typeui.sh (catalog) / router by user
---

# Design Skill Router

This skill bundles 67 design themes from typeui.sh. Each theme lives in
`themes/<slug>.md` (relative to this SKILL.md) and contains a full design
system: tokens, typography, spacing, component rules, quality gates, and
design intent.

## How to use this router

1. Identify the desired visual direction from the user's request (explicit style name, adjectives, product type, or references).
2. Pick ONE theme from the catalog below. If ambiguous, ask the user or default to `clean` for apps and `modern` for marketing sites.
3. Read `themes/<slug>.md` in this skill's folder and follow it as the design system for all UI you generate.
4. Do not mix multiple themes in one project unless the user asks.

If the user names a style that matches a slug exactly (e.g. "neobrutalism", "glassmorphism"), skip the catalog and load `themes/<slug>.md` directly.

## Catalog

### Minimal & clean
| Slug | When to pick |
|---|---|
| `minimal` | Maximum whitespace, restrained color, stripped-back clarity |
| `clean` | Simple, legible, low-clutter general-purpose UI |
| `sleek` | Modern minimalism with subtle interactions and tight spacing |
| `spacious` | Generous whitespace and breathing grid layouts |
| `geometric` | Precise shapes, neutral colors, structure that stays out of the way |
| `codex` | Radically minimal blank-canvas, black as the only color, typography-led |
| `shadcn` | shadcn/ui-style monochrome, utility-first components |
| `flat` | Two-dimensional, vibrant flat colors, no shadows or 3D |

### Professional & enterprise
| Slug | When to pick |
|---|---|
| `professional` | Trustworthy business-ready design |
| `corporate` | Brand-aligned enterprise patterns and structured grids |
| `ant` | Data-dense enterprise web apps (Ant Design flavor) |
| `enterprise` | Dark cloud-platform dashboards, glass panels, data hierarchy |
| `stitch` | High-contrast enterprise data workflows, drag-and-drop |
| `roku` | Purple-themed app dashboard, developer-first workflows |
| `levels` | Conversion-focused, friction-free funnels and CTAs |
| `agentic` | AI/chat-first interfaces, delegated task flows |

### Editorial & print
| Slug | When to pick |
|---|---|
| `editorial` | Magazine-style serif layouts, elegant reading |
| `modern` | Contemporary editorial, serif type, minimal palettes |
| `basic` | Print-inspired books/magazines/reports, editorial grids |
| `paper` | Paper-textured, tactile print feel |
| `claude` | Research-journal aesthetic on warm ivory, near-black slate ink |
| `refined` | Curated minimal with elegant serifs, understated palettes |
| `square` | Delicate typography, polished, sophisticated |
| `impeccable` | Graphic editorial-poster look, cream + burnt orange, amber accent |
| `terracotta` | Sun-baked clay tones, cream surfaces, display serif headlines |

### Premium & dramatic
| Slug | When to pick |
|---|---|
| `premium` | Apple-inspired precision and polish |
| `power` | High-end dark monochrome, bold headings |
| `bold` | Heavyweight type, high contrast, commanding layouts |
| `dramatic` | Theatrical, immersive, unconventional compositions |
| `fantasy` | Game-inspired premium fantasy visuals |
| `futuristic` | Tech-forward sleek innovation aesthetic |
| `cosmic` | Sci-fi dark themes with neon accents and spatial depth |
| `matrix` | Cyber-slick dark-only Matrix-inspired |
| `mono` | Monospace hacker-chic, compact and high-contrast |

### Playful & friendly
| Slug | When to pick |
|---|---|
| `friendly` | Rounded, soft pastels, approachable |
| `lingo` | Duolingo-like bright colors, tactile 3D borders |
| `creative` | Character-driven landing pages, expressive type |
| `expressive` | Vibrant personality with structure |
| `vibrant` | Lively bold playful typography, warm accents |
| `colorful` | High-contrast palettes and gradients |
| `fiction` | Children's-book cartoon style, thick outlines, cream background |
| `doodle` | Hand-drawn doodles and handwritten fonts |
| `sketch` | Pencil-sketch on cream paper, teal accents |
| `cafe` | Cozy warm tones, relaxed browsing feel |
| `storytelling` | Narrative-driven emotional journeys |
| `immersive` | Exhibit-style interactive storytelling on one brand-colored canvas |

### Effects & materials
| Slug | When to pick |
|---|---|
| `glassmorphism` | Frosted glass, blur, translucent layers |
| `claymorphism` | Puffy clay-like 3D rounded shapes |
| `neumorphism` | Soft extruded elements, monochrome shadows |
| `skeumorphism` | Real-world textures and physical metaphors |
| `gradient` | Gradient-rich modern surfaces |
| `neon` | Electric glow, high-contrast neon pairings |
| `perspective` | Isometric/3D spatial depth and layering |
| `material` | Google Material Design system |

### Retro & raw
| Slug | When to pick |
|---|---|
| `retro` | Vintage typography and nostalgic palettes |
| `vintage` | 1950s–90s nostalgia, grain, pixel touches |
| `dithered` | Dot-pattern retro rendering, limited palette |
| `riso` | Two-color risograph print on off-white paper |
| `brutalism` | Raw anti-design, unadorned, jarring |
| `neobrutalism` | Bold borders, vivid accents, warm surfaces |
| `pacman` | 8-bit arcade, pixel fonts, dotted borders |
| `sega` | Arcade pixel typeface, chunky pressed buttons |
| `tetris` | Block-game colors, bold display fonts |
| `artistic` | High-contrast expressive creative typography |
| `pulse` | Thick borders, geometric shapes, high-contrast colors conveying motion and vitality |

### Layout-driven
| Slug | When to pick |
|---|---|
| `bento` | Modular bento-grid card layouts |
| `contemporary` | Current-era minimalism, bento grids, dark mode |

## Quick defaults

- Dashboard/SaaS app → `clean`, `ant`, or `enterprise` (dark)
- Marketing/landing page → `modern`, `creative`, or `impeccable`
- Dev tool → `shadcn`, `mono`, or `codex`
- Game/kids product → `sega`, `fiction`, or `lingo`
- Blog/docs/long-form → `editorial`, `paper`, or `claude`
