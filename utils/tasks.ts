import { DateUpdates } from '@/hooks/useTaskQueries'
import { getSupabase } from './supabase/supabase'

type BoardRow = {
	id: string
	project_id: string
	title: string
	status_id: string
	statusPosition: number | null
	creator: { id: string; name: string | null; avatar: string | null } | null
	size?: { id: string; label: string; color: string | null } | null
	priority?: { id: string; label: string; color: string | null; order: number | null } | null
	labels: Array<{ id: string; label: string; color: string | null }>
	assignees: Array<{ id: string; name: string | null; avatar: string | null; description?: string | null; links?: any }>
}

type TaskDetails = BoardRow & {
	description?: string | null
	startDate?: string | null
	endDate?: string | null
}

export const tasks = {
	// Board-related operations
	board: {
		getProjectTasks: async (projectId: string) => {
			const supabase = await getSupabase()
			const { data, error } = await supabase.rpc('get_project_board', { p_project_id: projectId })
			if (error) throw error
			// data là jsonb[] → ép kiểu
			return (data ?? []) as unknown as BoardRow[]
		},

		updatePosition: async (taskId: string, statusPosition: number) => {
			const supabase = await getSupabase()
			const { data, error } = await supabase
				.from('tasks')
				.update({
					statusPosition,
					updated_at: new Date(),
				})
				.eq('id', taskId)
				.select('*')
				.single()

			if (error) throw error
			return data as ITask
		},

		moveTask: async (taskId: string, statusId: string, statusPosition: number) => {
			const supabase = await getSupabase()
			const { data, error } = await supabase
				.from('tasks')
				.update({
					status_id: statusId,
					statusPosition,
					updated_at: new Date(),
				})
				.eq('id', taskId)
				.select('*')
				.single()

			if (error) throw error
			return data as ITask
		},
	},

	// Task details operations
	details: {
		get: async (taskId: string) => {
			const supabase = await getSupabase()
			const { data, error } = await supabase.rpc('get_task_details', { p_task_id: taskId })
			if (error) throw error
			if (!data) throw new Error('Task not found')
			return data as unknown as ITaskWithOptions
		},

		update: async (taskId: string, updates: Partial<ITask>) => {
			const supabase = await getSupabase()
			// Handle task_labels junction table
			if ('labels' in updates) {
				const labelIds = updates.labels || []
				delete updates.labels // Remove from main task update

				// First delete existing task-label relationships
				await supabase.from('task_labels').delete().eq('task_id', taskId)

				// Then insert new ones if any
				if (labelIds.length > 0) {
					await supabase.from('task_labels').insert(
						labelIds.map(labelId => ({
							task_id: taskId,
							label_id: labelId,
							created_at: new Date(),
							updated_at: new Date(),
						}))
					)
				}
			}

			// Handle task_assignees junction table (existing code)
			if ('assignees' in updates) {
				// Get the array of assignee IDs, or empty array if none provided
				const assigneeIds = updates.assignees || []
				// Remove assignees from updates object since we handle it separately
				delete updates.assignees

				// Delete all existing task-assignee relationships for this task
				await supabase.from('task_assignees').delete().eq('task_id', taskId)

				// If there are new assignees to add
				if (assigneeIds.length > 0) {
					// Insert new task-assignee relationships
					await supabase.from('task_assignees').insert(
						// Map each assignee ID to a task-assignee relationship object
						assigneeIds.map(userId => ({
							task_id: taskId, // The task being updated
							user_id: userId, // The user being assigned
						}))
					)
				}
			}

			// Update main task if there are any direct table updates
			if (Object.keys(updates).length > 0) {
				const { data, error } = await supabase
					.from('tasks')
					.update({ ...updates, updated_at: new Date() })
					.eq('id', taskId)
					.select('*')
					.maybeSingle()

				if (error) throw error
				return data as ITask
			}

			return null
		},

		delete: async (taskId: string) => {
			const supabase = await getSupabase()
			const { error } = await supabase.from('tasks').delete().eq('id', taskId)
			if (error) throw error
		},

		updateDates: async (taskId: string, dates: DateUpdates) => {
			const supabase = await getSupabase()
			const { data, error } = await supabase
				.from('tasks')
				.update({
					startDate: dates.startDate,
					endDate: dates.endDate,
					updated_at: new Date().toISOString(),
				})
				.eq('id', taskId)
				.select('*')
				.maybeSingle()

			if (error) throw error
			return data as ITask
		},
	},

	// Task creation
	create: async (task: Partial<ITask>) => {
		const supabase = await getSupabase()
		const { data: createdTask, error } = await supabase
			.from('tasks')
			.insert(task)
			.select(
				`
        *,
        creator:created_by (
          id,
          name,
          avatar
        )
      `
			)
			.single()

		if (error) throw error
		return createdTask as ITaskWithOptions
	},
}
