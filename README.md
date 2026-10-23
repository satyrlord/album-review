# ALBANA

ALBANA is a static web app for deep-listening album notes, with track-by-track timestamp breakdowns covering structure, production technique, energy arc, and musical function.

**Live site →** <https://satyrlord.github.io/album-review/>

## Prerequisites

Use Node.js `22.23.4` or later in the 22.x line, `24.22.1` or later in the
24.x line, or `26.12.1` or later. Install dependencies with `npm ci` before
you run project commands.

These minimum versions include the Brotli decoder fix for CVE-2026-111497
from the [October 2026 Node.js security releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).
CI and Pages builds use Node.js `22.23.4`. Update local Node.js installations
before running project tools, including tools that download remote content.
