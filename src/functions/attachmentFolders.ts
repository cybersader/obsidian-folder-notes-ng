import type { App } from 'obsidian';

/**
 * Attachment folders are storage for a note's files, not topics in their own
 * right, so they never get a folder note of their own.
 *
 * Obsidian's own setting is not the whole story: Custom Attachment Location
 * replaces it with its own rule, such as `./_attachments`, which Obsidian's
 * setting never mentions. This module reads the rules instead of asking
 * Obsidian to resolve an attachment path. With that plugin enabled, resolving a
 * path creates the attachment folder as a side effect.
 */

const CUSTOM_ATTACHMENT_LOCATION = 'obsidian-custom-attachment-location';

interface PluginRegistry {
	enabledPlugins: Set<string>;
	plugins: Record<string, { settings?: { attachmentFolderPath?: unknown } } | undefined>;
}

/** Every attachment location currently in effect, as written by the user. */
export function getAttachmentLocationRules(app: App): string[] {
	const rules: string[] = [];
	const core = app.vault.getConfig('attachmentFolderPath');
	if (typeof core === 'string') rules.push(core);
	const registry = (app as unknown as { plugins?: PluginRegistry }).plugins;
	if (registry?.enabledPlugins?.has(CUSTOM_ATTACHMENT_LOCATION)) {
		const custom = registry.plugins[CUSTOM_ATTACHMENT_LOCATION]?.settings?.attachmentFolderPath;
		if (typeof custom === 'string') rules.push(custom);
	}
	return rules;
}

const TOKEN = /\$\{[^}]*\}/g;

/**
 * Turns one location rule into tests for folder paths: the full location and
 * each leading part of it, since `./assets/${noteFileName}` creates `assets`
 * first. Gives nothing when the rule names no separate folder (vault root, or
 * "same folder as the note"), and skips any part made only of placeholders,
 * which would match every folder.
 */
function ruleToPatterns(rule: string): RegExp[] {
	let path = rule.trim().replace(/\\/g, '/');
	const relative = path === '.' || path.startsWith('./');
	path = path.replace(/^\.\/?/, '').replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/');
	const segments = path ? path.split('/') : [];
	if (segments.includes('..')) return [];
	const patterns: RegExp[] = [];
	for (let i = 1; i <= segments.length; i++) {
		const prefix = segments.slice(0, i).join('/');
		if (!prefix.replace(TOKEN, '').replace(/\//g, '').trim()) continue;
		const body = prefix
			.split(TOKEN)
			.map((literal) => literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
			.join('[^/]+');
		patterns.push(new RegExp(relative ? `(^|/)${body}$` : `^${body}$`));
	}
	return patterns;
}

/**
 * True when the folder, or one of its ancestors, is an attachment location
 * under any of the rules. Pure, so it can be tested without Obsidian.
 */
export function matchesAttachmentFolder(rules: string[], folderPath: string): boolean {
	const patterns = rules.flatMap(ruleToPatterns);
	if (!patterns.length || !folderPath || folderPath === '/') return false;
	const parts = folderPath.split('/');
	for (let i = parts.length; i > 0; i--) {
		const candidate = parts.slice(0, i).join('/');
		if (patterns.some((p) => p.test(candidate))) return true;
	}
	return false;
}

export function isAttachmentFolder(app: App, folderPath: string): boolean {
	return matchesAttachmentFolder(getAttachmentLocationRules(app), folderPath);
}

/** True when the file is stored inside an attachment folder. */
export function isInAttachmentFolder(app: App, filePath: string): boolean {
	const parent = filePath.includes('/') ? filePath.slice(0, filePath.lastIndexOf('/')) : '';
	return isAttachmentFolder(app, parent);
}
