-- ============================================================
-- Vesper — Fix: public_profiles con security_invoker = on
-- Problema: la view ereditava l'RLS di profiles (id = auth.uid()),
-- quindi restituiva solo il profilo del chiamante — profili altrui
-- risultavano "non trovati" nell'app.
-- Fix: ricreare senza security_invoker → la view gira come owner
-- (postgres), bypassa l'RLS della tabella, restituisce tutti i
-- profili con il masking show_* intatto.
-- La tabella profiles rimane protetta da accesso diretto via RLS.
-- ============================================================

drop view if exists public.public_profiles cascade;

create view public.public_profiles as
select
  p.id,
  p.nickname,
  p.avatar_preset,
  p.accent_color,
  p.bio,
  p.interests,

  case when p.show_age
    then extract(year from age(p.birth_date))::int
  end                                               as age,

  case when p.show_birth_date then p.birth_date end as birth_date,

  case when p.show_identity then p.identity_category end as identity_category,

  case when p.show_orientation then p.orientations end as orientations,

  case when p.show_city then p.city          end as city,
  case when p.show_city then p.city_province end as city_province,
  case when p.show_city then p.city_region   end as city_region,

  case when p.show_pronouns then p.pronouns end as pronouns,

  case when p.show_intents then p.intents end as intents,

  case when p.show_relationship then p.relationship_status end as relationship_status,
  case when p.show_relationship then p.relationship_type   end as relationship_type,

  case when p.show_diet     then p.diet     end as diet,
  case when p.show_religion then p.religion end as religion,
  case when p.show_politics then p.politics end as politics,
  case when p.show_smoking  then p.smoking  end as smoking,
  case when p.show_sport    then p.sport    end as sport,

  case when p.show_zodiac
    then public.zodiac_from_date(p.birth_date)
  end                                               as zodiac,

  (p.id = auth.uid())                               as is_self

from public.profiles p;

comment on view public.public_profiles is
  'Profili pubblici con masking dei campi basato sui flag show_*. '
  'Non espone strato, dm_filter, dati di moderazione. '
  'Gira come owner (no security_invoker) per bypassare l''RLS '
  'restrittiva della tabella profiles.';

-- Accesso in lettura agli utenti autenticati
grant select on public.public_profiles to authenticated;
