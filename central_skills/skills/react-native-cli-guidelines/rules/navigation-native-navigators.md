---
title: Use Native Navigators for Navigation
impact: HIGH
impactDescription: native performance and platform-appropriate behavior
tags: navigation, react-navigation, native-stack, tabs
---

## Use Native Navigators for Navigation

Use React Navigation's native stack for stack navigation. Use native tab integrations when native tab behavior is important; avoid JavaScript-only stacks for routine application navigation.

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

export function AppNavigator() {
  return <Stack.Navigator><Stack.Screen name="Home" component={HomeScreen} /></Stack.Navigator>
}
```

Prefer native header options over custom header components when they meet the product need. They preserve platform transitions, safe areas, accessibility, large titles, and search behavior.

Reference: [React Navigation native stack](https://reactnavigation.org/docs/native-stack-navigator)
