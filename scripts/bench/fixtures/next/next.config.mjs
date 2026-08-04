/** @type {import('next').NextConfig} */
export default {
  // The Ness side is measured as a self-hosted Node server, so measure Next the
  // same way rather than against a Vercel deployment.
  output: 'standalone',
  poweredByHeader: false,
};
