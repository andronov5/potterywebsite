import 'server-only';
import { initialProducts, type Product } from '../products';
import { hasDatabase, publicDatabase } from './supabase';
export async function getProducts(): Promise<Product[]> {
  if (!hasDatabase()) return initialProducts.filter(p => p.published);
  const { data, error } = await publicDatabase().from('products').select('*').is('deleted_at', null).order('sort_order').order('created_at');
  if (error) throw new Error('The collection is temporarily unavailable. Please try again.');
  return data as Product[];
}
export async function getProduct(slug: string) { return (await getProducts()).find(product => product.slug === slug); }
export async function getStudio() {
  const fallback = { contact_email: '', portrait_url: '/studio/natalie-portrait.jpg' };
  if (!hasDatabase()) return fallback;
  const { data, error } = await publicDatabase().from('studio_settings').select('contact_email,portrait_url').eq('id', 1).maybeSingle();
  if (error) throw new Error('Studio details are temporarily unavailable.');
  return data || fallback;
}
