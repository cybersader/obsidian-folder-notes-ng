import type { FileManager, TAbstractFile } from 'obsidian';

interface Move { from: string; to: string }
const pending = new WeakMap<TAbstractFile, Set<Move>>();

/** Match only the event for this deliberate displacement, not other edits in its folder. */
export function isInternalRename(file: TAbstractFile, oldPath: string): boolean {
	for (const move of pending.get(file) ?? []) {
		if (move.from === oldPath && move.to === file.path) return true;
	}
	return false;
}

export async function renameWithoutSync(manager: FileManager, file: TAbstractFile, to: string): Promise<void> {
	const moves = pending.get(file) ?? new Set<Move>();
	const move = { from: file.path, to };
	moves.add(move);
	pending.set(file, moves);
	try {
		await manager.renameFile(file, to);
	} finally {
		moves.delete(move);
		if (!moves.size) pending.delete(file);
	}
}
