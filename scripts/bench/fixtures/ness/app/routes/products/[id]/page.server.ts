import { data } from 'react-router';
import { getProduct } from '../../../catalog.ts';

export async function loader({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) throw data(null, { status: 404 });
  return product;
}
