import { listProducts } from '../catalog.mjs';

export async function loader() {
  return listProducts();
}
