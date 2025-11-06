-- ========================================
-- PASO 1: Crear tabla profiles si no existe
-- ========================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Permitir que webhooks (service role) actualicen perfiles
DROP POLICY IF EXISTS "Service role can update any profile" ON profiles;
CREATE POLICY "Service role can update any profile" ON profiles
  FOR UPDATE USING (true);

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- PASO 2: Crear tu perfil (si no existe)
-- ========================================

INSERT INTO profiles (user_id, is_premium, stripe_customer_id)
SELECT 
  id,
  false,
  NULL
FROM auth.users
WHERE email = 'angeldcchp94@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- PASO 3: ACTIVAR PREMIUM (MUY IMPORTANTE)
-- ========================================

UPDATE profiles
SET is_premium = true, updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'angeldcchp94@gmail.com'
);

-- ========================================
-- VERIFICAR QUE FUNCIONÓ
-- ========================================

SELECT 
  u.email,
  p.is_premium,
  p.stripe_customer_id,
  p.created_at,
  p.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'angeldcchp94@gmail.com';

-- Si is_premium = true, ¡funcionó! 🎉

