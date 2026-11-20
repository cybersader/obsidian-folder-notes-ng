/**
 * visual-settings.spec.ts — proves the "Sync safety" settings UI actually renders
 * in real Obsidian (not just that it compiles), and captures a screenshot.
 *
 * Run: `npm run e2e`  → screenshot at test-results/settings-sync-safety.png
 */

import { browser } from '@wdio/globals';
import { expect } from 'expect';
import { saveAppScreenshot } from './settings-screenshot';

describe('Sync safety settings UI', function () {
  it('renders the heading, all four toggles, and both sliders', async function () {
    // Enable auto-create + the guard so the whole section is visible, then open the tab.
    await browser.executeObsidian(async ({ app }: any) => {
      const plugin = app.plugins.plugins['folder-notes'];
      plugin.settings.autoCreate = true;
      plugin.settings.syncSafeAutoCreate = true;
      if (typeof plugin.saveSettings === 'function') await plugin.saveSettings();
      await app.setting.open();
      await app.setting.openTabById('folder-notes');
    });

    await browser.pause(600); // let the tab render

    const found = await browser.executeObsidian(({ app }: any) => {
      // Newer Obsidian versions mount Settings in a separate window.
      const container: HTMLElement = app.plugins.plugins['folder-notes'].settingsTab.containerEl;
      const names = Array.from(container.querySelectorAll('.setting-item-name')).map((e) => (e.textContent || '').trim());
      const heading = Array.from(container.querySelectorAll('.setting-item-heading .setting-item-name, .setting-item-heading')).some((e) => (e.textContent || '').includes('Sync safety'));
      // Scroll the section into view for the screenshot.
      const target = Array.from(container.querySelectorAll('.setting-item-name')).find((e) => (e.textContent || '').trim() === 'Protect against sync races');
      (target as HTMLElement | undefined)?.scrollIntoView({ block: 'start' });
      return {
        heading,
        names,
        sliders: container.querySelectorAll('.setting-item input[type="range"]').length,
      };
    });

    await browser.pause(300);
    const { mkdirSync } = await import('node:fs');
    mkdirSync('./test-results', { recursive: true });
    await saveAppScreenshot('./test-results/settings-sync-safety.png');

    expect(found.heading).toBe(true);
    expect(found.names).toContain('Protect against sync races');
    expect(found.names).toContain('Cancel on incoming note');
    expect(found.names).toContain('Wait for Obsidian Sync to settle');
    expect(found.names).toContain('Double-check on disk');
    expect(found.names).toContain('Minimum wait before auto-create');
    expect(found.names).toContain('Maximum wait');
    expect(found.sliders).toBeGreaterThanOrEqual(2);

    // Close the settings modal so it doesn't bleed into other specs.
    await browser.executeObsidian(({ app }: any) => app.setting.close());
  });

  it('still renders the section (greyed) when auto-create is off — verifiable on any device', async function () {
    await browser.executeObsidian(async ({ app }: any) => {
      const plugin = app.plugins.plugins['folder-notes'];
      plugin.settings.autoCreate = false; // section must still appear, just disabled
      if (typeof plugin.saveSettings === 'function') await plugin.saveSettings();
      await app.setting.open();
      await app.setting.openTabById('folder-notes');
    });

    await browser.pause(600);

    const found = await browser.executeObsidian(({ app }: any) => {
      // Newer Obsidian versions mount Settings in a separate window.
      const container: HTMLElement = app.plugins.plugins['folder-notes'].settingsTab.containerEl;
      const rows = Array.from(container.querySelectorAll('.setting-item'));
      const masterRow = rows.find((r) => (r.querySelector('.setting-item-name')?.textContent || '').trim() === 'Protect against sync races');
      const heading = Array.from(container.querySelectorAll('.setting-item-heading')).find((e) => (e.textContent || '').includes('Sync safety'));
      (heading as HTMLElement | undefined)?.scrollIntoView({ block: 'start' });
      return {
        hasHeading: !!heading,
        hasMaster: !!masterRow,
        masterDisabled: masterRow?.classList.contains('is-disabled') ?? false,
      };
    });

    await browser.pause(300);
    await saveAppScreenshot('./test-results/settings-sync-safety-greyed.png');

    expect(found.hasHeading).toBe(true);   // section still present when auto-create off
    expect(found.hasMaster).toBe(true);
    expect(found.masterDisabled).toBe(true); // but greyed / disabled

    await browser.executeObsidian(({ app }: any) => app.setting.close());
  });
});
