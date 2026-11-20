/** Report rejections at event boundaries where Obsidian does not await callbacks. */
export function reportAsyncError(error: unknown): void {
	console.error('Folder Notes: operation failed', error);
}
