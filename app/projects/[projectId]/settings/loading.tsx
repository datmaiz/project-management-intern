export default function Loading() {
	return (
		<div className='grid h-minus-80 w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]'>
			<div className='hidden border-r 0 md:block dark:bg-gray-950 bg-gray-100 animate-pulse'></div>
			<div className='flex-1 bg-gray-100 dark:bg-gray-950 animate-pulse'></div>
		</div>
	)
}
