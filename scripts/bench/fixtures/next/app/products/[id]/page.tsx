import { notFound } from 'next/navigation';
import { getProduct } from '../../../catalog.ts';

export const dynamic = 'force-dynamic';

export default async function Product({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <main>
      <h1>{product.name}</h1>
      <p>{product.price}</p>
      <p>{product.description}</p>
    </main>
  );
}
