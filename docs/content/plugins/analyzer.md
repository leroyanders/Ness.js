---
sidebar_position: 7
---

# @ness/analyzer

Generates machine-readable JSON and human-readable HTML bundle reports. A size budget can fail builds that grow beyond an expected limit.

```bash
ness add analyzer --dev
```

```js title="ness.config.mjs" showLineNumbers
import analyzer from '@ness/analyzer';
import { defineNessConfig } from '@ness/router';
import { ness } from '@ness/router/vite';

export default defineNessConfig({
  vite: {
    plugins: [ness({ plugins: [analyzer({ maxSize: 750_000 })] })],
  },
});
```

Production builds emit `ness-bundle-report.json` and `ness-bundle-report.html`.
