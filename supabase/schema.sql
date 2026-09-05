-- Run once in a new Supabase project. Do not expose service-role keys in the browser.
create table public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
create policy "Read own studio membership" on public.admin_users for select to authenticated using (user_id = auth.uid());
grant select on public.admin_users to authenticated;
revoke all on public.admin_users from anon;

create function public.is_studio_admin() returns boolean language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_studio_admin() from public;
grant execute on function public.is_studio_admin() to authenticated;

create table public.products (
 slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100),
 name text not null check (length(trim(name)) between 1 and 120),
 category text not null check (category in ('Tea rituals','Kitchen','For pets','Around the home')),
 description text not null check (length(trim(description)) between 1 and 3000),
 price_cents integer check (price_cents between 50 and 1000000),
 stock integer not null default 0 check (stock between 0 and 1000),
 weight_lbs numeric check (weight_lbs > 0 and weight_lbs <= 1000),
 dimensions text check (length(dimensions) <= 200),
 material text not null default 'BMX clay' check (length(material) between 1 and 200),
 care text check (length(care) <= 1000),
 condition_note text not null default '' check (length(condition_note) <= 1500),
 images jsonb not null default '[]' check (jsonb_typeof(images) = 'array' and jsonb_array_length(images) <= 12),
 tone text not null default 'mint' check (tone in ('peach','mint','blue','butter','lilac')),
 published boolean not null default false,
 sort_order integer not null default 0 check (sort_order between 0 and 100000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (not published or jsonb_array_length(images) > 0)
);
alter table public.products enable row level security;
create policy "Published catalog" on public.products for select to anon, authenticated using (published);
create policy "Studio reads drafts" on public.products for select to authenticated using (public.is_studio_admin());
grant select on public.products to anon, authenticated;
revoke insert, update, delete on public.products from anon, authenticated;

create table public.studio_settings (
 id integer primary key check (id = 1),
 contact_email text not null default '' check (length(contact_email) <= 254 and (contact_email = '' or contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
 portrait_url text not null default '/studio/natalie-portrait.jpg' check (portrait_url like '/studio/%' or portrait_url like 'https://%/storage/v1/object/public/product-images/%')
);
insert into public.studio_settings(id) values (1);
alter table public.studio_settings enable row level security;
create policy "Public studio details" on public.studio_settings for select to anon, authenticated using (true);
create policy "Studio edits settings" on public.studio_settings for update to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());
grant select on public.studio_settings to anon, authenticated;
grant update (contact_email, portrait_url) on public.studio_settings to authenticated;

create table public.orders (
 id uuid primary key,
 product_slug text not null references public.products(slug),
 product_name text not null,
 quantity integer not null check (quantity between 1 and 10),
 unit_price_cents integer not null,
 status text not null default 'reserved' check (status in ('reserved','paid','expired')),
 checkout_config jsonb not null,
 stripe_session_id text unique,
 customer_email text,
 total_cents integer,
 expires_unix bigint not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index orders_product_status on public.orders(product_slug, status);
alter table public.orders enable row level security;
create policy "Studio reads orders" on public.orders for select to authenticated using (public.is_studio_admin());
grant select on public.orders to authenticated;
revoke all on public.orders from anon;

create table public.contact_messages (
 id uuid primary key default gen_random_uuid(), name text not null, email text not null,
 topic text not null, message text not null, is_read boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create policy "Studio inbox" on public.contact_messages for select to authenticated using (public.is_studio_admin());
create policy "Studio marks messages read" on public.contact_messages for update to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());
grant select on public.contact_messages to authenticated;
grant update (is_read) on public.contact_messages to authenticated;
revoke all on public.contact_messages from anon;

create table public.reviews (
 id uuid primary key default gen_random_uuid(), product_slug text not null references public.products(slug),
 name text not null check (length(name) between 1 and 100),
 rating integer not null check (rating between 1 and 5),
 body text not null check (length(body) between 10 and 2000),
 approved boolean not null default false, created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "Public approved reviews" on public.reviews for select to anon, authenticated using (approved and exists(select 1 from public.products where slug = product_slug and published));
create policy "Studio review moderation" on public.reviews for select to authenticated using (public.is_studio_admin());
create policy "Studio approves reviews" on public.reviews for update to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());
create policy "Studio removes reviews" on public.reviews for delete to authenticated using (public.is_studio_admin());
grant select on public.reviews to anon, authenticated;
grant update (approved), delete on public.reviews to authenticated;
revoke insert on public.reviews from anon, authenticated;

create table public.rate_limits (key text primary key, starts_at timestamptz not null, hits integer not null);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
create function public.take_rate_limit(bucket_key text, max_requests integer) returns boolean language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
 delete from public.rate_limits where starts_at < now() - interval '1 day';
 insert into public.rate_limits values(bucket_key, now(), 1)
 on conflict(key) do update set
 hits = case when public.rate_limits.starts_at < now() - interval '10 minutes' then 1 else public.rate_limits.hits + 1 end,
 starts_at = case when public.rate_limits.starts_at < now() - interval '10 minutes' then now() else public.rate_limits.starts_at end
 returning hits into n;
 return n <= max_requests;
end; $$;

create function public.save_product(item jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare reserved_count integer; photo jsonb; current_product public.products;
begin
 if not exists(select 1 from public.admin_users where user_id = auth.uid()) then raise exception 'Studio access required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(item->>'slug',1));
 select * into current_product from public.products where slug = item->>'slug' for update;
 if found and (item->>'updated_at' is null or current_product.updated_at is distinct from (item->>'updated_at')::timestamptz) then raise exception 'This product changed since you opened it. Cancel and reopen it before saving to protect stock.'; end if;
 if not found and item->>'updated_at' is not null then raise exception 'This product no longer exists'; end if;
 select coalesce(sum(quantity),0) into reserved_count from public.orders where product_slug = item->>'slug' and status = 'reserved';
 if (item->>'stock')::integer < reserved_count then raise exception 'Stock cannot be less than the quantity held in active checkouts (%)', reserved_count; end if;
 for photo in select * from jsonb_array_elements(item->'images') loop
   if coalesce(photo->>'src','') !~ '^(/products/[a-zA-Z0-9._-]+|https://[^/]+/storage/v1/object/public/product-images/[a-zA-Z0-9/._-]+)$' or length(coalesce(photo->>'alt','')) not between 1 and 250 then raise exception 'A photo URL or description is invalid'; end if;
 end loop;
 insert into public.products(slug,name,category,description,price_cents,stock,weight_lbs,dimensions,material,care,condition_note,images,tone,published,sort_order)
 values(item->>'slug',item->>'name',item->>'category',item->>'description',(item->>'price_cents')::integer,(item->>'stock')::integer,(item->>'weight_lbs')::numeric,item->>'dimensions',item->>'material',item->>'care',coalesce(item->>'condition_note',''),item->'images',item->>'tone',(item->>'published')::boolean,(item->>'sort_order')::integer)
 on conflict(slug) do update set name=excluded.name,category=excluded.category,description=excluded.description,price_cents=excluded.price_cents,stock=excluded.stock,weight_lbs=excluded.weight_lbs,dimensions=excluded.dimensions,material=excluded.material,care=excluded.care,condition_note=excluded.condition_note,images=excluded.images,tone=excluded.tone,published=excluded.published,sort_order=excluded.sort_order,updated_at=now();
end; $$;
revoke all on function public.save_product(jsonb) from public, anon;
grant execute on function public.save_product(jsonb) to authenticated;

create function public.reserve_product(request_id uuid, requested_slug text, requested_quantity integer, config jsonb) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare p public.products; o public.orders; held integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(request_id::text,0));
 select * into o from public.orders where id = request_id;
 if found then
   if o.product_slug <> requested_slug or o.quantity <> requested_quantity then raise exception 'Checkout request does not match'; end if;
   return to_jsonb(o);
 end if;
 if requested_quantity not between 1 and 10 then raise exception 'Choose a valid quantity'; end if;
 select * into p from public.products where slug = requested_slug for update;
 if not found or not p.published or p.price_cents is null then raise exception 'This piece is not available for purchase'; end if;
 select coalesce(sum(quantity),0) into held from public.orders where product_slug=requested_slug and status='reserved';
 if p.stock - held < requested_quantity then raise exception 'This piece is sold out or held in another checkout. Please try again later.'; end if;
 insert into public.orders(id,product_slug,product_name,quantity,unit_price_cents,checkout_config,expires_unix)
 values(request_id,p.slug,p.name,requested_quantity,p.price_cents,config,extract(epoch from now() + interval '45 minutes')::bigint) returning * into o;
 return to_jsonb(o);
end; $$;

create function public.apply_checkout_event(order_id uuid, session_id text, outcome text, subtotal integer, total integer, currency_code text, email text) returns void language plpgsql security invoker set search_path = '' as $$
declare o public.orders;
begin
 select * into o from public.orders where id=order_id for update;
 if not found then raise exception 'Unknown checkout'; end if;
 if o.stripe_session_id is not null and o.stripe_session_id <> session_id then raise exception 'Checkout session mismatch'; end if;
 if outcome = 'paid' then
   if subtotal is distinct from o.unit_price_cents * o.quantity or currency_code is distinct from 'usd' then raise exception 'Checkout amount mismatch'; end if;
   if o.status='paid' then return; end if;
   if o.status <> 'reserved' then raise exception 'Checkout is not reserved'; end if;
   update public.products set stock=stock-o.quantity,updated_at=now() where slug=o.product_slug and stock >= o.quantity;
   if not found then raise exception 'Inventory mismatch'; end if;
   update public.orders set status='paid',stripe_session_id=session_id,customer_email=email,total_cents=total,updated_at=now() where id=order_id;
 elsif outcome = 'expired' then
   if o.status <> 'reserved' then return; end if;
   update public.orders set status='expired',stripe_session_id=session_id,updated_at=now() where id=order_id;
 else raise exception 'Invalid checkout outcome';
 end if;
end; $$;

revoke all on function public.reserve_product(uuid,text,integer,jsonb) from public,anon,authenticated;
revoke all on function public.apply_checkout_event(uuid,text,text,integer,integer,text,text) from public,anon,authenticated;
revoke all on function public.take_rate_limit(text,integer) from public,anon,authenticated;
grant execute on function public.reserve_product(uuid,text,integer,jsonb) to service_role;
grant execute on function public.apply_checkout_event(uuid,text,text,integer,integer,text,text) to service_role;
grant execute on function public.take_rate_limit(text,integer) to service_role;
grant all on public.products, public.orders, public.contact_messages, public.reviews, public.rate_limits, public.studio_settings to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,15728640,array['image/jpeg','image/png','image/webp']);
create policy "Studio image uploads" on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.is_studio_admin());
create policy "Studio image reads" on storage.objects for select to authenticated using(bucket_id='product-images' and public.is_studio_admin());
-- No anonymous writes, no admin membership self-enrollment, and no client order mutations.

-- Only the server may release a hold after a definitive pre-creation rejection,
-- or after Stripe reconciliation confirms that no session was ever created.
create function public.release_uncreated_checkout(order_id uuid) returns void language plpgsql security invoker set search_path = '' as $$
begin
 update public.orders set status='expired',updated_at=now()
 where id=order_id and status='reserved' and stripe_session_id is null;
end; $$;
revoke all on function public.release_uncreated_checkout(uuid) from public,anon,authenticated;
grant execute on function public.release_uncreated_checkout(uuid) to service_role;
