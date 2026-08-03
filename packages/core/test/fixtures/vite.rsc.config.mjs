import { ness } from '../../src/vite/index.js';

export default {
  root: process.cwd(),
  plugins: [ness({ rsc: true })],
};
