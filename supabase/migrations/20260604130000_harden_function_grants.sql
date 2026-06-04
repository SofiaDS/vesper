-- Migration: hardening dei privilegi EXECUTE sulle SECURITY DEFINER functions
-- Data: 4 giugno 2026
--
-- Contesto: get_advisors (security) segnalava 8 warning del tipo
-- "Public/Signed-In Users Can Execute SECURITY DEFINER Function".
-- I trigger function non vanno mai chiamati direttamente via REST RPC, quindi
-- revochiamo EXECUTE. is_member() invece serve dentro le policy RLS e resta
-- eseguibile solo da authenticated.

-- 1) Trigger function: nessuno deve poterle invocare via /rest/v1/rpc.
--    I trigger continuano a funzionare (girano con i privilegi dell'owner).
revoke execute on function public.enforce_membership_cap() from public, anon, authenticated;
revoke execute on function public.prevent_foyer_leave()   from public, anon, authenticated;
revoke execute on function public.join_foyer_on_profile()  from public, anon, authenticated;

-- 2) is_member(uuid): EXECUTE e' concesso a PUBLIC di default. Lo revochiamo
--    da PUBLIC (cosi' sparisce anche per anon) e lo concediamo solo ad
--    authenticated, che ne ha bisogno per la valutazione delle policy RLS.
--    Rimane 1 warning "atteso" per il ruolo authenticated: la funzione e'
--    SECURITY DEFINER ma rivela soltanto l'appartenenza del chiamante stesso.
revoke execute on function public.is_member(uuid) from public;
grant  execute on function public.is_member(uuid) to authenticated;
