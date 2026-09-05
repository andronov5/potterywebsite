import seed from './initial-products.json';
export type Product = {
  slug: string; name: string; category: string; description: string;
  price_cents: number | null; stock: number; weight_lbs: number | null;
  dimensions: string | null; material: string; care: string | null;
  condition_note: string; images: { src: string; alt: string }[];
  tone: 'peach' | 'mint' | 'blue' | 'butter' | 'lilac';
  published: boolean; sort_order: number; updated_at?: string;
};
export const initialProducts = seed as Product[];
export function formatPrice(cents: number | null) {
  return cents === null ? 'Price to come' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
