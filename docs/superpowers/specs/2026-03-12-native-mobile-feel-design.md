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
- Button active press: replace `translateY(3px)` with framer-motion `whileTap={{ scale: 0.94 }}` — feels like pressing a physical button

---

## Section 2 — Input Behavior

**Files:** all page components that contain `<input>` elements (Login, Register, Tasks, Dreams, Profile, FamilySetup)

- All `<input>` and `<textarea>` elements: `style={{ fontSize: '16px' }}` (or via CSS) — prevents iOS auto-zoom on focus
- Points inputs: add `inputMode="numeric"` — shows number pad
- Email inputs: add `inputMode="email"`, `autoCorrect="off"`, `autoCapitalize="none"` — proper keyboard, no autocorrect
- Family code input: add `autoComplete="off"` — suppresses suggestion bar
- Task title / display name inputs: add `autoCorrect="off"` — stops autocorrect fighting user
- Auth sheet (Login, Register): add `paddingBottom: env(safe-area-inset-bottom)` to `.auth-sheet` — keeps "Let's Go!" button above keyboard on short phones

---

## Section 3 — Page Transitions

**Files:** `finkid-fe/src/App.jsx`, all page components, new `finkid-fe/src/components/PageTransition.jsx`

**Install:** `framer-motion`

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
```jsx
// App.jsx — wrap AppRoutes output
<AnimatePresence mode="popLayout">
  <motion.div key={location.pathname} ...variants>
    {routes}
  </motion.div>
</AnimatePresence>

// PageTransition.jsx — reusable wrapper
// Reads current + previous route to determine x direction
```

---

## Section 4 — Spring Animations & Micro-interactions

**Files:** `finkid-fe/src/styles/index.css`, all page/component files using cards, buttons, modals

### Buttons
- Replace CSS active state with `whileTap={{ scale: 0.94 }}` on all `.btn` elements
- Wrap with `motion.button` or add framer-motion to existing button elements

### Cards
- Task cards, dream cards, role cards: `whileTap={{ scale: 0.97 }}` — subtle squish on touch

### Bottom Nav
- Active tab icon: `scale(1.2)` spring bounce on selection
- Active background pill: `layout` animation so it slides between tabs (Duolingo-style)

### Modals
- Replace CSS `sheetSlideUp` keyframe with framer-motion spring:
  `type: "spring", stiffness: 400, damping: 40`
- Feels weighted and physical instead of mechanical

### FAB
- `whileHover={{ scale: 1.08 }}` + `whileTap={{ scale: 0.92 }}`

### Progress Bars
- Animate width with `motion.div` + `animate={{ width: "X%" }}` + spring easing
- Smoother and interruptible vs CSS transition

### Empty State Emoji
- Replace CSS float animation with `animate={{ y: [0, -8, 0] }}` + `repeat: Infinity` + spring

---

## Section 5 — Hero & Layout Proportions

**File:** `finkid-fe/src/styles/index.css`

| Element | Current | New |
|---------|---------|-----|
| `.page-hero` padding | `56px top / 40px bottom` | `32px top / 28px bottom` (after safe-area) |
| `.page-hero::after` wave depth | `24px` | `14px` |
| `.bottom-nav` height | ~60px | ~52px |
| `.page-content` top padding | `16px` | `12px` |
| `.auth-sheet` top padding | `28px` | `20px` |
| Section title `margin-bottom` | `16px` | `12px` |

---

## Files to Change

| File | Change |
|------|--------|
| `finkid-fe/src/styles/index.css` | Touch/scroll/hover fixes, hero size reductions, layout tightening |
| `finkid-fe/src/App.jsx` | Add `AnimatePresence`, pass location to routes |
| `finkid-fe/src/components/PageTransition.jsx` | New — reusable slide/fade transition wrapper |
| `finkid-fe/src/components/BottomNav.jsx` | Animated active pill, spring icon scale |
| `finkid-fe/src/pages/Login.jsx` | Input attrs, auth-sheet keyboard padding |
| `finkid-fe/src/pages/Register.jsx` | Input attrs, auth-sheet keyboard padding |
| `finkid-fe/src/pages/Tasks.jsx` | Card whileTap, modal spring, input attrs |
| `finkid-fe/src/pages/Dreams.jsx` | Card whileTap, modal spring, progress bar motion |
| `finkid-fe/src/pages/Profile.jsx` | Modal spring, card whileTap |
| `finkid-fe/src/pages/ParentHome.jsx` | Card whileTap, empty state float |
| `finkid-fe/src/pages/ChildHome.jsx` | Progress bar motion, card whileTap, empty state |
| `package.json` | Add `framer-motion` |

---

## Out of Scope

- Pull-to-refresh
- Swipe-back gesture navigation
- Haptic feedback (not available in web)
- Replacing heroes with slim top bars (deferred by user)
