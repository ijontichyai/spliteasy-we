CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  avatar_url text CHECK (avatar_url IS NULL OR avatar_url ~ '^https://'),
  locale text NOT NULL DEFAULT 'es' CHECK (locale IN ('es','en')),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- prevent users from changing protected columns
CREATE OR REPLACE FUNCTION public.profiles_protect_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.created_at <> OLD.created_at OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    IF current_user = 'authenticated' THEN RAISE EXCEPTION 'protected column'; END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER profiles_protect BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_columns();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_locale text;
BEGIN
  v_name := left(coalesce(nullif(trim(NEW.raw_user_meta_data->>'display_name'),''), split_part(NEW.email,'@',1), 'user'), 80);
  v_locale := CASE WHEN NEW.raw_user_meta_data->>'locale' = 'en' THEN 'en' ELSE 'es' END;
  INSERT INTO public.profiles (id, display_name, locale) VALUES (NEW.id, v_name, v_locale)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.plan_limits (
  tier text PRIMARY KEY CHECK (tier IN ('free','premium')),
  max_active_owned_plans int,
  max_members_per_plan int,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plan_limits TO authenticated;
GRANT ALL ON public.plan_limits TO service_role;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read limits" ON public.plan_limits FOR SELECT TO authenticated USING (true);
INSERT INTO public.plan_limits (tier, max_active_owned_plans, max_members_per_plan, features) VALUES
 ('free', 1, 4, '{"places_api":false,"ai":false,"votes":false,"itinerary":false,"pdf":false}'),
 ('premium', NULL, NULL, '{"places_api":true,"ai":true,"votes":true,"itinerary":true,"pdf":true}');