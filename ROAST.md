# Jarvis Dashboard UX Roast (v2)

## Critical (P0)
- **No persistent navigation spine (desktop).** Navigation lived in the header, causing cognitive load and lost orientation when scanning dense data.  
  **Fix:** Add a left sidebar spine with grouped nav, icons, and active states.
- **Missing design tokens for surface/semantic colors.** Tailwind references `--surface*` and `--success/warning/danger` were undefined, leading to inconsistent rendering.  
  **Fix:** Define full token set in `app/globals.css` for light/dark.

## High (P1)
- **Non-optimistic flows for core actions.** Create/update actions blocked on server response; failure states didn’t roll back or explain.  
  **Fix:** Add optimistic UI + rollback + toasts for tasks, scripts, preferences, experiments.
- **Spinner loading on the board.** Feels slow and vague; content density demands skeletons.  
  **Fix:** Replace spinners with skeletons at the exact content positions.
- **“Manage tags” button had no effect.** A dead control breaks trust.  
  **Fix:** Add a functional Tag Manager modal with CRUD.

## Medium (P2)
- **Micro-labels too small (10px).** Poor legibility in dense areas.  
  **Fix:** Raise key micro-labels to 11–12px and tighten spacing instead.
- **Inconsistent glass layering.** Some panels used `bg-surface` while others used raw gradients.  
  **Fix:** Standardize on 4-layer model with consistent blur, borders, and colored shadows.
- **No consistent empty states.** “Nothing here” placeholders undercut product quality.  
  **Fix:** Unified EmptyState component with CTA per view.

## Low (P3)
- **Inconsistent feedback patterns.** Some actions were silent, others were harsh error banners.  
  **Fix:** Toasts for success/failure + banner reserved for system load errors.

## Resolution Summary
- Sidebar spine added and header simplified.
- Full token map + OKLCH chart palette added.
- Optimistic UI with rollback and toasts across core actions.
- Skeletons and empty states implemented for dense views.
- Tag Manager modal now functional.
