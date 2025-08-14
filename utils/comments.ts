import { getSupabase } from './supabase/supabase'

export const comments = {
	// Get all comments for a task
	getTaskComments: async (taskId: string) => {
		const supabase = await getSupabase()
		const { data, error } = await supabase
			.from('comments')
			.select(
				`
        id,
        content,
        created_at,
        updated_at,
        task_id,
        user:user_id (
          id,
          name,
          avatar,
          description,
          links
        )
      `
			)
			.eq('task_id', taskId)
			.order('created_at', { ascending: true }) // Show oldest comments first

		if (error) throw error
		return data as CommentResponse[]
	},

	// Create a new comment
	create: async (comment: { task_id: string; user_id: string; content: string }) => {
		const supabase = await getSupabase()
		const { data, error } = await supabase
			.from('comments')
			.insert({
				...comment,
			})
			.select(
				`
        id,
        content,
        created_at,
        updated_at,
        task_id,
        user:user_id (
          id,
          name,
          avatar,
          description,
          links
        )
      `
			)
			.single()

		if (error) throw error
		return data as CommentResponse
	},

	// Delete a comment
	delete: async (commentId: string) => {
		const supabase = await getSupabase()
		const { error } = await supabase.from('comments').delete().eq('id', commentId)

		if (error) throw error
	},

	// Update a comment
	update: async (commentId: string, updates: { content: string }) => {
		const supabase = await getSupabase()
		const { data, error } = await supabase
			.from('comments')
			.update({
				...updates,
				updated_at: new Date().toISOString(),
			})
			.eq('id', commentId)
			.select(
				`
        id,
        content,
        created_at,
        updated_at,
        task_id,
        user:user_id (
          id,
          name,
          avatar,
          description,
          links
        )
      `
			)
			.single()

		if (error) throw error
		return data as CommentResponse
	},
}
