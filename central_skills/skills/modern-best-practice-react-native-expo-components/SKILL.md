---
name: modern-best-practice-react-native-expo-components
description: Build clean, modern React Native Expo components that apply common best practices and avoid common pitfalls like unnecessary state management or useEffect usage
---

# Writing React Native Expo Components

We're using modern React (19+) with React Native and Expo SDK (latest stable), following
common best practices focused on clarity, correctness, and maintainability.

## Component Structure & Style

- **PREFER** small, focused components with a single responsibility
- **PREFER** named `function` components over arrow functions
  - Exception: anonymous callbacks, inline render props, and closures
- **PREFER** explicit return types and props typing (TypeScript) where applicable
- Keep components flat and readable; avoid deeply nested JSX
- Group related logic together (event handlers, derived values, helpers)
- Use `View`, `Text`, `Pressable`, `ScrollView`, `FlatList` etc. — **never** raw HTML elements

## Styling

- **PREFER** `StyleSheet.create()` over inline style objects — it validates styles at development time and avoids per-render object allocation
- **AVOID** deeply nested style objects; keep styles co-located with the component they belong to
- For dynamic or conditional styles, compose arrays: `style={[styles.base, isActive && styles.active]}`
- If using a styling library (e.g. NativeWind, Tamagui, Unistyles), follow its conventions consistently — do not mix paradigms

## Navigation

- Use **Expo Router** (file-based routing) for navigation — do not use React Navigation's imperative API directly unless wrapping Expo Router
- **PREFER** typed routes via `expo-router`'s `href` types; avoid raw string paths
- Use `Link` for declarative navigation, `router.push` / `router.replace` for imperative navigation in handlers
- **AVOID** storing navigation state in component state; derive it from the URL / route params

## State Management

- **AVOID** `useEffect()` for derived state or data fetching
  - See the ["You Might Not Need An Effect" guide](references/you-dont-need-useeffect.md)
  - **PREFER** deriving values during render instead of synchronizing state
  - Fetch data via TanStack Query (`@tanstack/react-query`)
- **AVOID** unnecessary `useState()` or `useReducer()` usage
  - Derive state from props or other state when possible
  - Localize state to the lowest possible component
- **DO NOT** mirror props in state unless absolutely necessary
- Prefer controlled components over syncing uncontrolled state

## Platform-Specific Code

- **PREFER** `Platform.select()` or `Platform.OS` checks over separate files for small differences
- Use `.ios.tsx` / `.android.tsx` / `.native.tsx` / `.web.tsx` file suffixes only for significant platform divergence
- **AVOID** leaking platform logic upward into parent components — keep it encapsulated

## Native APIs & Expo Modules

- Use **Expo SDK modules** (e.g. `expo-camera`, `expo-location`, `expo-notifications`) over bare React Native equivalents — they handle permissions, lifecycle, and cross-platform consistency
- Always request permissions before accessing native APIs; handle the denied case explicitly
- Wrap native API calls in try/catch — native failures are runtime errors, not compile-time ones
- **AVOID** calling native APIs during render; always call them inside handlers or effects with proper cleanup

## Effects, Data, and Side Effects

- **AVOID** effects for:
  - Derived state
  - Data transformations
  - Event-based logic that can live in handlers
- Effects that subscribe to native events (e.g. keyboard, app state, sensors) **must** return a cleanup function
- Prefer Expo SDK hooks (e.g. `useAppState`, `useAnimatedKeyboard`) over raw `AppState.addEventListener`
- If side effects are unavoidable, keep them minimal, isolated, and well-documented

## Lists & Scrolling

- **PREFER** `FlatList` or `FlashList` (`@shopify/flash-list`) over `ScrollView` for long or dynamic lists
- Always provide a stable, unique `keyExtractor`
- Use `getItemLayout` when item heights are fixed — it significantly improves scroll performance
- **AVOID** nesting `FlatList` inside `ScrollView` on the same axis

## Rendering & Derivation

- **PREFER** computing derived values inline or via helper functions
- Use `useMemo()` sparingly and only for proven performance issues
- **AVOID** premature optimization
- Keep render logic deterministic and free of side effects

## Event Handling

- **AVOID** in-line event handlers in JSX
  - **PREFER**:

```tsx
function handlePress() {
  // ...
}

<Pressable onPress={handlePress} />;
```

- Over:

```tsx
<Pressable
  onPress={() => {
    /* ... */
  }}
/>
```

- Name handlers clearly (`handlePress`, `handleSubmit`, `handleChange`)
- Keep handlers small; extract complex logic into helpers
- **PREFER** `Pressable` over `TouchableOpacity` or `TouchableHighlight` — it gives finer control over press states and is the modern standard

## Animations

- **PREFER** `react-native-reanimated` for smooth, JS-thread-free animations
- **AVOID** `Animated` (legacy API) for new code
- Use `react-native-gesture-handler` for gesture-driven interactions; do not rely on `PanResponder`
- Keep animation logic out of render; define `useAnimatedStyle` and `useSharedValue` at the top of the component

## Props & Composition

- **PREFER** composition over configuration
- **AVOID** excessive boolean props; prefer expressive APIs
- Use `children` intentionally and document expected structure
- Keep prop names semantic and predictable

## Performance & Stability

- **PREFER** stable references only when required (not by default)
- **AVOID** unnecessary memoization (`memo`, `useCallback`) unless absolutely required
- Keep keys stable and meaningful when rendering lists
- Enable the **New Architecture** (Fabric + JSI) — do not introduce libraries that are incompatible with it

## General Principles

- Write code for humans first, compilers second
- Prefer explicitness over cleverness
- Optimize for readability and long-term maintenance
- If a pattern feels complex, reconsider the component boundary
