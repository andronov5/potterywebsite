'use client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAuthClient } from '../lib/auth/client';
import { formatPrice, type Product } from '../products';
const categories = ['Tea rituals','Kitchen','For pets','Around the home'];
type Message = { id: string; name: string; email: string; topic: string; message: string; is_read: boolean; created_at: string };
type Order = { id: string; product_name: string; quantity: number; status: string; customer_email: string | null; total_cents: number | null; stripe_session_id: string | null; created_at: string };
type Review = { id: string; product_slug: string; name: string; rating: number; body: string; approved: boolean };
const emptyProduct = (): Product => ({ slug: '', name: '', category: 'Kitchen', description: '', price_cents: null, stock: 0, weight_lbs: null, dimensions: null, material: 'BMX clay', care: null, condition_note: '', images: [], tone: 'mint', published: false, sort_order: 0 });
export function AdminStudio({ paymentsReady }: { paymentsReady: boolean }) {
 const router = useRouter();
 const dbRef = useRef<SupabaseClient | null>(null);
 const [checking, setChecking] = useState(true); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [status, setStatus] = useState('');
 const [tab, setTab] = useState('Products'); const [products, setProducts] = useState<Product[]>([]); const [messages, setMessages] = useState<Message[]>([]); const [orders, setOrders] = useState<Order[]>([]); const [reviews, setReviews] = useState<Review[]>([]);
 const [draft, setDraft] = useState<Product | null>(null); const [editing, setEditing] = useState(false); const [dirty, setDirty] = useState(false); const [confirmDiscard, setConfirmDiscard] = useState(false);
 const [contactEmail, setContactEmail] = useState(''); const [portraitUrl, setPortraitUrl] = useState('/studio/natalie-portrait.jpg');
 function db() { if (!dbRef.current) throw new Error('The studio is not connected.'); return dbRef.current; }
 async function loadDashboard() {
  const result = await Promise.all([
   db().from('products').select('*').order('sort_order').order('created_at'),
   db().from('contact_messages').select('*').order('created_at', { ascending: false }),
   db().from('orders').select('id,product_name,quantity,status,customer_email,total_cents,stripe_session_id,created_at').order('created_at', { ascending: false }),
   db().from('reviews').select('*').order('created_at', { ascending: false }),
   db().from('studio_settings').select('*').eq('id',1).single(),
  ]);
  const error = result.find(r => r.error)?.error; if (error) throw new Error('The studio could not load. Check the database setup and try again.');
  setProducts(result[0].data as Product[]); setMessages(result[1].data as Message[]); setOrders(result[2].data as Order[]); setReviews(result[3].data as Review[]);
  setContactEmail(result[4].data.contact_email); setPortraitUrl(result[4].data.portrait_url || '/studio/natalie-portrait.jpg');
 }
 useEffect(() => {
  const client = createAuthClient();
  dbRef.current = client;
  const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
   if (event === 'SIGNED_OUT') { setProducts([]); setOrders([]); setMessages([]); setReviews([]); setDraft(null); setDirty(false); router.replace('/admin/login'); router.refresh(); }
  });
  loadDashboard().catch(e => setStatus(e.message)).finally(() => setChecking(false));
  return () => { subscription.unsubscribe(); };
  // Client identity remains stable for this page mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);
 useEffect(() => {
  function warn(e: BeforeUnloadEvent) { if (dirty) { e.preventDefault(); e.returnValue = ''; } }
  window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
 }, [dirty]);
 async function signOut() {
  const { error } = await db().auth.signOut(); if (error) setStatus('Could not sign out. Please try again.'); else setStatus('Signed out.');
 }
 function change<K extends keyof Product>(key: K, value: Product[K]) { setDraft(p => p ? { ...p, [key]: value } : p); setDirty(true); }
 async function upload(file: File): Promise<string> {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP photo. Convert HEIC photos to JPG first.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose a photo smaller than 15 MB.');
  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const name = `${crypto.randomUUID()}.${ext}`;
  const { error } = await db().storage.from('product-images').upload(name, file, { contentType: file.type, upsert: false });
  if (error) throw new Error('Photo upload failed. Your other changes are still here.');
  return db().storage.from('product-images').getPublicUrl(name).data.publicUrl;
 }
 async function uploadPhotos(files: FileList | null) {
  if (!files || !draft) return; if (files.length + draft.images.length > 12) { setStatus('A product can have up to 12 photos.'); return; }
  setUploading(true); setStatus('');
  try {
   for (const file of Array.from(files)) { const src = await upload(file); setDraft(p => p ? { ...p, images: [...p.images,{ src, alt: p.name || 'Handmade pottery' }] } : p); setDirty(true); }
  } catch (e) { setStatus(e instanceof Error ? e.message : 'Upload failed.'); } finally { setUploading(false); }
 }
 async function saveProduct(e: FormEvent) {
  e.preventDefault(); if (!draft) return; setBusy(true); setStatus('');
  try {
   const slug = editing ? draft.slug : `${draft.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0, 70)}-${crypto.randomUUID().slice(0,8)}`;
   if (draft.published && draft.images.length === 0) throw new Error('Add at least one photo before publishing.');
   if (draft.price_cents !== null && (!Number.isInteger(draft.price_cents) || draft.price_cents < 50)) throw new Error('Set a price of at least $0.50 or leave the price blank.');
   const item = { ...draft, slug, name: draft.name.trim(), description: draft.description.trim(), images: draft.images.map(image => ({ ...image, alt: image.alt.trim() || draft.name })) };
   const { error } = await db().rpc('save_product',{ item }); if (error) throw new Error(error.message);
   setDirty(false); setDraft(null); await loadDashboard(); setStatus('Product saved. Published changes are visible in the shop.');
  } catch (e) { setStatus(e instanceof Error ? e.message : 'Could not save the product.'); } finally { setBusy(false); }
 }
 async function reconcile() {
  setBusy(true); setStatus('Syncing checkout statuses…');
  try {
   const { data: { session } } = await db().auth.getSession();
   const response = await fetch('/api/admin/reconcile',{method:'POST',headers:{Authorization:`Bearer ${session?.access_token || ''}`}});
   const data = await response.json(); if(!response.ok) throw new Error(data.error);
   await loadDashboard(); setStatus(data.message);
  } catch(e) {setStatus(e instanceof Error ? e.message : 'Could not sync checkouts.');} finally {setBusy(false);}
 }
 async function saveSettings(e: FormEvent) {
  e.preventDefault(); setBusy(true); setStatus('');
  try { const { error } = await db().from('studio_settings').update({ contact_email: contactEmail.trim(), portrait_url: portraitUrl }).eq('id',1); if (error) throw error; setStatus('Studio details saved.'); }
  catch { setStatus('Could not save studio details. Please try again.'); } finally { setBusy(false); }
 }
 async function markRead(id: string) {
  const { error } = await db().from('contact_messages').update({ is_read: true }).eq('id',id); if (error) setStatus('Could not mark this message as read.'); else setMessages(m => m.map(x => x.id === id ? { ...x,is_read:true } : x));
 }
 async function moderate(id: string, action: 'approve' | 'delete') {
  const result = action === 'approve' ? await db().from('reviews').update({ approved:true }).eq('id',id) : await db().from('reviews').delete().eq('id',id);
  if (result.error) setStatus('The review could not be updated.'); else { setReviews(r => action === 'delete' ? r.filter(x => x.id !== id) : r.map(x => x.id === id ? { ...x, approved: true } : x)); setStatus('Review updated.'); }
 }
 if (checking) return <p role="status">Opening the studio…</p>;
 return <>
 <div className="admin-heading"><div><p className="eyebrow">Natalie’s studio</p><h1>Your shop, your way.</h1></div><div className="button-row"><Link className="paper-button" href="/" target="_blank">View shop ↗</Link><button className="paper-button" onClick={signOut} disabled={dirty}>Sign out</button></div></div>
 {!paymentsReady && <p className="notice">Payments are not active yet. You can prepare products now; customers will see that online ordering is not open.</p>}
 <p className="form-status" role="status">{status}</p>
 <nav className="studio-tabs" aria-label="Studio sections">{['Products','Messages','Orders','Reviews','Studio details'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => { if (dirty) { setStatus('Save or cancel your product changes before switching sections.'); return; } setTab(t); setDraft(null); }} aria-current={tab === t ? 'page' : undefined}>{t}{t === 'Messages' && messages.some(m => !m.is_read) ? ` (${messages.filter(m => !m.is_read).length})` : ''}</button>)}</nav>
 {tab === 'Products' && !draft && <><div className="collection-heading"><h2>{products.length} products</h2><button className="ink-button" onClick={() => { setDraft({ ...emptyProduct(), sort_order: products.length }); setEditing(false); setDirty(false); setStatus(''); }}>Add a product +</button></div>
 <div className="admin-product-list">{products.map(p => <article key={p.slug}>{p.images[0] && <img src={p.images[0].src} alt="" />}<div><h3>{p.name}</h3><p>{formatPrice(p.price_cents)} · Stock: {p.stock}</p><span className="status-tag">{p.published ? 'Published' : 'Draft'}</span></div><button className="paper-button" onClick={() => { setDraft(structuredClone(p)); setEditing(true); setDirty(false); setStatus(''); }}>Edit</button></article>)}</div></>}
 {tab === 'Products' && draft && <form className="studio-form product-editor" onSubmit={saveProduct}><h2>{editing ? 'Edit product' : 'New product'}</h2><fieldset disabled={busy || uploading}>
 <div className="field-grid"><label>Product name<input required maxLength={120} value={draft.name} onChange={e => change('name',e.target.value)} /></label><label>Category<select value={draft.category} onChange={e => change('category',e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div>
 <label>Description<textarea required maxLength={3000} rows={4} value={draft.description} onChange={e => change('description',e.target.value)} /></label>
 <div className="field-grid"><label>Price in USD (blank until decided)<input type="number" min="0.50" max="10000" step="0.01" value={draft.price_cents === null ? '' : draft.price_cents/100} onChange={e => change('price_cents',e.target.value === '' ? null : Math.round(Number(e.target.value)*100))} /></label><label>Total unsold stock<input type="number" min="0" max="1000" step="1" required value={draft.stock} onChange={e => change('stock',Number(e.target.value))} /></label><label>Weight in pounds<input type="number" min="0.01" max="1000" step="0.01" value={draft.weight_lbs ?? ''} onChange={e => change('weight_lbs',e.target.value === '' ? null : Number(e.target.value))} /></label><label>Dimensions<input maxLength={200} value={draft.dimensions || ''} onChange={e => change('dimensions',e.target.value || null)} /></label><label>Material<input maxLength={200} required value={draft.material} onChange={e => change('material',e.target.value)} /></label><label>Display order<input type="number" min="0" max="100000" required value={draft.sort_order} onChange={e => change('sort_order',Number(e.target.value))} /></label></div>
 <label>Care instructions<textarea maxLength={1000} rows={2} value={draft.care || ''} onChange={e => change('care',e.target.value || null)} /></label>
 <label>Condition or imperfections<textarea rows={2} maxLength={1500} value={draft.condition_note} onChange={e => change('condition_note',e.target.value)} /></label>
 <h3>Product photos</h3><p>The first photo is the shop cover. Add up to 12 JPG, PNG, or WebP images. Maximum 15 MB each.</p>
 <label>Add photos<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => { uploadPhotos(e.target.files); e.target.value=''; }} /></label>
 <div className="editor-photos">{draft.images.map((image,i) => <div key={image.src}><img src={image.src} alt={image.alt} /><label>Photo description<input maxLength={250} required value={image.alt} onChange={e => change('images',draft.images.map((x,n) => n === i ? { ...x,alt:e.target.value } : x))} /></label><div className="button-row">{i > 0 && <button type="button" className="paper-button" onClick={() => change('images',[image,...draft.images.filter((_,n) => n !== i)])}>Make cover</button>}<button type="button" className="text-button" onClick={() => change('images',draft.images.filter((_,n) => n !== i))}>Remove photo</button></div></div>)}</div>
 <label>Card color<select value={draft.tone} onChange={e => change('tone',e.target.value as Product['tone'])}>{['mint','peach','blue','butter','lilac'].map(c => <option key={c}>{c}</option>)}</select></label>
 <label className="checkbox-label"><input type="checkbox" checked={draft.published} onChange={e => change('published',e.target.checked)} />Published in the shop</label><p>Uncheck to hide a piece. Set stock to zero when it is sold. A blank price keeps ordering closed for this product.</p>
 <div className="button-row"><button className="ink-button" type="submit">{busy ? 'Saving…' : 'Save product'}</button><button className="paper-button" type="button" onClick={() => { if (dirty) setConfirmDiscard(true); else setDraft(null); }}>Cancel</button></div>
 </fieldset>{uploading && <p role="status">Uploading your photos…</p>}{confirmDiscard && <div className="notice" role="alert"><p>Discard your unsaved product changes?</p><button type="button" className="paper-button" onClick={() => { setDraft(null); setDirty(false); setConfirmDiscard(false); }}>Discard changes</button><button type="button" className="text-button" onClick={() => setConfirmDiscard(false)}>Keep editing</button></div>}</form>}
 {tab === 'Messages' && <section className="studio-inbox"><h2>Customer messages</h2>{messages.length === 0 && <p>No messages yet. Contact form submissions will appear here.</p>}{messages.map(m => <article key={m.id}><div className="collection-heading"><h3>{m.topic}</h3><span>{m.is_read ? 'Read' : 'New'}</span></div><p><strong>{m.name}</strong> · <a href={`mailto:${m.email}`}>{m.email}</a></p><p className="preserve-lines">{m.message}</p><small>{new Date(m.created_at).toLocaleString()}</small><div className="button-row"><a className="paper-button" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: '+m.topic+' — Pottery by Natalie')}`}>Reply by email</a>{!m.is_read && <button className="text-button" onClick={() => markRead(m.id)}>Mark read</button>}</div></article>)}</section>}
 {tab === 'Orders' && <section className="studio-inbox"><h2>Orders & checkouts</h2><button className="paper-button" disabled={busy || !paymentsReady} onClick={reconcile}>Sync with Stripe</button><p>Paid orders are confirmed by Stripe. Customer delivery details and fulfillment are in Stripe. Reserved checkouts hold stock until Stripe confirms payment or expiration.</p>{orders.length === 0 && <p>No checkouts yet.</p>}{orders.map(o => <article key={o.id}><h3>{o.product_name} × {o.quantity}</h3><p><strong>{o.status}</strong> · {o.total_cents === null ? 'Awaiting payment' : formatPrice(o.total_cents)}</p>{o.customer_email && <p>{o.customer_email}</p>}<p className="mono">Order: {o.id}</p>{o.stripe_session_id && <p className="mono">Stripe session: {o.stripe_session_id}</p>}<small>{new Date(o.created_at).toLocaleString()}</small></article>)}</section>}
 {tab === 'Reviews' && <section className="studio-inbox"><h2>Product reviews</h2><p>New reviews stay private until you publish them.</p>{reviews.length === 0 && <p>No reviews yet.</p>}{reviews.map(r => <article key={r.id}><h3>{r.name} · {r.rating}/5</h3><p>{products.find(p => p.slug === r.product_slug)?.name || r.product_slug}</p><p>{r.body}</p><div className="button-row">{r.approved ? <span>Published</span> : <button className="ink-button" onClick={() => moderate(r.id,'approve')}>Publish review</button>}<button className="text-button" onClick={() => moderate(r.id,'delete')}>Remove review</button></div></article>)}</section>}
 {tab === 'Studio details' && <form className="studio-form product-editor" onSubmit={saveSettings}><h2>About & contact</h2><label>Public contact email<input type="email" maxLength={254} value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></label><p>This email will appear on the About page. Messages from the contact form arrive in your studio inbox.</p><img className="admin-portrait" src={portraitUrl} alt="Current portrait" /><label>Replace your portrait<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={async e => { const file=e.target.files?.[0]; if (!file) return; setUploading(true); try { setPortraitUrl(await upload(file)); setStatus('Portrait uploaded. Save studio details to publish it.'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Upload failed.'); } finally { setUploading(false); } }} /></label><button className="ink-button" disabled={busy || uploading}>{busy ? 'Saving…' : 'Save studio details'}</button></form>}
 </>;
}
