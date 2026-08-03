import { getDashboardSnapshot } from '../server/dashboard/dashboard.data.js';

export async function loader() {
  return getDashboardSnapshot();
}
