---
title: Embed Fonts Through Native Projects
impact: LOW
impactDescription: fonts available at launch without asynchronous loading
tags: fonts, ios, android, native-build
---

## Embed Fonts Through Native Projects

Add custom fonts to the iOS and Android projects, register them with the React Native asset configuration, then rebuild the native app. This makes fonts available at launch without an application-level loading gate.

```tsx
import { Text, View } from 'react-native'

export function App() {
  return <View><Text style={{ fontFamily: 'Geist-Bold' }}>Hello</Text></View>
}
```

Verify the font family name on both platforms and include a system-font fallback where required.
