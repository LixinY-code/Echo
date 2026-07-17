// Supabase 客户端（CommonJS）
// 用 dynamic import 加载 @supabase/supabase-js，兼容 ESM/CJS。
// service_role key 仅服务端，绕过 RLS。环境变量在 Vercel 设置。

let _supabase = null

async function getSupabase() {
  if (_supabase) return _supabase
  const { createClient } = await import('@supabase/supabase-js')

  const url = process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE

  if (!url || !serviceRole) {
    console.warn('[supabase] 环境变量未配置，数据存储将不可用')
  }

  _supabase = createClient(
    url || 'https://placeholder.supabase.co',
    serviceRole || 'placeholder',
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  return _supabase
}

module.exports = { getSupabase }
