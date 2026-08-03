import analyzer from '@ness/analyzer';
import compression from '@ness/compression';
import env from '@ness/env';
import { ness } from '@ness/router/vite';
import nest from '@ness/nest';
import { nestServer } from '@ness/nest/server';
import security from '@ness/security';
import { tailwind } from '@ness/tailwind';

ness({
  plugins: [
    nest(),
    analyzer({ maxSize: 1_000_000 }),
    compression({ algorithms: ['gzip', 'brotli'] }),
    env({ schema: { DATABASE_URL: { required: true } } }),
    security({ headers: { 'X-Frame-Options': 'SAMEORIGIN' } }),
    tailwind({ minify: true }),
  ],
});

nestServer({ prefix: 'api' });
