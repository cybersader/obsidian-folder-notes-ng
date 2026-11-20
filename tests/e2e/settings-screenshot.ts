import { browser } from '@wdio/globals';
import { writeFile } from 'node:fs/promises';

/** Capture only the isolated test app, including when Xvfb has no GPU compositor. */
export async function saveAppScreenshot(file: string): Promise<void> {
  if (process.env.CI && process.platform === 'linux') {
    const png = await browser.executeObsidian(async ({ app }) => {
      const owner = app.plugins.plugins['folder-notes']?.settingsTab.containerEl.ownerDocument.defaultView ?? window;
      const win = owner.require('@electron/remote').getCurrentWindow();
      const image = await win.webContents.capturePage(undefined, { stayHidden: true, stayAwake: true });
      if (image.isEmpty()) throw new Error('Obsidian returned an empty screenshot');
      return image.toPNG().toString('base64');
    });
    await writeFile(file, Buffer.from(png, 'base64'));
  } else {
    await browser.saveScreenshot(file);
  }
}
