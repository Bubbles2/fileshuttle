---
title: Use React Native Image Deliberately
impact: HIGH
impactDescription: predictable rendering and efficient image loading
tags: images, performance, ui, react-native
---

## Use React Native Image Deliberately

Use React Native's `Image` with appropriately sized remote assets. Keep loading states explicit and add a bare-compatible image library only when its caching or placeholder behavior is truly needed.

```tsx
import { Image } from 'react-native'

function Avatar({ url }: { url: string }) {
  return <Image source={{ uri: url }} resizeMode="cover" style={styles.avatar} />
}
```

Request thumbnails at about twice their rendered dimensions and avoid loading full-resolution images into scrolling lists.
