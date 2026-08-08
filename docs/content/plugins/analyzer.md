---
sidebar_position: 7
---

# @nessframework/analyzer

Generates machine-readable JSON and human-readable HTML bundle reports. A size budget can fail builds that grow beyond an expected limit.

```bash
ness add analyzer --dev
```

```js title="ness.config.mjs" showLineNumbers
import analyzer from '@nessframework/analyzer';
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';

export default defineNessConfig({
  vite: {
    plugins: [ness({ plugins: [analyzer({ maxSize: 750_000 })] })],
  },
});
```

Production builds emit `ness-bundle-report.json` and `ness-bundle-report.html`. Set `html: false` to emit only the JSON, and `reportFile` or `htmlFile` to name them something else.

`maxSize` is compared against the total size of one build output. A Ness build runs Vite more than once — for the client and for the server — and each run writes its own report and is checked against the budget separately.
