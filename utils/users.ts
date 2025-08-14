import type { User } from '@supabase/supabase-js'
import { getSupabase } from './supabase/supabase'

export interface IUserLink {
	id: string
	label: string
	url: string
}

export interface IUser {
	id: string
	email: string
	name: string
	description: string
	avatar: string
	created_at: Date
	updated_at: Date
	links: IUserLink[]
	provider: 'google' | 'github' | 'email'
}

export const users = {
	async getUser(id: string) {
		const supabase = await getSupabase()
		const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()

		if (error) throw error
		return data as IUser | null
	},

	async createUser(user: Partial<IUser>) {
		const supabase = await getSupabase()
		const { data, error } = await supabase.from('users').insert([user]).select().single()

		if (error) throw error
		return data as IUser
	},

	async captureUserDetails(authUser: User) {
		// Check if user already exists
		const existingUser = await this.getUser(authUser.id).catch(() => null)
		if (existingUser) return existingUser

		// Extract provider
		const provider = authUser.app_metadata.provider as IUser['provider']

		// Create new user
		const newUser: Partial<IUser> = {
			id: authUser.id,
			email: authUser.email!,
			name: authUser.user_metadata.full_name || authUser.email!.split('@')[0],
			avatar: authUser.user_metadata.avatar_url || '',
			description: '',
			provider,
			links: [],
		}

		return await this.createUser(newUser)
	},

	async updateUser(id: string, updates: Partial<IUser>) {
		const supabase = await getSupabase()
		const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single()

		if (error) throw error
		return data as IUser
	},

	async updateProfile(_userId: string, updates: Partial<Omit<IUser, 'id' | 'email' | 'provider'>>) {
		const supabase = await getSupabase()

		// Lấy user hiện tại để chắc có session & đúng id
		const {
			data: { user },
			error: uErr,
		} = await supabase.auth.getUser()
		if (uErr) throw uErr
		if (!user) throw new Error('Not authenticated')

		const { data, error } = await supabase
			.from('users')
			.update({
				name: updates.name,
				avatar: updates.avatar,
				description: updates.description,
				links: updates.links, // đúng kiểu cột của bạn
			})
			.eq('id', user.id) // 🔑 phải đúng auth.uid() để pass policy
			.select('id, name, email, avatar, description, links, updated_at')
			.maybeSingle()

		if (error) throw error
		if (!data) throw new Error('No row updated (check RLS / wrong id)')

		// Đồng bộ metadata auth (tùy chọn)
		const meta: { avatar_url?: string; full_name?: string } = {}
		if (updates.avatar !== undefined) meta.avatar_url = updates.avatar as string
		if (updates.name !== undefined) meta.full_name = updates.name as string
		if (Object.keys(meta).length) {
			const { error: authError } = await supabase.auth.updateUser({ data: meta })
			if (authError) console.warn('auth.updateUser failed:', authError.message)
		}

		return data
	},
}
