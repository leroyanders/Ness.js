import Link from 'next/link';
import { listProducts } from '../catalog.mjs';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await listProducts();

  return (
    <main>
      <h1>Catalogue</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            <Link href={`/products/${product.id}`}>{product.name}</Link>
            <span>{product.price}</span>
            <p>{product.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
