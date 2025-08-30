import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
	return (
		<div className='flex flex-col items-center justify-center min-h-screen p-4'>
			<div className='text-center space-y-4'>
				<h1 className='text-4xl font-bold text-muted-foreground'>404</h1>
				<h2 className='text-xl font-semibold'>Invalid Invite Link</h2>
				<p className='text-muted-foreground max-w-md'>
					This invite link is either invalid, expired, or has already been used.
				</p>
				<Button asChild>
					<Link href='/projects'>Go to Projects</Link>
				</Button>
			</div>
		</div>
	)
}
