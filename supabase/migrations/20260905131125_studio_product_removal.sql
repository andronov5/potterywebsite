-- Apply once to existing installations. Stock was separately set to one by owner request.
-- Do not reset stock in a migration: doing so could restock a sold piece.
alter table public.products add column deleted_at timestamptz;
alter table public.products alter column stock set default 1;
alter table public.products add constraint deleted_products_stay_unpublished check (deleted_at is null or not published);
alter policy "Public catalog" on public.products using (published and deleted_at is null);
alter policy "Authenticated catalog" on public.products using ((published and deleted_at is null) or public.is_studio_admin());

create or replace function private.save_product(item jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare reserved_count integer; photo jsonb; current_product public.products;
begin
 if not exists(select 1 from public.admin_users where user_id = auth.uid()) then raise exception 'Studio access required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(item->>'slug',1));
 select * into current_product from public.products where slug = item->>'slug' for update;
 if current_product.deleted_at is not null then raise exception 'This product has been deleted. Refresh the studio.'; end if;
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
revoke all on function private.save_product(jsonb) from public, anon, authenticated;
grant execute on function private.save_product(jsonb) to authenticated;

-- Keep a record for order history while removing the product from both lists.
create function private.delete_product(product_slug text, expected_updated_at timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare current_product public.products;
begin
 if not exists(select 1 from public.admin_users where user_id = auth.uid()) then raise exception 'Studio access required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(product_slug,1));
 select * into current_product from public.products where slug = product_slug for update;
 if not found or current_product.deleted_at is not null then raise exception 'This product has already been deleted. Refresh the studio.'; end if;
 if expected_updated_at is null or current_product.updated_at is distinct from expected_updated_at then raise exception 'This product changed since you opened it. Refresh the studio before deleting.'; end if;
 if exists(select 1 from public.orders o where o.product_slug = delete_product.product_slug and o.status = 'reserved') then raise exception 'This piece is held in an active checkout. Wait for the checkout to finish before deleting.'; end if;
 update public.products set published = false, deleted_at = now(), updated_at = now() where slug = product_slug;
end; $$;
revoke all on function private.delete_product(text,timestamptz) from public, anon, authenticated;
grant execute on function private.delete_product(text,timestamptz) to authenticated;

create function public.delete_product(product_slug text, expected_updated_at timestamptz) returns void
language sql security invoker set search_path = '' as $$
 select private.delete_product(product_slug, expected_updated_at);
$$;
revoke all on function public.delete_product(text,timestamptz) from public, anon;
grant execute on function public.delete_product(text,timestamptz) to authenticated;

