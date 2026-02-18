# Design System — Jarvis Dashboard

> Design philosophy, visual principles, component patterns, and decision rationale.
> This document exists so every decision has a reason — not just "it looks nice."

---

## Core Philosophy

### Intentional over Impressive

Every element earns its place. If something doesn't help the user make a decision or understand the state of the system, it doesn't exist. No decorative charts. No vanity metrics. No "cool" animations that delay information.

### Visual-First, Text-Last

The user is a visual thinker — a video editor who reads systems through structure, color, and hierarchy rather than prose. Information is presented visually first:
- **Status** → colored dots, not "status: active" text
- **Progress** → rings and bars, not "4 of 10 tasks done"
- **Priority** → colored badges, not text labels
- **Health** → traffic light chips, not log lines

### Layer-Based Information

Information is organized in depth layers. You see the overview first; you drill down only when you want detail. Never force someone to read a sub-screen to understand the top level.

```
Layer 1 (always visible):   4 project spaces, status dots, progress %
Layer 2 (click to open):    Missions per project, active/blocked/done
Layer 3 (click to expand):  Individual mission detail, subagent log
```

### Human in the Loop — by Design

The biggest risk with autonomous AI is it going in the wrong direction without you noticing. The dashboard is built around this:
- Jarvis **proposes** — you **approve** before execution starts
- The "Needs You" queue is always visible — decisions never silently pile up
- Every run is visible in the activity feed — no black box execution
- Night Shift Report tells you what happened while you were gone

### Boring is Bad, Busy is Worse

The aesthetic goal: feels premium without being noisy. Glass surfaces, subtle depth, clean typography. Not "enterprise SaaS gray" and not "startup rainbow gradients."

---

## Visual System

### Color Palette

```
Dark mode (primary use):
  Background:     #070a12 (deep space)
  Background alt: #0b1020
  Mesh blobs:     #0f1528 (indigo) · #1a0f3f (violet) · #0a2b28 (emerald)

  Glass surfaces:
    Panel:        rgba(18, 24, 38, 0.70) + backdrop-blur-2xl
    Panel hover:  rgba(30, 30, 40, 0.80)
    Panel strong: rgba(16, 22, 36, 0.90)

  Text:           #eef3ff (primary) · #98a4c8 (muted)
  Border:         rgba(255, 255, 255, 0.08)

  Accent (primary): #61f4ff (electric cyan)
  Success:          #43ffb6 (neon green)
  Warning:          #fbbf24 (amber)
  Danger:           #fb7185 (rose)
```

**The 4 project space colors:**
```
Personal:       violet  (#8b5cf6)
Luminos:        sky     (#0ea5e9)
Side Projects:  emerald (#10b981)
OpenClaw:       amber   (#f59e0b)
```

These colors are fixed and semantic — violet always means Personal, sky always means Luminos. Consistency builds recognition.

### Typography

```
Display/Headings:   Space Grotesk — bold, technical, clear
Body:               Noto Sans — readable, neutral
Monospace:          System mono — logs, code, IDs

Scale:
  3xl  (30px):  Page titles, KPI numbers
  2xl  (24px):  Section headings, status labels
  xl   (20px):  Card headings, space names
  lg   (18px):  Subheadings
  base (14px):  Body text, descriptions
  sm   (12px):  Metadata, timestamps
  xs   (10px):  Micro-labels (uppercase + tracking only)

  ⚠️  Never use 9px or below — unreadable, looks unfinished
```

**Micro-labels** (section headers like "NEEDS YOU", "ACTIVE NOW"):
```css
text-[10px] font-bold uppercase tracking-[0.2em] text-muted
```
This is used so consistently it should be a reusable class: `.label-xs`.

### Spacing & Radius

```
Card padding:         p-5 (20px) — primary cards
Compact item padding: p-3 (12px) — list items, chips
Dense padding:        p-2.5 (10px) — badges, tight components

Card radius:     rounded-2xl (24px) — main panels, cards
Element radius:  rounded-xl  (18px) — inner containers, inputs
Badge radius:    rounded-lg  (12px) — status badges, chips
Dot radius:      rounded-full       — status dots, avatars

Section gap:     gap-6 (24px) between major sections
Card gap:        gap-4 (16px) between related cards
Item gap:        gap-1.5 or gap-2 within lists
```

### Glass Effect

```css
/* Standard glass panel */
.glass-panel {
  backdrop-filter: blur(24px);
  background: linear-gradient(135deg, rgba(30,30,35,0.6), rgba(20,20,25,0.4));
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
}
```

Rules for glass:
- Always pair with `backdrop-blur-2xl` (or `backdrop-blur-xl` for secondary elements)
- Never put glass on glass — surfaces need a solid backdrop to blur against
- The liquid background mesh (animated blobs) provides the thing-to-blur-against
- On mobile, reduce blur to `backdrop-blur-md` for performance

---

## Layout System

### Main Layout (Desktop)

```
┌──────────────────────────────────────────────────────────┐
│  72px Icon Rail  │  Content (flex-1)  │  272px Control   │
│  (Sidebar)       │                    │  (ControlPanel)  │
│                  │                    │  xl+ only        │
└──────────────────────────────────────────────────────────┘
  Always visible    Scrollable area      Sticky overview
```

**Why 72px sidebar:** Icon-only nav saves ~168px vs the old 240px text sidebar. More room for content. Icons are semantic enough — no text needed if icons are well-chosen. Tooltips appear on hover for disambiguation.

**Why right ControlPanel:** The user needs to see Jarvis's status, the decision queue, and today's metrics *at all times* — not just on the Home view. The right panel provides this persistent visibility without interrupting the main content area.

### Responsive Behavior

```
< 768px  (mobile):   Bottom nav bar (5 primary views), no control panel
768-1024px (tablet): Icon sidebar, no control panel (screen too narrow)
1024-1280px (lg):    Icon sidebar + main content (control panel hidden)
1280px+ (xl):        Full 3-column layout
```

### The 3-Column Philosophy

- **Left (72px):** Navigation — where am I?
- **Center (flex-1):** Content — what am I looking at?
- **Right (272px):** Context — what does Jarvis need from me right now?

The right column is never content. It's always context about the current state of the system.

---

## Component Patterns

### Status Indicators

Always use the same visual language for status:

```
●  green + pulse:  Active / Running / Online
●  amber:          Idle / Waiting / Warning
●  red:            Error / Failed / Blocked
●  gray:           Offline / Stopped / Unknown
```

Status is always shown as: dot + label. Never just a color alone (accessibility), never just text alone (scan-speed).

### Priority Badges

```
P0  →  bg-danger/15  text-danger    (critical, red)
P1  →  bg-warning/15 text-warning   (high, amber)
P2  →  bg-border     text-muted     (medium, neutral)
P3  →  bg-border     text-muted/60  (low, dim)
```

These are defined in `components/ui/Badges.tsx`. Never define priority colors inline.

### Progress Rings (SVG)

Used in ProjectsView for space completion. Rules:
- Track color: `rgba(255,255,255,0.07)` — subtle but visible
- Fill: the space's assigned color (violet/sky/emerald/amber)
- Stroke width: 5px
- Transition: `stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)` — smooth load-in
- Always show the % number in the center

### Cards

All cards follow this structure:
```tsx
<div className="rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur-md shadow-sm">
  {/* Optional: section micro-label */}
  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Section</p>

  {/* Content */}

  {/* Optional: footer action */}
</div>
```

Cards that are clickable add:
```tsx
className="... transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
```

Cards that are NOT clickable must not have hover effects that imply interactivity.

### Empty States

Every list or data section needs an empty state. It should:
1. Tell you there's nothing here (don't leave it literally blank)
2. Tell you WHY (no tasks yet, nothing waiting, etc.)
3. Optionally tell you how to add something

```tsx
<div className="rounded-xl border border-dashed border-border py-8 text-center">
  <p className="text-sm font-semibold text-text">Queue clear</p>
  <p className="mt-1 text-xs text-muted">Nothing is waiting on you</p>
</div>
```

### Tooltips (CSS-only)

Used on sidebar icons. The tooltip is a sibling element that becomes visible on `group-hover`:

```tsx
<button className="group relative ...">
  <Icon />
  <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2
                   z-[200] -translate-y-1/2 translate-x-1 opacity-0
                   transition-all duration-100
                   group-hover:translate-x-0 group-hover:opacity-100
                   whitespace-nowrap rounded-lg border border-border
                   bg-surface-strong px-2.5 py-1.5 text-[11px] font-semibold
                   text-text shadow-xl">
    Label
  </span>
</button>
```

The `translate-x-1 → translate-x-0` creates a subtle slide-in on hover.

---

## Animation Principles

Animations serve function, not aesthetics:
- **Fade + slide up** (`animate-fade-in`): View transitions, content appearing
- **Pulse slow**: Active agent status, live indicators
- **Shimmer**: Loading states
- **Progress bar transition**: `transition-all duration-700` — long enough to feel smooth, short enough to feel responsive

**Always** add `@media (prefers-reduced-motion)` exemptions. Users who need it get instant transitions.

Never animate:
- Navigation (too slow, disrupts flow)
- Text content (hard to read while moving)
- Things the user didn't initiate (background pulse OK, sudden movement not)

---

## What Not To Do

| ❌ Don't | ✅ Do instead |
|---------|-------------|
| Show raw JSON or log output | Format into readable summary |
| Display a list of 40 items | Show top 3-5, "show more" button |
| Use 3 different card styles in one view | Pick one card pattern per view |
| Auto-refresh everything on a timer | Refresh on user action or on specific triggers |
| Add a feature "just in case" | Only add what's needed right now |
| Define priority colors inline per component | Use shared `PriorityBadge` component |
| Dynamic Tailwind classes (`bg-${color}-500`) | Use a lookup object with predefined classes |
| Show "Idle" when you mean "Paused" | Use precise vocabulary |
| Build for hypothetical future requirements | Build for current workflow |
