-- Verificar que el stripe_customer_id se guardó correctamente
SELECT 
  u.email,
  p.is_premium,
  p.stripe_customer_id,
  p.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'angeldcchp94@gmail.com';

-- Debe mostrar tu customer ID (cus_...) en stripe_customer_id

