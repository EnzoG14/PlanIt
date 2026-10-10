-- Función interna de event trigger: no es una API del navegador.
-- Conservar public.rls_auto_enable(), su propietario y ensure_rls.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
