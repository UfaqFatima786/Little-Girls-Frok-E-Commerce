alter table public.newsletter_subscribers enable row level security;

do $$
declare
  insert_policy record;
begin
  for insert_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'newsletter_subscribers'
      and cmd in ('INSERT', 'ALL')
  loop
    execute format(
      'drop policy %I on public.newsletter_subscribers',
      insert_policy.policyname
    );
  end loop;
end;
$$;

create policy "Anyone subscribes to the newsletter"
  on public.newsletter_subscribers for insert to anon, authenticated
  with check (
    email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  );

grant insert on public.newsletter_subscribers to anon, authenticated;
