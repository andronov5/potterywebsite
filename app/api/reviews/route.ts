import { z } from 'zod';
import { publicDatabase } from '../../lib/supabase';
import { allowRequest, readBody, reviewSubmissionReady, sameOrigin, serviceDatabase } from '../../lib/server';
const schema = z.object({ product_slug: z.string().regex(/^[a-z0-9-]+$/).max(100), name: z.string().trim().min(1).max(100), rating: z.number().int().min(1).max(5), body: z.string().trim().min(10).max(2000) });
export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get('product');
    const { data, error } = await publicDatabase().from('reviews').select('id,name,rating,body,created_at').eq('product_slug', slug || '').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return Response.json({ reviews: data });
  } catch { return Response.json({ error: 'Reviews could not be loaded.' }, { status: 503 }); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Please use the review form on the website.' }, { status: 403 });
  if (!reviewSubmissionReady()) return Response.json({ error: 'Review submissions are temporarily unavailable.' }, { status: 503 });
  try {
    const data = schema.safeParse(await readBody(request));
    if (!data.success) return Response.json({ error: 'Please check your name, rating, and review (at least 10 characters).' }, { status: 400 });
    if (!await allowRequest(request, 'reviews', 3)) return Response.json({ error: 'Please try again in ten minutes.' }, { status: 429 });
    const product = await publicDatabase().from('products').select('slug').eq('slug', data.data.product_slug).maybeSingle();
    if (product.error) throw product.error;
    if (!product.data) return Response.json({ error: 'This piece could not be found.' }, { status: 404 });
    const { error } = await serviceDatabase().from('reviews').insert(data.data);
    if (error) throw error;
    return Response.json({ submitted: true });
  } catch { return Response.json({ error: 'Your review was not sent. Please try again later.' }, { status: 503 }); }
}
