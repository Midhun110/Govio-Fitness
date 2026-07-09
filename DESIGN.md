# Govio Fitness Onboarding Flow - Design System Reference

This document serves as the official design system reference for the **Govio Fitness Onboarding Flow** project (Stitch Project ID: `projects/15867779029191512868`). It outlines the colors, typography, spacing, and styling rules required to implement the UI consistently across the codebase.

---

## 1. Design Overview

* **Brand Vibe:** High-Contrast Minimalism / Kinetic Obsidian
* **Color Mode:** Dark Mode
* **General Roundness:** Full Roundness (`ROUND_FULL`)
* **Primary Custom Color:** `#D4FF13` (Vibrant Green)
* **Secondary Custom Color:** `#F97316` (Warm Orange)

### Brand & Style Philosophy
This design system is built on a foundation of **High-Contrast Minimalism** tailored for a premium fitness experience. The aesthetic centers on a "Pure Black" environment to minimize ocular strain during workouts and to create a prestigious, focused atmosphere. The brand personality is energetic yet disciplined, utilizing vibrant accents to signify action and progress against a void-like backdrop.

---

## 2. Color Palette

The color system uses specific hex codes mapped to Material Design tokens.

### Theme Colors

| Token | Hex Value | Visual representation & Purpose |
| :--- | :--- | :--- |
| **background** | `#0D141D` | Main dark background canvas |
| **surface** | `#0D141D` | Standard component surfaces |
| **surface-dim** | `#0D141D` | Slightly darker/dimmed surfaces |
| **surface-bright** | `#333A44` | Highlighted surfaces, alerts, etc. |
| **surface-container-lowest** | `#080F17` | Lowest container elevation background |
| **surface-container-low** | `#151C25` | Low container elevation background |
| **surface-container** | `#192029` | Default container background |
| **surface-container-high** | `#232A34` | High container elevation background |
| **surface-container-highest**| `#2E353F` | Highest container elevation background |
| **primary** | `#4BE277` | Accent text and secondary state representations |
| **on-primary** | `#003915` | Text/icons on primary-colored elements |
| **primary-container** | `#D4FF13` | Main interactive element container background (Vibrant Green) |
| **on-primary-container** | `#004B1E` | Muted text/icons on primary containers |
| **secondary** | `#FFB690` | Secondary visual elements |
| **on-secondary** | `#552100` | Text/icons on secondary-colored elements |
| **secondary-container** | `#EC6A06` | Secondary interactive containers (Warm Orange) |
| **on-secondary-container** | `#4A1C00` | Muted text/icons on secondary containers |
| **on-background** | `#DCE3F0` | Default body text color |
| **on-surface** | `#DCE3F0` | Default text on surfaces |
| **on-surface-variant** | `#BCCBB9` | Muted body or label text |
| **outline** | `#869585` | Dividers and borders |
| **outline-variant** | `#3D4A3D` | Muted borders |

---

## 3. Typography

The typography scale utilizes **Lexend** for headlines to leverage its athletic, highly readable, and geometric character, and **Hanken Grotesk** as the workhorse for body text and labels to provide technical precision.

### Type Scale

| Role | Font Family | Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **display** | Lexend | `40px` | `700` (Bold) | `48px` | `-0.02em` |
| **headline-lg** | Lexend | `32px` | `600` (Semi-Bold) | `40px` | `-0.01em` |
| **headline-lg-mobile** | Lexend | `28px` | `600` (Semi-Bold) | `34px` | Standard |
| **body-md** | Hanken Grotesk | `16px` | `400` (Regular) | `24px` | Standard |
| **label-md** | Hanken Grotesk | `14px` | `600` (Semi-Bold) | `20px` | `0.01em` |
| **label-sm** | Hanken Grotesk | `12px` | `500` (Medium) | `16px` | Standard |

---

## 4. Spacing & Layout

The spacing scale is built on a `4px` baseline grid system to ensure visual consistency and rhythm.

### Spacing Scale

| Token | Value | Intended Usage |
| :--- | :--- | :--- |
| **base** | `4px` | Fine adjustments, micro-padding |
| **xs** | `8px` | Component internal item spacing, tight groupings |
| **sm** | `12px` | Grid columns, medium item gaps |
| **md** | `16px` | Standard layout gaps, card padding |
| **lg** | `24px` | Page content margins, large section gaps |
| **xl** | `32px` | Vertical spacing between major layout blocks |
| **gutter** | `16px` | Standard grid gutter width |
| **margin-mobile** | `20px` | Horizontal outer safe margins on mobile |

---

## 5. Shape & Corner Radii

Corner radii determine the visual softness of containers and controls.

| Token | Value | Application |
| :--- | :--- | :--- |
| **sm** | `0.5rem` (`8px`) | Small buttons, small badge tags |
| **DEFAULT** | `1rem` (`16px`) | Standard cards, interactive controls |
| **md** | `1.5rem` (`24px`) | Large containers, card panels |
| **lg** | `2.0rem` (`32px`) | Dialog modals, full-bleed bottom sheets |
| **xl** | `3.0rem` (`48px`) | Extreme soft rounded panels |
| **full** | `9999px` | Pill buttons, circular avatars, selection chips |

---

## 6. Implementation & Guidelines

### 1. Elevation & Depth
In a dark environment, traditional drop shadows are ineffective. Depth is achieved through **Tonal Layering** and **Stroke Definition**:
* **Base Layer:** Pure Black / `#0D141D`.
* **Surface Layer:** Dark Charcoal (`#192029` / `#151C25` / `#111111` equivalent) is used for cards and containers to create a subtle "lift" from the background.
* **Outlines:** Interactive elements use a subtle 1px border (`#262626` / `#3D4A3D`) to define their boundaries.
* **Backdrop:** Photography used on the landing screen should have a 60–80% black gradient overlay at the bottom to ensure typography remains legible.

### 2. Buttons
* **Primary Buttons:** High-contrast Green (`#D4FF13`) background with Black (`#000000`) bold text. Always pill-shaped (`ROUND_FULL`).
* **Secondary Buttons:** Ghost style with a thin outline and light text.

### 3. Onboarding Progress Bar
* A thin, `2px` progress bar located at the very top of the viewport. The filled portion uses the primary green (`#D4FF13`).

### 4. Input Fields & Controls
* Pill-shaped with a dark container background (`#151C25`) and a subtle outline. Placeholder text uses the muted gray palette (`#9CA3AF`).
* For selection grids (e.g., goals), selected cards gain a `2px` green border and a subtle green inner glow.
