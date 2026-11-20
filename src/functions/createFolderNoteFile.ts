import { TFile } from 'obsidian';
import type FolderNotesPlugin from '../main';
import { getDefaultTemplate } from './excalidraw';

export function isTextTemplate(extension: string): boolean {
	return ['md', 'canvas', 'txt'].includes(extension);
}

/** Write the note once. Opening the resulting file belongs to the caller. */
export async function createFolderNoteFile(
	plugin: FolderNotesPlugin,
	folderNoteType: string,
	path: string,
	extension: string,
): Promise<TFile> {
	const { vault } = plugin.app;
	const { templatePath } = plugin.settings;
	let content = '';
	if (extension !== '.md' && extension) {
		if (templatePath && folderNoteType.split('.').pop() === templatePath.split('.').pop()) {
			const template = vault.getAbstractFileByPath(templatePath);
			if (template instanceof TFile) {
				if (!isTextTemplate(template.extension)) {
					return vault.createBinary(path, await vault.readBinary(template));
				}
				content = await vault.read(template);
				if (extension === '.excalidraw' && !content.includes(
					'==⚠  Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this activeDocument. ⚠==',
				)) {
					content = await getDefaultTemplate(plugin.app);
				}
			}
		} else if (plugin.settings.folderNoteType === '.excalidraw' || extension === '.excalidraw') {
			content = await getDefaultTemplate(plugin.app);
		} else if (plugin.settings.folderNoteType === '.canvas') {
			content = '{}';
		}
	}
	return vault.create(path, content);
}
