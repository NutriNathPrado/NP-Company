-- ============================================================
-- SETUP DO BANCO — Nath Prado Studio (Supabase)
-- Cola tudo isto no Supabase → SQL Editor → New query → Run.
-- Cria as tabelas (posts, kv, sources, book_chunks) e a busca por trecho.
-- Pode rodar mais de uma vez sem problema (usa "if not exists").
-- ============================================================

-- Posts (carrosséis, stories e reels salvos)
create table if not exists posts (
  id text primary key,
  data jsonb not null,
  stage text,
  scheduled_at text,
  updated_at timestamptz default now()
);

-- KV (a "gaveta geral": marca, voz, aprendizados, planos, etc.)
create table if not exists kv (
  key text primary key,
  value jsonb
);

-- Sources (PDFs / artigos / textos que embasam o conteúdo)
create table if not exists sources (
  id text primary key,
  title text not null,
  kind text,             -- pdf | texto | url | livro
  url text,
  content text not null, -- texto extraído (referência pra IA)
  excerpt text,          -- recorte enxuto usado como conhecimento de fundo
  tags text,
  created_at timestamptz default now()
);
alter table sources add column if not exists excerpt text;

-- Busca semântica dos livros (opcional, mas o app espera existir)
create extension if not exists vector;
create table if not exists book_chunks (
  id bigserial primary key,
  source_id text references sources(id) on delete cascade,
  ord int,
  content text not null,
  embedding vector(1024)
);
create index if not exists book_chunks_embedding_idx
  on book_chunks using hnsw (embedding vector_cosine_ops);

create or replace function match_book_chunks(query_embedding vector(1024), match_count int)
returns table(content text, source_id text, similarity float)
language sql stable as $func$
  select bc.content, bc.source_id, 1 - (bc.embedding <=> query_embedding) as similarity
  from book_chunks bc
  order by bc.embedding <=> query_embedding
  limit match_count;
$func$;

-- Confere o que foi criado:
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('posts','kv','sources','book_chunks');
