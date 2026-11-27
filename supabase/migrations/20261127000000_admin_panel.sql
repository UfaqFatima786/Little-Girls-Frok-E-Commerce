create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiless
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 2. Products: admins can read (incl. inactive), insert, update, delete
grant insert, update, delete on public.products to authenticated;

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Orders / order items / customers / newsletter: admin read access
drop policy if exists "Admins read all orders" on public.orders;
create policy "Admins read all orders"
  on public.orders for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins read all order items" on public.order_items;
create policy "Admins read all order items"
  on public.order_items for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins read all profiles" on public.profiless;
create policy "Admins read all profiles"
  on public.profiless for select to authenticated
  using (public.is_admin());

grant select, delete on public.newsletter_subscribers to authenticated;

drop policy if exists "Admins read subscribers" on public.newsletter_subscribers;
create policy "Admins read subscribers"
  on public.newsletter_subscribers for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins delete subscribers" on public.newsletter_subscribers;
create policy "Admins delete subscribers"
  on public.newsletter_subscribers for delete to authenticated
  using (public.is_admin());

-- 4. Update order status. Restocks items when an order is cancelled and
--    re-deducts stock if a cancelled order is re-opened.
create or replace function public.admin_update_order(
  p_order_id uuid,
  p_order_status text,
  p_payment_status text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old_status text;
  v_item record;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  if p_order_status not in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Invalid order status.';
  end if;

  if p_payment_status not in ('pending', 'paid', 'failed', 'refunded') then
    raise exception 'Invalid payment status.';
  end if;

  select order_status into v_old_status
  from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  if v_old_status <> 'cancelled' and p_order_status = 'cancelled' then
    update public.products p
    set stock = p.stock + oi.quantity, updated_at = now()
    from public.order_items oi
    where oi.order_id = p_order_id and oi.product_id = p.id;
  elsif v_old_status = 'cancelled' and p_order_status <> 'cancelled' then
    for v_item in
      select oi.product_id, oi.quantity, p.stock
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = p_order_id
      for update of p
    loop
      if v_item.stock < v_item.quantity then
        raise exception 'Not enough stock to re-open this order.';
      end if;
      update public.products
      set stock = stock - v_item.quantity, updated_at = now()
      where id = v_item.product_id;
    end loop;
  end if;

  update public.orders
  set order_status = p_order_status,
      payment_status = p_payment_status,
      updated_at = now()
  where id = p_order_id;
end;
$$;

revoke all on function public.admin_update_order(uuid, text, text) from public;
grant execute on function public.admin_update_order(uuid, text, text) to authenticated;

-- 5. Storage bucket for product images (public read, admin write)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- 6. Make yourself an admin (run once, replace the email):
-- update public.profiless set role = 'admin' where email = 'your-email@example.com';
