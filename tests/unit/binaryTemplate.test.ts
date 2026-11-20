import { expect, mock, test } from 'bun:test';
import type FolderNotesPlugin from '../../src/main';

class FixtureFile { extension = 'pdf'; }
mock.module('obsidian', () => ({ TFile: FixtureFile }));
const { createFolderNoteFile } = await import('../../src/functions/createFolderNoteFile');

test('a binary template creates exactly one file with unchanged bytes', async () => {
  const template = new FixtureFile();
  const created = new FixtureFile();
  const bytes = Uint8Array.from([0, 255, 13, 10, 128]);
  const vault = {
    getAbstractFileByPath: () => template,
    readBinary: mock(async () => bytes.buffer),
    createBinary: mock(async () => created),
    create: mock(async () => new FixtureFile()),
  };
  const plugin = { settings: { templatePath: 'Templates/Sample.pdf' }, app: { vault } } as unknown as FolderNotesPlugin;
  const path = 'Sample/Sample.pdf';
  const result = await createFolderNoteFile(plugin, '.pdf', path, '.pdf');
  expect(vault.create).not.toHaveBeenCalled();
  expect(vault.readBinary).toHaveBeenCalledWith(template);
  expect(vault.createBinary).toHaveBeenCalledTimes(1);
  expect(vault.createBinary).toHaveBeenCalledWith(path, bytes.buffer);
  expect(result).toBe(created);
});
