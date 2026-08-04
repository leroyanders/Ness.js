export async function GET() {
  return Response.json({ healthy: true, framework: 'ness' });
}
