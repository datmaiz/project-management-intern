'use client'
import { successBtnStyles } from '@/app/commonStyles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { Copy, Share } from 'lucide-react'
import { useState, useEffect } from 'react'
import { RoleSelect } from './RoleSelect'
import { inviteUtils } from '@/utils/invites'

interface Props {
	projectName: string
	projectId: string
	currentUserRole: Role
	createdBy: string
}

export const InviteUsers = ({ projectName, projectId, currentUserRole, createdBy }: Props) => {
	const [role, setRole] = useState<Role>('read')
	const [isGenerating, setIsGenerating] = useState(false)
	const [inviteLink, setInviteLink] = useState('')
	const { toast } = useToast()
	const [currentUser, setCurrentUser] = useState<IUser | null>(null)

	useEffect(() => {
		async function getUser() {
			const supabase = createClient()
			const {
				data: { session },
			} = await supabase.auth.getSession()
			if (session) {
				const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single()
				setCurrentUser(data)
			}
		}
		getUser()
	}, [])

	const handleGenerateLink = async () => {
		if (!currentUser) return

		try {
			setIsGenerating(true)
			const link = await inviteUtils.createInviteLink(projectId, role, currentUser.id)
			setInviteLink(link)

			toast({
				title: 'Success',
				description: 'Invite link generated successfully',
			})
		} catch (error) {
			console.error('Error generating invite link:', error)
			toast({
				variant: 'destructive',
				title: 'Error',
				description: 'Failed to generate invite link',
			})
		} finally {
			setIsGenerating(false)
		}
	}

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(inviteLink)
			toast({
				title: 'Copied!',
				description: 'Invite link copied to clipboard',
			})
		} catch (error) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description: 'Failed to copy link',
			})
		}
	}

	const handleShareLink = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: `Join ${projectName} on ProjeX`,
					text: `You've been invited to join ${projectName}`,
					url: inviteLink,
				})
			} catch (error) {
				// User cancelled sharing or share not supported
				handleCopyLink()
			}
		} else {
			handleCopyLink()
		}
	}

	if (currentUserRole !== 'admin') {
		return null
	}

	return (
		<div className='py-8'>
			<h1 className='text-xl mb-4'>Invite users</h1>
			<div className='space-y-4'>
				<div className='flex items-center gap-2'>
					<RoleSelect
						value={role}
						onValueChange={setRole}
					/>
					<Button
						onClick={handleGenerateLink}
						className={cn(successBtnStyles, 'px-3')}
						disabled={isGenerating}
					>
						{isGenerating ? 'Generating...' : 'Generate Invite Link'}
					</Button>
				</div>

				{inviteLink && (
					<div className='space-y-2'>
						<div className='flex items-center gap-2'>
							<Input
								value={inviteLink}
								readOnly
								className='flex-1'
							/>
							<Button
								variant='outline'
								size='sm'
								onClick={handleCopyLink}
								className='px-3'
							>
								<Copy className='h-4 w-4' />
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={handleShareLink}
								className='px-3'
							>
								<Share className='h-4 w-4' />
							</Button>
						</div>
						<p className='text-xs text-muted-foreground'>This link will expire in 7 days and can only be used once.</p>
					</div>
				)}
			</div>
		</div>
	)
}
