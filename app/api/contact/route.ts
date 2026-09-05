import { z } from 'zod';
import { allowRequest, readBody, sameOrigin, serviceDatabase } from '../../lib/server';
const schema = z.object({ name: z.string().trim().min(1).max(100), email: z.email().max(254), topic: z.enum(['Custom piece', 'Product question', 'Order question', 'Something else']), message: z.string().trim().min(10).max(4000), website: z.string().max(200).optional() });
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Please send this form from the website.' }, { status: 403 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: 'Contact is not open yet. Please check back.' }, { status: 503 });
  try {
    const data = schema.safeParse(await readBody(request));
    if (!data.success) return Response.json({ error: 'Please check your name, email, and message.' }, { status: 400 });
    if (data.data.website) return Response.json({ error: 'Unable to send this message.' }, { status: 400 });
    if (!await allowRequest(request, 'contact', 5)) return Response.json({ error: 'Too many messages. Please try again in ten minutes.' }, { status: 429 });
    const { website: _website, ...message } = data.data;
    const { error } = await serviceDatabase().from('contact_messages').insert(message);
    if (error) throw error;
    return Response.json({ sent: true });
  } catch { return Response.json({ error: 'Your message was not sent. Please try again later.' }, { status: 503 }); }
}
