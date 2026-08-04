import { Link, useLoaderData } from 'react-router';

export default function Home() {
  const products = useLoaderData() as Array<{
    id: string;
    name: string;
    price: number;
    description: string;
  }>;

  return (
    <main>
      <h1>Catalogue</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            <Link to={`/products/${product.id}`}>{product.name}</Link>
            <span>{product.price}</span>
            <p>{product.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
