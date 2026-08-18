import { listProducts } from '../catalog.ts';

export async function loader() {
  return listProducts();
}
