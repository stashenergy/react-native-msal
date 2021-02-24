---
name: Configuration help
about: Help getting your project configured with this module
title: "[config] "
labels: ''
assignees: josmithua

---

**Before you create an issue:**

Have you:
- [ ] Upgraded to the latest version of `react-native-msal`
- [ ] Read the README thoroughly
- [ ] Searched for other similar issues
- [ ] Used breakpoint debugging in the Swift/Java module code?
- [ ] Tried to reproduce the problem in the example app in this repository?

**Problem description:**
A clear and concise description of what the problem is.

**Contents of `msal_config.json`:**
```json
{}
```

**Relevant contents of `AndroidManifest.xml`:**
```xml
<activity android:name="com.microsoft.identity.client.BrowserTabActivity">
  ...
</activity
```
**Usage JavaScript/TypeScript code:**
```tsx
const res = await pca.acquireToken(...)
```

**Relevant error messages and screenshots:**
Please provide error messages and screenshots here
