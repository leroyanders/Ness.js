import { useLoaderData } from 'react-router';

export default function Product() {
  const product = useLoaderData() as {
    id: string;
    name: string;
    price: number;
    description: string;
  };

  return (
    <main>
      <h1>{product.name}</h1>
      <p>{product.price}</p>
      <p>{product.description}</p>
    </main>
  );
}
