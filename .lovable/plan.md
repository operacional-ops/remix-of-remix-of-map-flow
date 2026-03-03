

## Problem

The `/painel-drx` page loads an iframe with `public/painel-drx.html`. The component uses `h-full w-full` CSS classes, which depend on the parent chain having explicit height. On first load it works, but when React Router unmounts and remounts the component during navigation, the iframe loses its height context and renders with 0 height (appearing blank).

## Root Cause

The `PainelDRX` component's `div` uses `h-full` (height: 100%), but after navigation the parent `main` element's computed height may not propagate correctly to the re-mounted iframe. Additionally, the iframe itself has no explicit height — it relies entirely on the CSS chain.

## Plan

**Update `src/pages/PainelDRX.tsx`** to use a fixed viewport-based height instead of relying on `h-full` inheritance:

- Change the wrapper `div` from `h-full w-full` to use a calculated height that accounts for the bottom dock (e.g., `h-[calc(100vh-68px)] md:h-[calc(100vh-80px)] w-full`)
- Alternatively, use `absolute inset-0` or `min-h-screen` positioning
- Add a `key` prop to the iframe to force re-render on mount, preventing stale iframe state

This is a single-file change to `src/pages/PainelDRX.tsx`.

