-- ============================================================
-- Vesper — Migration: opzione "Non so ancora" per children_status
-- Aggiunge il valore 'non_so' alla lista chiusa di CHILDREN_OPTIONS,
-- per chi non ha ancora le idee chiare riguardo ai figli.
-- ============================================================

alter table public.profiles
  drop constraint if exists profiles_children_status_check;

alter table public.profiles
  add constraint profiles_children_status_check
    check (children_status in (
      'ho_figli','non_ho_figli','vorrei_figli','non_vorrei_figli','non_so'
    ));
