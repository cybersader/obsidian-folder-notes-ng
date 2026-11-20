import { expect, test } from 'bun:test';
import type { FileManager, TAbstractFile } from 'obsidian';
import { isInternalRename, renameWithoutSync } from '../../src/events/internalRename';

for (const fails of [false, true]) {
  test(`only the exact rename is suppressed, including cleanup on ${fails ? 'failure' : 'success'}`, async () => {
    const file = { path: 'Fixture/Original.md' } as TAbstractFile;
    const from = file.path;
    const to = 'Fixture/Displaced.md';
    const manager = { async renameFile() {
      file.path = to;
      expect(isInternalRename(file, from)).toBe(true);
      expect(isInternalRename(file, 'Fixture/Other.md')).toBe(false);
      expect(isInternalRename({ path: to } as TAbstractFile, from)).toBe(false);
      if (fails) throw new Error('Synthetic move failure');
    } } as unknown as FileManager;
    const operation = renameWithoutSync(manager, file, to);
    if (fails) await expect(operation).rejects.toThrow('Synthetic move failure');
    else await operation;
    expect(isInternalRename(file, from)).toBe(false);
  });
}
