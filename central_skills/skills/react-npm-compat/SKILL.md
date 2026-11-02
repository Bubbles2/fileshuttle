---
name: react-npm-compat
description: Check whether an npm package is compatible with this React project before installing.
---

When asked whether a package is valid for this React project:

1. Read package.json.
2. Detect the installed React major version from dependencies/devDependencies.
3. Run:

   npm view <package>@<version-or-latest> peerDependencies engines --json

4. Check whether peerDependencies.react and peerDependencies["react-dom"] satisfy the project React version.
5. If no React peer dependency exists, say compatibility is not declared and recommend checking docs/changelog.
6. Do not install the package unless the user explicitly asks.
7. Return: compatible / not compatible / unclear, with the peer dependency range.