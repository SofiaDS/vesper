-- ============================================================
-- Vesper — Fix: policy SELECT mancante su identity-verifications
-- Problema: upsert controlla l'esistenza del file via SELECT prima
-- di decidere INSERT vs UPDATE. Senza questa policy la SELECT è
-- bloccata e l'upload fallisce con "violates row-level security policy".
-- ============================================================
create policy "verif_select_self"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'identity-verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
