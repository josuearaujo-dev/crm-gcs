-- Tabela de GCs (Grupos de Célula)
CREATE TABLE IF NOT EXISTS public.gcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gcs_select_all" ON public.gcs FOR SELECT USING (true);
CREATE POLICY "gcs_insert_all" ON public.gcs FOR INSERT WITH CHECK (true);
CREATE POLICY "gcs_update_all" ON public.gcs FOR UPDATE USING (true);
CREATE POLICY "gcs_delete_all" ON public.gcs FOR DELETE USING (true);

-- Tabela de Pessoas
CREATE TABLE IF NOT EXISTS public.pessoas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  gc_id UUID REFERENCES public.gcs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pessoas_select_all" ON public.pessoas FOR SELECT USING (true);
CREATE POLICY "pessoas_insert_all" ON public.pessoas FOR INSERT WITH CHECK (true);
CREATE POLICY "pessoas_update_all" ON public.pessoas FOR UPDATE USING (true);
CREATE POLICY "pessoas_delete_all" ON public.pessoas FOR DELETE USING (true);
