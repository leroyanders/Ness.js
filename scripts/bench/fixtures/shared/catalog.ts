/**
 * The data source both applications render. Kept deliberately trivial and
 * synchronous-with-a-tick so the benchmark measures framework overhead rather
 * than a database.
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

const PRODUCTS: Product[] = Array.from({ length: 200 }, (_, index) => ({
  id: String(index + 1),
  name: `Product ${index + 1}`,
  price: 1000 + index * 7,
  description:
    'A representative catalogue entry with enough text to make the rendered payload realistic rather than trivially small.',
}));

export async function listProducts(limit = 24): Promise<Product[]> {
  await new Promise(resolve => setImmediate(resolve));
  return PRODUCTS.slice(0, limit);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  await new Promise(resolve => setImmediate(resolve));
  return PRODUCTS.find(product => product.id === id);
}

export { PRODUCTS };
