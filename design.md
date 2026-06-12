# Design System Inspired by Bluesky

## 1. Visual Theme & Atmosphere

Bluesky's design system embodies a clean, open, and accessible social platform aesthetic. The visual identity centers on a serene sky-blue palette paired with neutral grays, creating a calm and approachable digital environment. The design prioritizes clarity and human connection, with generous whitespace, rounded forms, and soft typography that invite users into a platform built for genuine community interaction. The mood is contemporary yet warm, balancing professional polish with friendly approachability—reflecting the platform's core mission of social media you control.

**Key Characteristics**
- Soft, rounded forms with generous border radius on interactive elements
- Sky-inspired blue as the dominant accent, symbolizing openness and freedom
- Neutral gray hierarchy for secondary information and structural elements
- Generous whitespace and breathing room between components
- Clean, readable typography with intentional weight hierarchy
- Minimal visual noise with strategic use of color for emphasis
- Accessible contrast ratios throughout the palette
- Modern, minimal aesthetic with human-centered design

## 2. Color Palette & Roles

### Primary
- **Sky Blue** (`#006AFF`): Primary call-to-action buttons, key interactive elements, and brand accent color

### Accent Colors
- **Slate Blue** (`#667B99`): Secondary UI elements, muted interactive states, and tertiary text
- **Darker Slate** (`#405168`): Hover states and emphasis for secondary elements
- **Pink** (`#EC4899`): Highlight accents, secondary CTAs, or interactive feedback

### Interactive
- **Interactive Blue** (`#006AFF`): Links, active states, and primary interactive elements
- **Interactive Slate** (`#405168`): Secondary interactive hover states
- **Interactive Pink** (`#EC4899`): Alternative action emphasis or micro-interactions

### Neutral Scale
- **Black** (`#000000`): Primary text, dominant UI elements, and structural components
- **Dark Charcoal** (`#232E3E`): Deep backgrounds and strong contrast text
- **Dark Slate** (`#151D28`): Alternative dark background or text
- **Medium Slate** (`#2C3A4E`): Mid-tone neutral for borders and dividers
- **Light Gray** (`#DCE2EA`): Subtle borders, dividers, and disabled states
- **Lighter Gray** (`#EFF2F6`): Background tints and light surfaces
- **Off-White** (`#F9FAFB`): Light background surfaces and card backgrounds
- **White** (`#FFFFFF`): Primary surface and card backgrounds

### Surface & Borders
- **Surface Base** (`#FFFFFF`): Primary card and modal backgrounds
- **Surface Secondary** (`#F9FAFB`): Alternative surface tint for depth
- **Surface Tertiary** (`#EFF2F6`): Minimal contrast background accents
- **Border Light** (`#DCE2EA`): Primary border color for cards and dividers
- **Border Subtle** (`#E2E7EE`): Very subtle borders and hairlines

## 3. Typography Rules

### Font Family
- **Primary Font:** InterVariable (system font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`)
- **Secondary Font:** Same as primary (single font family system)
- **Monospace Fallback:** `"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|---|---|
| Display / Hero | InterVariable | 48px | 700 | 58px | -0.5px | Large marketing headlines |
| Heading 1 | InterVariable | 32px | 700 | 40px | -0.3px | Page section titles |
| Heading 2 | InterVariable | 24px | 700 | 32px | -0.2px | Subsection headers |
| Heading 3 | InterVariable | 20px | 600 | 28px | 0px | Card and modal titles |
| Body Large | InterVariable | 16px | 400 | 24px | 0px | Primary body text, navigation |
| Body Regular | InterVariable | 15px | 400 | 18px | 0px | Standard paragraph text, form labels |
| Body Small | InterVariable | 14px | 400 | 20px | 0px | Secondary information, metadata |
| Button Text | InterVariable | 16px | 600 | 24px | 0px | Interactive button labels |
| Link Text | InterVariable | 15px | 600 | 17px | 0px | Navigation links, text links |
| Caption | InterVariable | 12px | 400 | 16px | 0px | Timestamps, small helper text |
| Code | InterVariable | 13px | 500 | 20px | 0px | Inline and block code |

### Principles
- **Consistent Scale:** Typography follows a 4px/8px base unit for harmonious sizing
- **Weight Clarity:** Only two weights used—400 for body/regular and 600/700 for emphasis—reducing cognitive load
- **Readable Line Height:** Always 1.25× to 1.5× font size for comfortable reading
- **Neutral Spacing:** Letter spacing remains at 0 for standard readability; tightened only for display sizes
- **Accessible Contrast:** All text meets WCAG AA standards against background colors

## 4. Component Stylings

### Buttons

#### Primary Button
- **Background Color:** `#006AFF`
- **Text Color:** `#FFFFFF`
- **Font Size:** `16px`
- **Font Weight:** `600`
- **Padding:** `12px 32px`
- **Border Radius:** `999px`
- **Border:** `0px solid transparent`
- **Line Height:** `24px`
- **Hover State:**
  - Background Color: `#0052CC`
  - Cursor: `pointer`
  - Box Shadow: `0 4px 12px rgba(0, 106, 255, 0.3)`
- **Active State:**
  - Background Color: `#003FA3`
  - Box Shadow: `0 2px 8px rgba(0, 106, 255, 0.2)`
- **Disabled State:**
  - Background Color: `#DCE2EA`
  - Text Color: `#667B99`
  - Cursor: `not-allowed`

#### Secondary Button
- **Background Color:** `transparent`
- **Text Color:** `#006AFF`
- **Font Size:** `16px`
- **Font Weight:** `600`
- **Padding:** `12px 32px`
- **Border Radius:** `999px`
- **Border:** `2px solid #006AFF`
- **Line Height:** `24px`
- **Hover State:**
  - Background Color: `#EFF2F6`
  - Text Color: `#0052CC`
  - Border Color: `#0052CC`
- **Active State:**
  - Background Color: `#DCE2EA`
  - Text Color: `#003FA3`
  - Border Color: `#003FA3`

#### Ghost Button
- **Background Color:** `transparent`
- **Text Color:** `#667B99`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Padding:** `5px 5px`
- **Border Radius:** `999px`
- **Border:** `0px solid transparent`
- **Line Height:** `normal`
- **Height:** `28px`
- **Hover State:**
  - Background Color: `#F9FAFB`
  - Text Color: `#405168`
- **Active State:**
  - Background Color: `#EFF2F6`
  - Text Color: `#2C3A4E`

### Cards & Containers

#### Card Base
- **Background Color:** `#FFFFFF`
- **Border:** `1px solid #DCE2EA`
- **Border Radius:** `12px`
- **Padding:** `16px`
- **Box Shadow:** `0 1px 3px rgba(0, 0, 0, 0.08)`

#### Card Elevated
- **Background Color:** `#FFFFFF`
- **Border:** `1px solid #E2E7EE`
- **Border Radius:** `12px`
- **Padding:** `16px`
- **Box Shadow:** `0 4px 12px rgba(0, 0, 0, 0.12)`

#### Card Subtle
- **Background Color:** `#F9FAFB`
- **Border:** `1px solid #EFF2F6`
- **Border Radius:** `12px`
- **Padding:** `16px`
- **Box Shadow:** `none`

### Inputs & Forms

#### Text Input
- **Background Color:** `#FFFFFF`
- **Border:** `1px solid #DCE2EA`
- **Border Radius:** `8px`
- **Padding:** `12px 16px`
- **Font Size:** `15px`
- **Font Weight:** `400`
- **Line Height:** `18px`
- **Text Color:** `#000000`
- **Placeholder Color:** `#667B99`
- **Focus State:**
  - Border Color: `#006AFF`
  - Box Shadow: `0 0 0 3px rgba(0, 106, 255, 0.1)`
  - Outline: `none`
- **Error State:**
  - Border Color: `#EC4899`
  - Box Shadow: `0 0 0 3px rgba(236, 72, 153, 0.1)`
- **Disabled State:**
  - Background Color: `#F9FAFB`
  - Border Color: `#E2E7EE`
  - Text Color: `#8798B0`
  - Cursor: `not-allowed`

#### Form Label
- **Font Size:** `15px`
- **Font Weight:** `600`
- **Color:** `#000000`
- **Margin Bottom:** `8px`
- **Line Height:** `18px`

#### Form Helper Text
- **Font Size:** `12px`
- **Font Weight:** `400`
- **Color:** `#667B99`
- **Margin Top:** `4px`
- **Line Height:** `16px`

### Navigation

#### Navigation Base
- **Background Color:** `transparent`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Padding:** `10px 20px`
- **Border Radius:** `0px`
- **Text Color:** `#000000`
- **Height:** Auto

#### Navigation Link Active
- **Text Color:** `#006AFF`
- **Font Weight:** `600`
- **Border Bottom:** `2px solid #006AFF`

#### Navigation Link Hover
- **Background Color:** `#F9FAFB`
- **Text Color:** `#405168`

### Links

#### Text Link
- **Color:** `#006AFF`
- **Font Size:** `15px`
- **Font Weight:** `600`
- **Text Decoration:** `none`
- **Padding:** `0px`
- **Line Height:** `17px`
- **Cursor:** `pointer`
- **Hover State:**
  - Color: `#0052CC`
  - Text Decoration: `underline`
- **Active State:**
  - Color: `#003FA3`
- **Visited State:**
  - Color: `#667B99`

#### Secondary Link
- **Color:** `#667B99`
- **Font Size:** `15px`
- **Font Weight:** `400`
- **Text Decoration:** `none`
- **Padding:** `0px`
- **Line Height:** `17px`
- **Hover State:**
  - Color: `#405168`
  - Text Decoration: `underline`

## 5. Layout Principles

### Spacing System
- **Base Unit:** `4px`
- **Scale:** `4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 80px, 96px`
- **Padding Contexts:**
  - Buttons: `12px 32px` (vertical/horizontal multiples of 4px)
  - Cards: `16px` (1 base unit × 4)
  - Form inputs: `12px 16px` (1.5 and 2 base units)
  - Section margins: `32px–64px` (vertical rhythm)
- **Gap Values:**
  - Component spacing: `8px` (tight grouping)
  - Section spacing: `16px–24px` (breathing room)
  - Page margins: `16px–32px` (responsive context)

### Grid & Container
- **Max Container Width:** `1200px`
- **Grid Columns:** 12-column responsive grid
- **Column Gutters:** `16px` (8px each side)
- **Section Patterns:**
  - Hero sections: Full viewport width with centered max-width content
  - Card grids: Auto-fit with `minmax(300px, 1fr)` for responsive columns
  - Sidebar layouts: 25% sidebar / 75% main at desktop, stacked on mobile
- **Horizontal Padding:**
  - Desktop: `32px`–`64px` margins
  - Tablet: `24px` margins
  - Mobile: `16px` margins

### Whitespace Philosophy
- **Generous Breathing Room:** Whitespace is treated as a design element, not filler. Components are spaced to encourage scanning and reduce cognitive load.
- **Vertical Rhythm:** Consistent 8px vertical spacing between sections maintains visual harmony.
- **Negative Space:** Cards and modals use 16px–24px internal padding to ensure content clarity.
- **Section Separation:** Use of 32px–64px gaps between major sections creates natural visual breaks.

### Border Radius Scale
- **No Radius:** `0px` (structural dividers, full-width sections)
- **Subtle Radius:** `4px` (small inputs, subtle refinement)
- **Standard Radius:** `8px` (cards, containers, form inputs)
- **Generous Radius:** `12px` (large cards, modals, emphasized containers)
- **Full Radius (Pill):** `999px` (buttons, badges, fully rounded elements)

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| **Base (None)** | No shadow | Flat surfaces, text-only elements |
| **Level 1** | `0 1px 3px rgba(0, 0, 0, 0.08)` | Default cards, subtle elevation |
| **Level 2** | `0 4px 12px rgba(0, 0, 0, 0.12)` | Elevated cards, dropdowns, popovers |
| **Level 3** | `0 8px 20px rgba(0, 0, 0, 0.15)` | Modals, full overlays, top-level UI |
| **Interactive Hover** | `0 4px 12px rgba(0, 106, 255, 0.3)` | Primary button hover states |
| **Interactive Focus** | `0 0 0 3px rgba(0, 106, 255, 0.1)` | Focus rings on inputs and buttons |

**Shadow Philosophy:** Bluesky uses minimal, soft shadows to create subtle depth without visual heaviness. Shadows are layered based on component hierarchy, with the most prominent elements receiving the strongest elevation. Color-tinted shadows (blue for interactive) reinforce the brand while maintaining accessibility. Shadows fade gracefully and never feel harsh or artificial.

## 7. Do's and Don'ts

### Do
- **Use the primary blue (`#006AFF`)** for all main call-to-action buttons and essential interactive elements
- **Maintain consistent border radius** across similar component types for cohesive visual language
- **Apply generous spacing** between sections and components to emphasize clarity and openness
- **Use the slate gray palette** (`#667B99`, `#405168`) for secondary information and muted states
- **Ensure all interactive elements** have clear hover and active states with visual feedback
- **Follow the 4px spacing scale** for margins, padding, and gaps to maintain rhythm
- **Leverage white space** as a design element to reduce cognitive load and improve scanning
- **Test contrast ratios** to ensure all text meets WCAG AA minimum standards
- **Use the full border radius scale** (4px, 8px, 12px, 999px) depending on component role
- **Implement smooth transitions** (200ms–300ms) on hover and focus states for Polish

### Don't
- **Avoid using pure black (`#000000`)** for large text blocks; use dark gray for a softer read
- **Don't mix border radius values** randomly; stick to the defined scale (4px, 8px, 12px, 999px)
- **Avoid excessive shadows**; multiple nested shadows create visual noise and reduce clarity
- **Don't override button styling** with inline styles; use component variants instead
- **Avoid cramped spacing**; whitespace is a core part of the design language
- **Don't use the pink accent (`#EC4899`)** for primary actions; reserve it for secondary emphasis
- **Avoid low-contrast text combinations**; all text must pass WCAG AA accessibility standards
- **Don't apply shadows to text-only elements** unless they are interactive
- **Avoid inconsistent typography weights**; use only 400 and 600 weights for hierarchy
- **Don't nest modals or dropdowns more than one level deep**; keep UI structure simple and scannable

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|---|
| **Mobile Small** | 320px–479px | Single column, max 100% width, 16px margins, stacked navigation |
| **Mobile Large** | 480px–639px | Single column, 16px margins, simplified components |
| **Tablet** | 640px–1023px | 2-column grid, 24px margins, flexible card layout |
| **Desktop** | 1024px–1439px | 3+ columns, 32px margins, sidebar layouts available |
| **Desktop Large** | 1440px+ | 12-column grid, 64px max margins, expanded container width |

### Touch Targets
- **Minimum Touch Target Size:** `44px × 44px` for all interactive elements on mobile
- **Button Spacing:** Minimum `8px` gap between adjacent buttons to prevent mis-taps
- **Link Hit Area:** Extend invisible hit area to 44px using padding or margin on mobile devices
- **Form Input Height:** Minimum `44px` tall on mobile, `40px` on desktop
- **Icon Buttons:** Square `44px × 44px` minimum on mobile, `40px × 40px` on desktop

### Collapsing Strategy
- **Navigation:** Hamburger menu at 640px breakpoint; full horizontal nav above
- **Cards:** 2 columns on tablet, 1 column on mobile; auto-fit grid pattern
- **Sidebars:** Stack below main content on tablet; move to left side on desktop
- **Forms:** Full-width inputs on mobile; side-by-side on desktop where space allows
- **Typography:** Reduce heading sizes by 1 step (e.g., 32px → 24px) on tablet; 1–2 steps on mobile
- **Margins:** Scale from 32px (desktop) → 24px (tablet) → 16px (mobile)
- **Modals:** Full-screen on mobile with safe area inset; centered max-width on desktop

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA:** Sky Blue (`#006AFF`)
- **Secondary Action:** Slate Blue (`#667B99`)
- **Tertiary Accent:** Pink (`#EC4899`)
- **Primary Text:** Black (`#000000`)
- **Secondary Text:** Slate Blue (`#667B99`)
- **Tertiary Text:** Light Slate (`#8798B0`)
- **Background:** White (`#FFFFFF`)
- **Surface Secondary:** Off-White (`#F9FAFB`)
- **Border:** Light Gray (`#DCE2EA`)
- **Hover/Focus:** Darker Slate (`#405168`)

### Iteration Guide

1. **Always use `#006AFF` for primary buttons and critical interactive elements.** This is the brand's core accent and should dominate the interactive layer.

2. **Apply consistent 4px-based spacing:** Padding, margins, and gaps should always be multiples of 4px (`4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px`).

3. **Border radius follows the scale: 0px (none), 4px (subtle), 8px (standard), 12px (generous), 999px (pill/full).** Do not use arbitrary radius values.

4. **Typography uses only InterVariable at two weights:** 400 for regular text, 600–700 for emphasis. No other font families or weight values.

5. **Font sizes follow the hierarchy table exactly:** 48px (display), 32px (H1), 24px (H2), 20px (H3), 16px (body large), 15px (body regular), 14px (body small), 12px (caption).

6. **All interactive elements require hover, active, and (if applicable) focus states.** Use consistent transitions (200ms–300ms ease-in-out).

7. **Shadows are minimal and color-aware:** Level 1 for subtle cards (`0 1px 3px rgba(0, 0, 0, 0.08)`), Level 2 for elevated items (`0 4px 12px rgba(0, 0, 0, 0.12)`), blue-tinted for interactive focus states.

8. **Neutral palette dominates:** Use black, grays, and whites as the foundation. Blue (`#006AFF`), slate (`#667B99`, `#405168`), and pink (`#EC4899`) are accents, not background colors.

9. **Whitespace is intentional:** Generous spacing between sections (32px–64px), medium spacing within components (16px–24px), and tight spacing for related elements (8px).

10. **Mobile-first responsive strategy:** Start with 320px constraints, then expand. Use `44px × 44px` touch targets on mobile, collapsing layouts at 640px (tablet) and expanding at 1024px (desktop). Test all breakpoints thoroughly.