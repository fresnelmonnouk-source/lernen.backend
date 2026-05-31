-- ============================================================
-- LERNEN.DE — Schéma Supabase (v2 — onboarding complet)
-- ============================================================
-- À exécuter dans le SQL Editor de Supabase

-- ============================================================
-- 1. PROFIL UTILISATEUR
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  current_level TEXT CHECK (current_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  target_certification TEXT,
  preferred_course_format TEXT CHECK (preferred_course_format IN ('short', 'standard', 'long')),
  avatar_url TEXT,
  auth_provider TEXT,
  streak_days INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  last_activity_date DATE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2-4. Tables historique (course, exam, cert)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('vocabulary', 'grammar', 'conjugation', 'spelling', 'expression', 'culture')),
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
  format TEXT NOT NULL CHECK (format IN ('short', 'standard', 'long')),
  course_data JSONB NOT NULL,
  exam_completed BOOLEAN DEFAULT FALSE,
  exam_score INTEGER CHECK (exam_score >= 0 AND exam_score <= 100),
  exam_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_course_user_date ON public.course_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_user_topic ON public.course_history(user_id, topic);

CREATE TABLE IF NOT EXISTS public.exam_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL CHECK (domain IN ('vocabulary', 'grammar', 'spelling', 'conjugation')),
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_count INTEGER NOT NULL,
  test_data JSONB NOT NULL,
  user_answers JSONB,
  results JSONB,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_exam_user_date ON public.exam_history(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.certification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
  competence TEXT NOT NULL CHECK (competence IN ('lesen', 'schreiben', 'hoeren', 'sprechen')),
  part_or_task INTEGER NOT NULL,
  test_data JSONB NOT NULL,
  user_response JSONB,
  evaluation JSONB,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_cert_user_date ON public.certification_history(user_id, created_at DESC);

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read own courses" ON public.course_history;
CREATE POLICY "Users can read own courses" ON public.course_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own courses" ON public.course_history;
CREATE POLICY "Users can insert own courses" ON public.course_history FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own courses" ON public.course_history;
CREATE POLICY "Users can update own courses" ON public.course_history FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own courses" ON public.course_history;
CREATE POLICY "Users can delete own courses" ON public.course_history FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own exams" ON public.exam_history;
CREATE POLICY "Users can read own exams" ON public.exam_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own exams" ON public.exam_history;
CREATE POLICY "Users can insert own exams" ON public.exam_history FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own exams" ON public.exam_history;
CREATE POLICY "Users can update own exams" ON public.exam_history FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own certs" ON public.certification_history;
CREATE POLICY "Users can read own certs" ON public.certification_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own certs" ON public.certification_history;
CREATE POLICY "Users can insert own certs" ON public.certification_history FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own certs" ON public.certification_history;
CREATE POLICY "Users can update own certs" ON public.certification_history FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 6. Trigger amélioré : profil créé avec nom + niveau à l'inscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name TEXT;
  v_current_level TEXT;
  v_auth_provider TEXT;
  v_avatar_url TEXT;
BEGIN
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  v_current_level := COALESCE(NEW.raw_user_meta_data->>'current_level', 'A1');
  IF v_current_level NOT IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2') THEN
    v_current_level := 'A1';
  END IF;
  
  v_auth_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';
  
  INSERT INTO public.user_profiles (
    id, display_name, current_level, auth_provider, avatar_url, onboarding_completed
  )
  VALUES (
    NEW.id, v_display_name, v_current_level, v_auth_provider, v_avatar_url,
    (NEW.raw_user_meta_data->>'display_name' IS NOT NULL 
     AND NEW.raw_user_meta_data->>'current_level' IS NOT NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. Trigger updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
