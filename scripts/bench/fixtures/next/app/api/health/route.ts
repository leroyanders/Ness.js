export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ healthy: true, framework: 'next' });
}
