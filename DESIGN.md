# DESIGN.md — Skillr Visual System

## Colors (OKLCH)
- **Primary (Emerald)**: `oklch(0.45 0.15 160)` (Rich, deep green for trust and action)
- **Secondary (Slate)**: `oklch(0.25 0.02 240)` (Deep base for text and borders)
- **Surface**: `oklch(0.98 0.005 160)` (Tinted off-white for cards and backgrounds)
- **Accent**: `oklch(0.65 0.25 150)` (Vibrant lime/emerald for highlights)

## Typography
- **Display**: Instrument Serif (Italicized for the "Skillr" brand feel)
- **Sans**: Inter or Geist (Precision and readability for UI)
- **Scale**: Major Third (1.25 ratio)

## Elevation & Spacing
- **Rhythm**: 8px grid.
- **Elevation**: Subtle shadows for cards (`shadow-card`). Avoid heavy glow except on active states.
- **Radius**: Large, organic corners (`rounded-3xl` or `rounded-full`).

## Components
- **The Card**: The central unit. Snella (slim) by default, expandable on click. 
- **The Swipe Button**: Large, touch-friendly, high contrast.
- **The Badge**: Minimalist, monochromatic tints.

## Scene Sentence
A busy tech recruiter on a 14" MacBook in a bright, modern office, needing to evaluate 20 candidates in 5 minutes with maximum clarity and zero noise.
