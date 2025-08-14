import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

export async function getSupabase(): Promise<SupabaseClient<any, 'public', any>> {
	if (typeof window !== 'undefined') {
		if (browserClient) return browserClient
		const { createBrowserClient } = await import('@supabase/ssr')
		browserClient = createBrowserClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
		)
		return browserClient
	}

	const { createServerClient } = await import('@supabase/ssr')
	const { cookies } = await import('next/headers')
	const cookieStore = await cookies()

	return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
		cookies: {
			getAll() {
				return cookieStore.getAll()
			},
			setAll(list) {
				try {
					list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
				} catch {}
			},
		},
	})
}
