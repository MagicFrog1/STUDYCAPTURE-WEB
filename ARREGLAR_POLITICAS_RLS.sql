-- ========================================
-- ARREGLAR POLÍTICAS RLS DE SUPABASE
-- Error 403 - Forbidden
-- ========================================

-- PASO 1: Eliminar todas las políticas restrictivas actuales
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can update any profile" ON profiles;

-- PASO 2: Crear políticas más permisivas y correctas

-- Permitir que usuarios vean su propio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- Permitir que usuarios creen su propio perfil
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Permitir que usuarios eliminen su propio perfil
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
USING (auth.uid() = user_id);

-- IMPORTANTE: Permitir que el service role (webhooks de Stripe) actualice cualquier perfil
CREATE POLICY "Service role can manage all profiles"
ON profiles FOR ALL
USING (
  auth.jwt() ->> 'role' = 'service_role'
);

-- PASO 3: Verificar que RLS esté habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver todas las políticas de la tabla profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Verificar tu perfil
SELECT 
  u.email,
  p.is_premium,
  p.stripe_customer_id,
  p.created_at,
  p.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'angeldcchp94@gmail.com';

