import { applySession } from '../../../lib/fulfillment';
import type Stripe from 'stripe';
import { sameOrigin, serviceDatabase, stripeClient } from '../../../lib/server';
export const runtime = 'nodejs';
export async function POST(request: Request) {
 if (!sameOrigin(request)) return Response.json({ error: 'Use the studio dashboard.' },{status:403});
 const token = request.headers.get('authorization')?.replace(/^Bearer /,'');
 if (!token) return Response.json({error:'Sign in first.'},{status:401});
 try {
  const db=serviceDatabase(); const auth=await db.auth.getUser(token);
  if (!auth.data.user) return Response.json({error:'Sign in first.'},{status:401});
  const membership=await db.from('admin_users').select('user_id').eq('user_id',auth.data.user.id).maybeSingle();
  if (membership.error || !membership.data) return Response.json({error:'Studio access required.'},{status:403});
  const pending=await db.from('orders').select('*').eq('status','reserved').order('created_at').limit(25);
  if (pending.error) throw pending.error;
  const stripe=stripeClient(); let updated=0; let held=0;
  for (const order of pending.data) {
   let session: Stripe.Checkout.Session | null = order.stripe_session_id ? await stripe.checkout.sessions.retrieve(order.stripe_session_id) : null;
   const age = Date.now()-Date.parse(order.created_at);
   if (!session && age > 24*60*60*1000) {
    const start=Math.floor(Date.parse(order.created_at)/1000)-60;
    // Inspect every page in this bounded creation window; never free stock on
    // an API failure, partial pagination, or a mere local timeout.
    for await (const candidate of stripe.checkout.sessions.list({created:{gte:start,lte:start+24*60*60+120},limit:100})) {
     if (candidate.client_reference_id===order.id && candidate.metadata?.order_id===order.id) { session=candidate; break; }
    }
    if (!session) { const released=await db.rpc('release_uncreated_checkout',{order_id:order.id}); if(released.error) throw released.error; updated++; continue; }
   }
   if (!session) { held++; continue; }
   if (session.payment_status==='paid') { await applySession(session,'paid'); updated++; }
   else if (session.status==='expired') { await applySession(session,'expired'); updated++; }
   else {
    if (!order.stripe_session_id) { const saved=await db.from('orders').update({stripe_session_id:session.id}).eq('id',order.id); if(saved.error) throw saved.error; }
    held++;
   }
  }
  return Response.json({message:`Synced ${updated} checkouts. ${held} checkouts remain held. Run again if older checkouts remain.`});
 } catch { return Response.json({error:'Could not finish syncing with Stripe. Stock remains protected; please try again.'},{status:503}); }
}
