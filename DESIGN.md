# Design System Specification: Heritage Editorial

## 1. Overview & Creative North Star
**Creative North Star: "The Modern Heirloom"**
This design system rejects the sterile, "cookie-cutter" aesthetic of modern SaaS in favor of a digital experience that feels as tactile and intentional as a high-end travel journal. We are building for Kerala—a land of deep textures, rhythmic monsoons, and ancient craftsmanship. 

The goal is **Organic Editorialism**. We achieve this by breaking the traditional grid with intentional asymmetry, allowing images to bleed off-edge, and using "Display" typography at scales that feel authoritative yet calm. We do not "box" content; we "place" it onto a canvas of ivory and palm.

---

## 2. Colors & Surface Philosophy

### The "No-Line" Rule
**Lines are a failure of layout.** To maintain a premium, seamless feel, 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through:
1.  **Background Color Shifts:** Placing a `surface-container-low` card against a `surface` background.
2.  **Negative Space:** Using the Spacing Scale to create clear mental groupings.
3.  **Tonal Transitions:** Subtle shifts from `primary` to `primary-container`.

### Surface Hierarchy & Nesting
Think of the UI as a series of stacked, handmade papers. Use the `surface-container` tiers to create depth:
*   **Base:** `surface` (#fefae0) - The primary canvas.
*   **Low-Level Elevation:** `surface-container-low` (#f8f4db) - For secondary content areas.
*   **High-Level Focus:** `surface-container-highest` (#e7e3ca) - For prominent cards or interactive modules.

### The "Glass & Soul" Rule
While we avoid "heavy" glassmorphism, use **Subtle Backblur** for top navigation bars or floating action buttons. 
*   **Signature Textures:** Apply a 3% opacity grain overlay or a subtle "monsoon line" pattern to `primary-container` backgrounds to give them a physical, woven quality.
*   **Gradients:** Use a soft radial gradient (from `primary` #012d1d to `primary-container` #1b4332) for Hero sections to avoid a flat, "digital" green.

---

## 3. Typography: The Editorial Voice

Our typography is a conversation between the ancient and the contemporary.

*   **The Hero (Noto Serif):** Used for `display` and `headline` levels. It conveys the "Trustworthy" and "Culturally Grounded" pillars. Use `display-lg` for destination names to create an immersive, magazine-like header.
*   **The Guide (Plus Jakarta Sans):** Used for `title`, `body`, and `label` levels. It is modern, geometric, and highly legible, ensuring the "Modern" and "Calm" pillars are met during high-utility tasks (booking, reading itineraries).

**Hierarchy Principle:** Always pair a large `headline-lg` with a significantly smaller `label-md` in `secondary` (#924c00) for a sophisticated, tiered information architecture.

---

## 4. Elevation & Depth: Tonal Layering

### The Layering Principle
Depth is achieved by stacking tones, not drawing boxes. 
*   **Interaction:** When a user taps a card, it should transition from `surface-container-low` to `surface-container-lowest`. This creates a "pressing into the paper" feel rather than a "hovering over the screen" feel.

### Ambient Shadows
Shadows must be invisible.
*   **Value:** Blur: 24px–40px | Opacity: 4%–6%.
*   **Color:** Never use pure black. Use a tinted version of `on-surface` (#1d1c0d).
*   **Ghost Border Fallback:** If a container sits on a background of the same color, use a `outline-variant` (#c1c8c2) at **12% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` (#012d1d) with `on-primary` (#ffffff) text. Use `md` (0.75rem) roundedness. No shadows; the depth comes from the high contrast against the `surface`.
*   **Secondary:** `secondary-container` (#fda055) with `on-secondary-container` (#703800). This is our "Terracotta" action, used for "Book Now" or "Explore."

### Tactile Chips
*   **Filter Chips:** Use `surface-container-high` as the base. When selected, transition to `tertiary-container` (#56340e) with a `muted gold` outline. These should look like physical tokens.

### Cards & Lists (The "No-Divider" Rule)
*   Forbid `horizontal-rule` dividers.
*   **Lists:** Use `spacing-6` (2rem) of vertical white space to separate list items. 
*   **Cards:** Use `surface-container-low` with a generous `xl` (1.5rem) corner radius. Imagery should always have a 1:1 or 4:5 aspect ratio to feel like professional photography.

### Input Fields
*   **Style:** Minimalist. No enclosing box. Use a "Bottom Stroke" only, using the `outline` token (#717973) at 30% opacity. Upon focus, the label (Plus Jakarta Sans) should animate to a `label-sm` in `secondary` (#924c00).

### Special Component: The Heritage Carousel
*   An asymmetric image gallery where the first image is `display-lg` size and the subsequent images are smaller, overlapping the first by `spacing-4`. This mimics a scrapbook or curated photo album.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use `secondary` (#924c00) for small, meaningful accents (icons, underlines, price tags).
*   **Do** allow for generous white space. If a screen feels "full," it is no longer premium.
*   **Do** use asymmetrical margins. For example, a 24pt left margin and a 16pt right margin can make a layout feel more "designed" and less "templated."

### Don’t
*   **Don't** use pure black (#000000) or pure white (#FFFFFF). Always stick to the ivory `surface` and deep palm `primary`.
*   **Don't** use standard Material Design "Drop Shadows." They break the organic, grounded feel of the brand.
*   **Don't** use high-vibrancy icons. Icons should be thin-stroke (1.5px) and use the `outline` or `primary` color tokens.