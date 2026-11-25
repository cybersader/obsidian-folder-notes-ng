/**
 * Attachment-folder recognition across Obsidian's setting and attachment
 * managers. Pure helpers plus a stand-in app; no Obsidian runtime needed.
 */
import { describe, expect, test } from 'bun:test';
import type { App } from 'obsidian';
import {
	getAttachmentLocationRules, isAttachmentFolder, isInAttachmentFolder, matchesAttachmentFolder,
} from '../../src/functions/attachmentFolders';

const is = (rules: string[], path: string): boolean => matchesAttachmentFolder(rules, path);

describe('matchesAttachmentFolder', () => {
	test('a relative folder rule matches that folder name at any depth', () => {
		expect(is(['./_attachments'], '_attachments')).toBe(true);
		expect(is(['./_attachments'], 'Area/_attachments')).toBe(true);
		expect(is(['./_attachments'], 'Area/Deep/_attachments')).toBe(true);
	});

	test('it does not match similar names or the folder holding the attachments', () => {
		expect(is(['./_attachments'], 'Area')).toBe(false);
		expect(is(['./_attachments'], 'Area/my_attachments')).toBe(false);
		expect(is(['./_attachments'], 'Area/_attachments-old')).toBe(false);
	});

	test('folders inside an attachment folder are attachment storage too', () => {
		expect(is(['./_attachments'], 'Area/_attachments/screens')).toBe(true);
		expect(is(['Attachments'], 'Attachments/2031')).toBe(true);
	});

	test('rules that name no separate folder match nothing', () => {
		for (const rule of ['', '/', './', '.', '../shared', '${noteFileName}', './${noteFileName}']) {
			expect(is([rule], 'Area')).toBe(false);
			expect(is([rule], 'Area/Note')).toBe(false);
		}
	});

	test('an absolute rule matches only that path and its contents', () => {
		expect(is(['Attachments'], 'Attachments')).toBe(true);
		expect(is(['Attachments'], 'Area/Attachments')).toBe(false);
		expect(is(['Media/Files'], 'Media')).toBe(true);
		expect(is(['Media/Files'], 'Media/Files')).toBe(true);
		expect(is(['Media/Files'], 'Area/Media')).toBe(false);
	});

	test('placeholders match one folder name, and leading folders count', () => {
		const rule = './assets/${noteFileName}';
		expect(is([rule], 'Area/assets/Note')).toBe(true);
		expect(is([rule], 'Area/assets')).toBe(true);
		expect(is([rule], 'Area/Note')).toBe(false);
		expect(is(['./${noteFileName}.assets'], 'Area/Note.assets')).toBe(true);
		expect(is(['./${noteFileName}.assets'], 'Area/Note')).toBe(false);
	});

	test('regex characters in folder names are literal', () => {
		expect(is(['./(files)'], 'Area/(files)')).toBe(true);
		expect(is(['./a.b'], 'Area/aXb')).toBe(false);
	});

	test('any one of several rules is enough', () => {
		expect(is(['./', './_attachments'], 'Area/_attachments')).toBe(true);
		expect(is(['./attachments', './_attachments'], 'Area/attachments')).toBe(true);
	});

	test('the vault root is never an attachment folder', () => {
		expect(is(['./_attachments'], '')).toBe(false);
		expect(is(['./_attachments'], '/')).toBe(false);
	});
});

function fakeApp(core: string, custom?: { enabled: boolean; rule: unknown }): App {
	return {
		vault: { getConfig: (key: string) => (key === 'attachmentFolderPath' ? core : undefined) },
		plugins: {
			enabledPlugins: new Set(custom?.enabled ? ['obsidian-custom-attachment-location'] : []),
			plugins: custom ? { 'obsidian-custom-attachment-location': { settings: { attachmentFolderPath: custom.rule } } } : {},
		},
	} as unknown as App;
}

describe('rules in effect', () => {
	test('the owner configuration: Obsidian set to ./, the manager to ./_attachments', () => {
		const app = fakeApp('./', { enabled: true, rule: './_attachments' });
		expect(getAttachmentLocationRules(app)).toEqual(['./', './_attachments']);
		expect(isAttachmentFolder(app, 'Bare/_attachments')).toBe(true);
		expect(isAttachmentFolder(app, 'Bare')).toBe(false);
		expect(isInAttachmentFolder(app, 'Bare/_attachments/Pasted A.png')).toBe(true);
		expect(isInAttachmentFolder(app, 'Bare/Bare.md')).toBe(false);
	});

	test('a disabled manager\'s rule is ignored', () => {
		const app = fakeApp('./', { enabled: false, rule: './_attachments' });
		expect(isAttachmentFolder(app, 'Bare/_attachments')).toBe(false);
	});

	test('Obsidian\'s own setting still works without a manager', () => {
		expect(isAttachmentFolder(fakeApp('./attachments'), 'Area/attachments')).toBe(true);
		expect(isAttachmentFolder(fakeApp('Attachments'), 'Attachments')).toBe(true);
	});

	test('an unreadable manager setting is ignored rather than guessed', () => {
		const app = fakeApp('./', { enabled: true, rule: 42 });
		expect(getAttachmentLocationRules(app)).toEqual(['./']);
	});

	test('files at the vault root are not in an attachment folder', () => {
		expect(isInAttachmentFolder(fakeApp('./', { enabled: true, rule: './_attachments' }), 'Pasted.png')).toBe(false);
	});
});
