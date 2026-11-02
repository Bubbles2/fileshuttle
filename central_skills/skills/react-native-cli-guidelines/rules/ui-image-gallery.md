---
title: Use a Native Image Gallery Library When Needed
impact: MEDIUM
impactDescription: reliable pinch-to-zoom and fullscreen behavior
tags: images, gallery, lightbox, ui, react-native
---

## Use a Native Image Gallery Library When Needed

For a full-screen gallery with pinch-to-zoom and swipe gestures, use a maintained library compatible with the project's native setup instead of rebuilding gesture, modal, and image lifecycle logic by hand.

```tsx
import { Image, Pressable } from 'react-native'

function Thumbnail({ url, onOpen }: { url: string; onOpen: () => void }) {
  return <Pressable onPress={onOpen}><Image source={{ uri: url }} style={styles.thumbnail} /></Pressable>
}
```

Ensure the gallery is accessible, dismissible, handles loading/errors, and loads high-resolution sources only for the opened image.
