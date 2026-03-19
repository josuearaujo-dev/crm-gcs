-- =============================================================================
-- Presenças nas reuniões do GC (toda sexta-feira)
-- Requer: public.gc_leaders, public.superadmins, public.is_gc_leader_for(uuid),
--         public.is_superadmin()
-- =============================================================================

-- 1) Tabela: uma linha = presença de uma pessoa numa sexta-feira específica do GC
CREATE TABLE IF NOT EXISTS public.gc_presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gc_id uuid NOT NULL REFERENCES public.gcs(id) ON DELETE CASCADE,
  data_reuniao date NOT NULL,
  pessoa_id uuid NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  presente boolean NOT NULL DEFAULT true,
  observacao text,
  marcado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gc_presencas_data_e_sexta CHECK (EXTRACT(ISODOW FROM data_reuniao)::int = 5),
  CONSTRAINT gc_presencas_gc_pessoa_data_unique UNIQUE (gc_id, data_reuniao, pessoa_id)
);

CREATE INDEX IF NOT EXISTS idx_gc_presencas_gc_data ON public.gc_presencas (gc_id, data_reuniao);
CREATE INDEX IF NOT EXISTS idx_gc_presencas_pessoa ON public.gc_presencas (pessoa_id);

COMMENT ON TABLE public.gc_presencas IS 'Lista de presença por reunião (sextas). Líder do GC marca quem compareceu.';

-- 2) Garantir que a pessoa pertence ao GC indicado
CREATE OR REPLACE FUNCTION public.gc_presencas_validar_pessoa_no_gc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gc uuid;
BEGIN
  SELECT p.gc_id INTO v_gc FROM public.pessoas p WHERE p.id = NEW.pessoa_id;
  IF v_gc IS NULL OR v_gc <> NEW.gc_id THEN
    RAISE EXCEPTION 'A pessoa não pertence a este GC (gc_id incompatível).';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_gc_presencas_validar_pessoa ON public.gc_presencas;
CREATE TRIGGER tr_gc_presencas_validar_pessoa
BEFORE INSERT OR UPDATE OF gc_id, pessoa_id ON public.gc_presencas
FOR EACH ROW
EXECUTE FUNCTION public.gc_presencas_validar_pessoa_no_gc();

-- 3) Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_gc_presencas_updated_at ON public.gc_presencas;
CREATE TRIGGER tr_gc_presencas_updated_at
BEFORE UPDATE ON public.gc_presencas
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4) RLS
ALTER TABLE public.gc_presencas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gc_presencas_select_leader_or_superadmin" ON public.gc_presencas;
CREATE POLICY "gc_presencas_select_leader_or_superadmin"
ON public.gc_presencas
FOR SELECT
USING (
  public.is_superadmin()
  OR public.is_gc_leader_for(gc_id)
);

DROP POLICY IF EXISTS "gc_presencas_insert_leader_or_superadmin" ON public.gc_presencas;
CREATE POLICY "gc_presencas_insert_leader_or_superadmin"
ON public.gc_presencas
FOR INSERT
WITH CHECK (
  public.is_superadmin()
  OR public.is_gc_leader_for(gc_id)
);

DROP POLICY IF EXISTS "gc_presencas_update_leader_or_superadmin" ON public.gc_presencas;
CREATE POLICY "gc_presencas_update_leader_or_superadmin"
ON public.gc_presencas
FOR UPDATE
USING (
  public.is_superadmin()
  OR public.is_gc_leader_for(gc_id)
)
WITH CHECK (
  public.is_superadmin()
  OR public.is_gc_leader_for(gc_id)
);

DROP POLICY IF EXISTS "gc_presencas_delete_leader_or_superadmin" ON public.gc_presencas;
CREATE POLICY "gc_presencas_delete_leader_or_superadmin"
ON public.gc_presencas
FOR DELETE
USING (
  public.is_superadmin()
  OR public.is_gc_leader_for(gc_id)
);

-- =============================================================================
-- Funções úteis
-- =============================================================================

-- Lista todas as sextas-feiras de um ano (calendário ISO: sexta = dia 5)
CREATE OR REPLACE FUNCTION public.sextas_do_ano(p_ano integer)
RETURNS SETOF date
LANGUAGE sql
STABLE
AS $$
  SELECT d::date
  FROM generate_series(
    make_date(p_ano, 1, 1),
    make_date(p_ano, 12, 31),
    interval '1 day'
  ) AS d
  WHERE EXTRACT(ISODOW FROM d)::int = 5;
$$;

-- Próxima sexta-feira a partir de uma data (inclusive: se já for sexta, devolve ela)
CREATE OR REPLACE FUNCTION public.proxima_sexta(p_ref date DEFAULT CURRENT_DATE)
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT (
    p_ref
    + ((5 - EXTRACT(ISODOW FROM p_ref)::int + 7) % 7) * interval '1 day'
  )::date;
$$;

-- Marca presença em lote: upsert por (gc, data, pessoa)
-- p_presentes = array de pessoa_id que compareceram; ausentes podem ser removidos ou marcados presente=false
CREATE OR REPLACE FUNCTION public.gc_marcar_presencas(
  p_gc_id uuid,
  p_data_reuniao date,
  p_presentes uuid[],
  p_ausentes_tambem boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
BEGIN
  IF EXTRACT(ISODOW FROM p_data_reuniao)::int <> 5 THEN
    RAISE EXCEPTION 'data_reuniao deve ser uma sexta-feira.';
  END IF;

  IF NOT (public.is_superadmin() OR public.is_gc_leader_for(p_gc_id)) THEN
    RAISE EXCEPTION 'Sem permissão para marcar presença neste GC.';
  END IF;

  -- Upsert presentes
  FOREACH pid IN ARRAY COALESCE(p_presentes, ARRAY[]::uuid[])
  LOOP
    INSERT INTO public.gc_presencas (gc_id, data_reuniao, pessoa_id, presente, marcado_por)
    VALUES (p_gc_id, p_data_reuniao, pid, true, auth.uid())
    ON CONFLICT (gc_id, data_reuniao, pessoa_id)
    DO UPDATE SET
      presente = true,
      marcado_por = auth.uid(),
      updated_at = now();
  END LOOP;

  -- Opcional: marcar como ausente quem está no GC mas não está na lista
  IF p_ausentes_tambem THEN
    UPDATE public.gc_presencas gp
    SET presente = false, marcado_por = auth.uid(), updated_at = now()
    WHERE gp.gc_id = p_gc_id
      AND gp.data_reuniao = p_data_reuniao
      AND gp.pessoa_id NOT IN (SELECT unnest(COALESCE(p_presentes, ARRAY[]::uuid[])));

    INSERT INTO public.gc_presencas (gc_id, data_reuniao, pessoa_id, presente, marcado_por)
    SELECT p_gc_id, p_data_reuniao, p.id, false, auth.uid()
    FROM public.pessoas p
    WHERE p.gc_id = p_gc_id
      AND p.id NOT IN (SELECT unnest(COALESCE(p_presentes, ARRAY[]::uuid[])))
    ON CONFLICT (gc_id, data_reuniao, pessoa_id)
    DO UPDATE SET
      presente = false,
      marcado_por = auth.uid(),
      updated_at = now();
  END IF;
END;
$$;

-- Permissão: só quem pode chamar a função é o próprio usuário autenticado (RLS ainda se aplica nas linhas inseridas)
REVOKE ALL ON FUNCTION public.gc_marcar_presencas(uuid, date, uuid[], boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gc_marcar_presencas(uuid, date, uuid[], boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.sextas_do_ano(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sextas_do_ano(integer) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.proxima_sexta(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.proxima_sexta(date) TO authenticated, anon;
