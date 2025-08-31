import { createClient } from './supabase/client'
import { getSupabase } from './supabase/supabase'

const supabase = createClient()

export const columns = {
	async updateLimit(columnId: string, limit: number) {
		const { data, error } = await supabase.from('statuses').update({ limit }).eq('id', columnId).select().maybeSingle()

		if (error) throw error
		return data
	},

	async createColumn(projectId: string, columnData: Omit<ICustomFieldData, 'id'>) {
		const { data, error } = await supabase
			.from('statuses')
			.insert({
				...columnData,
				project_id: projectId,
				updated_at: new Date(),
			})
			.select()
			.single()

		if (error) throw error
		return data
	},

	async updateDetails(columnId: string, updates: Omit<ICustomFieldData, 'id'>) {
		const { data, error } = await supabase
			.from('statuses')
			.update({
				...updates,
				updated_at: new Date(),
			})
			.eq('id', columnId)
			.select()
			.single()

		if (error) throw error
		return data
	},

	async deleteColumn(columnId: string) {
		const { error } = await supabase.from('statuses').delete().eq('id', columnId)

		if (error) throw error
	},

	async getNextOrder(projectId: string) {
		const supabase = await getSupabase()
		const { data, error } = await supabase
			.from('statuses')
			.select('order')
			.eq('project_id', projectId)
			.order('order', { ascending: false })
			.limit(1)
			.single()

		if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
		return (data?.order ?? -1) + 1
	},
}
