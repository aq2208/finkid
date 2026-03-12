# Native Mobile Feel — Design Spec
**Date:** 2026-03-12
**Approach:** CSS polish + framer-motion transitions (Approach 2)
**Reference:** Duolingo — bubbly, gamified, spring animations

---

## Goal

Make Finkid feel like a native iOS app rather than a website inside a browser. Target all five pain points: page transitions, scroll/touch feel, layout proportions, input behavior, and micro-interactions.

---

## Section 1 — Touch & Scroll Feel

**File:** `finkid-fe/src/styles/index.css`

- `touch-action: manipulation` on all buttons, links, nav items — eliminates 300ms tap delay
- `-webkit-tap-highlight-color: transparent` globally — removes blue/grey tap flash
- `user-select: none` on all UI chrome (buttons, nav items, cards, labels) — prevents accidental text selection
- `-webkit-overflow-scrolling: touch` on `.page` and `.tabs` — enables momentum/rubber-band scrolling
- `overscroll-behavior: none` on `body` — prevents outer-page bounce revealing the dark desktop background
- All `:hover` states moved inside `@media (hover: hover)` — hover effects only fire on pointer devices, not touch
- Button active press: when adding `whileTap={{ scale: 0.94 }}` in Section 4, also remove the `transform: translateY(3px)` lines from `.btn:active`, `.btn-primary:active`, `.btn-secondary:active`, `.btn-warning:active`, `.btn-danger:active`, and `.fab:active` in CSS. Keep the box-shadow change on `:active` — the shadow collapse is still correct; only the transform moves to framer-motion.

---

## Section 2 — Input Behavior

**Files:** Login, Register, Tasks, Dreams, Profile, FamilySetup, ChooseRole (for hover fix)

- All `<input>` and `<textarea>` elements: minimum `font-size: 16px` via CSS — prevents iOS auto-zoom on focus
- Points inputs: add `inputMode="numeric"` — shows number pad
- Email inputs: add `inputMode="email"`, `autoCorrect="off"`, `autoCapitalize="none"` — proper keyboard, no autocorrect
- Family code input: add `autoComplete="off"` — suppresses suggestion bar
- Task title / display name inputs: add `autoCorrect="off"` — stops autocorrect fighting user
- Auth sheet (Login, Register): add `padding-bottom: env(safe-area-inset-bottom, 0px)` to `.auth-sheet` CSS — keeps "Let's Go!" button above keyboard on short phones

---

## Section 3 — Page Transitions

**Files:** `finkid-fe/src/App.jsx`, new `finkid-fe/src/components/PageTransition.jsx`

**Note:** `framer-motion` is already installed at `^11.15.0` — no install step needed.

### Tab order (determines slide direction)
```
0: Home (/)
1: Dreams (/dreams)
2: Tasks (/tasks)
3: Profile (/profile)
```

### Behavior
- Tab to the **right** → new screen slides in from right (`x: 30 → 0`), old exits left (`x: 0 → -30`)
- Tab to the **left** → new screen slides in from left (`x: -30 → 0`), old exits right (`x: 0 → 30`)
- Same tab tapped → no animation
- Auth pages (login ↔ register) → fade only (`opacity: 0 → 1`), no directional slide
- Duration: `0.25s`, easing: `easeOut` — fast and snappy

### Implementation shape

`AnimatePresence` is placed **only inside the fully-authenticated route branch** (the final `return` in `AppRoutes`), not wrapping the entire `AppRoutes` output. The onboarding branches (no-role, no-family) use a simple fade only, so they don't conflict with `location.pathname` key collisions when transitioning from gated → main nav.

```jsx
// PageTransition.jsx
// Accepts `direction` prop (-1 | 0 | 1) computed from tab index delta
// direction  1 → slide from right
// direction -1 → slide from left
// direction  0 → fade only (auth pages, same tab)

// App.jsx — authenticated branch only:
<AnimatePresence mode="popLayout">
  <PageTransition key={location.pathname} direction={direction}>
    <Routes location={location}>...</Routes>
  </PageTransition>
</AnimatePresence>
```

`useLocation()` provides the key. A small ref tracks previous pathname to compute tab index delta → direction.

---

## Section 4 — Spring Animations & Micro-interactions

**Files:** `finkid-fe/src/styles/index.css`, all page/component files using cards, buttons, modals

### Buttons
- Add `whileTap={{ scale: 0.94 }}` to all `.btn` elements (wrap with `motion.button`)
- Remove `transform` from `.btn:active` CSS variants (per Section 1 note) — keep box-shadow changes

### Cards
- Task cards, dream cards, role cards: `whileTap={{ scale: 0.97 }}` — subtle squish on touch

### Bottom Nav
- **DOM restructure required:** Remove `background` from `.nav-item.active` CSS. Instead render a single `motion.div layoutId="nav-pill"` that moves between the active tab's position. This is a shared-layout animation — the pill lives in the nav container and is absolutely positioned behind the active item.
- Active tab icon: wrap with `motion.div` + `animate={{ scale: isActive ? 1.2 : 1 }}` with spring transition

### Modals
- Replace CSS `sheetSlideUp` keyframe with framer-motion spring on `.modal-content`:
  `initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}` with `type: "spring", stiffness: 400, damping: 40`
- Remove `@keyframes sheetSlideUp` and `animation: sheetSlideUp` from CSS

### FAB
- `whileHover={{ scale: 1.08 }}` + `whileTap={{ scale: 0.92 }}`

### Progress Bars
- Wrap the fill `<div>` in `motion.div` + `animate={{ width: "X%" }}` + spring transition
- The `::after` shine sweep animation lives on an inner `<span>` child element (not on the `motion.div` itself, since `motion.div` cannot animate pseudo-elements). Keep the CSS `@keyframes shineSweep` on the inner span.

### Empty State Emoji
- Replace CSS `floatA` animation with framer-motion `animate={{ y: [0, -8, 0] }}` + `transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}`
- Remove the `animation: floatA ...` declaration from `.empty-emoji` in CSS when switching to framer-motion — same cleanup pattern as the modal `sheetSlideUp` removal. Check whether `@keyframes floatA` is used anywhere else before deleting it.

---

## Section 5 — Hero & Layout Proportions

**File:** `finkid-fe/src/styles/index.css`

| Element | Current | New |
|---------|---------|-----|
| `.page-hero` padding | `56px top / 40px bottom` | `32px top / 28px bottom` (after safe-area) |
| `.page-hero::after` wave depth | `24px` | `14px` |
| `.bottom-nav` min-height | ~60px | ~52px |
| `.page-content` padding-top | `16px` | `12px` |
| `.auth-sheet` padding-top | `28px` | `20px` |
| `.section-title` margin-bottom | `16px` | `12px` |

---

## Files to Change

| File | Change |
|------|--------|
| `finkid-fe/src/styles/index.css` | Touch/scroll/hover fixes, hero size reductions, layout tightening, btn:active transform removal, input font-size |
| `finkid-fe/src/App.jsx` | Add `AnimatePresence` inside authenticated branch, pass `location` + `direction` |
| `finkid-fe/src/components/PageTransition.jsx` | **New** — reusable slide/fade transition wrapper |
| `finkid-fe/src/components/BottomNav.jsx` | DOM restructure for layout-animated pill, spring icon scale |
| `finkid-fe/src/pages/Login.jsx` | Input attrs, auth-sheet keyboard padding |
| `finkid-fe/src/pages/Register.jsx` | Input attrs, auth-sheet keyboard padding |
| `finkid-fe/src/pages/Tasks.jsx` | Card whileTap, modal spring, input attrs |
| `finkid-fe/src/pages/Dreams.jsx` | Card whileTap, modal spring, progress bar motion |
| `finkid-fe/src/pages/Profile.jsx` | Modal spring, card whileTap |
| `finkid-fe/src/pages/FamilySetup.jsx` | Input attrs (autocomplete, autocorrect) |
| `finkid-fe/src/pages/ChooseRole.jsx` | Move `.role-card:hover` inside `@media (hover: hover)` |
| `finkid-fe/src/pages/ParentHome.jsx` | Card whileTap, empty state float |
| `finkid-fe/src/pages/ChildHome.jsx` | Progress bar motion, card whileTap, empty state |

---

## Out of Scope

- Pull-to-refresh
- Swipe-back gesture navigation
- Haptic feedback (not available in web)
- Replacing heroes with slim top bars (deferred by user)
