export default function Loading() {
	return (
		<div className='w-full overflow-x-auto px-2 h-[calc(100vh-65px)]'>
			<div className='w-full flex justify-between items-center gap-6 bg-white dark:bg-gray-950 border py-4 px-8 h-[60px] animate-pulse'></div>
			<div className='flex gap-1 w-full overflow-x-auto py-1'>
				<div className='flex gap-3 h-[calc(100vh-175px)]'>
					{Array.from({ length: 5 }).map((_, index) => (
						<div
							key={index}
							className='w-[350px] overflow-x-hidden h-full flex-shrink-0 bg-gray-100 dark:bg-gray-950 rounded-md border border-gray-200 dark:border-gray-800 flex flex-col animate-pulse'
						></div>
					))}
				</div>
			</div>
		</div>
	)
}
