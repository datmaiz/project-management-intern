import { createClient } from '@/utils/supabase/client'

export interface InviteToken {
	id: string
	project_id: string
	role: Role
	invited_by: string
	expires_at: string
	used: boolean
	created_at: string
}

export const inviteUtils = {
	async createInviteLink(projectId: string, role: Role, invitedBy: string): Promise<string> {
		const supabase = createClient()

		// Create a unique token
		const token = crypto.randomUUID()

		// Set expiration to 7 days from now
		const expiresAt = new Date()
		expiresAt.setDate(expiresAt.getDate() + 7)

		// Store the invite token in database
		const { error } = await supabase.from('invite_tokens').insert({
			id: token,

			project_id: projectId,
			role,
			used: false,
		})

		if (error) throw error

		// Return the invite link
		return `${window.location.origin}/invite/${token}`
	},

	async validateInviteToken(token: string): Promise<InviteToken | null> {
		const supabase = createClient()

		const { data, error } = await supabase
			.from('invite_tokens')
			.select('*')
			.eq('id', token)
			.eq('used', false)
			.gt('expires_at', new Date().toISOString())
			.single()

		if (error || !data) return null

		return data as InviteToken
	},

	async useInviteToken(token: string, userId: string): Promise<boolean> {
		const supabase = createClient()

		const inviteToken = await this.validateInviteToken(token)
		if (!inviteToken) return false

		// Check if user is already a member
		const { data: existingMember } = await supabase
			.from('project_members')
			.select('id')
			.eq('project_id', inviteToken.project_id)
			.eq('user_id', userId)
			.maybeSingle()

		if (existingMember) return false

		// Add user to project
		const { error: memberError } = await supabase.from('project_members').insert({
			id: crypto.randomUUID(),
			project_id: inviteToken.project_id,
			user_id: userId,
			role: inviteToken.role,
			invitationStatus: 'accepted',
			joined_at: new Date().toISOString(),
		})

		if (memberError) throw memberError

		// Mark token as used
		const { error: tokenError } = await supabase.from('invite_tokens').update({ used: true }).eq('id', token)

		if (tokenError) throw tokenError

		return true
	},
}
