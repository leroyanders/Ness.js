import analyzer from '@nessframework/analyzer';
import compression from '@nessframework/compression';
import env from '@nessframework/env';
import { ness } from '@nessframework/router/vite';
import nest from '@nessframework/nest';
import { nestServer } from '@nessframework/nest/server';
import security from '@nessframework/security';
import { tailwind } from '@nessframework/tailwind';

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
