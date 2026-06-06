create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  telefono text not null,
  lesion text not null,
  en_blanco text not null check (en_blanco in ('si', 'no')),
  tiempo text not null check (tiempo in ('menos18', 'mas18')),
  source text,
  user_agent text,
  ip text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed'))
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
