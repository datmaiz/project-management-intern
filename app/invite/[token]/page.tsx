import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'

interface Props {
	params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
	const supabase = await createClient()
	const { token } = await params

	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) redirect(`/login?next=/invite/${token}`)

	// (tuỳ chọn) kiểm tra token để hiển thị tên project trước khi accept
	const { data: info, error: infoErr } = await supabase.rpc('resolve_invite_public', { p_token: token })
	if (infoErr || !info || info.length === 0) notFound()

	// Chấp nhận lời mời (RPC sẽ thêm member + đánh dấu used)
	const { data: projectId, error: acceptErr } = await supabase.rpc('accept_invite', { p_token: token })

	if (acceptErr || !projectId) throw acceptErr ?? new Error('Accept failed')

	redirect(`/projects/${projectId}`)
}
