/**
 * Supabase 客户端
 * 使用 service_role key（服务端，绕过 RLS），仅供 /api 函数使用。
 * 环境变量在 Vercel 控制台设置：SUPABASE_URL、SUPABASE_SERVICE_ROLE
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceRole) {
  console.warn('[supabase] 环境变量未配置，数据存储将不可用')
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  serviceRole || 'placeholder',
  { auth: { persistSession: false, autoRefreshToken: false } },
)
