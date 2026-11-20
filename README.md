<p align="center">
  <img src="docs/docs/assets/folder-notes-ng.svg" width="112" height="112" alt="Folder Notes NG logo">
</p>
<h1 align="center">Folder Notes NG</h1>
<p align="center">Click a folder in Obsidian to open its note.</p>
<p align="center">
  <a href="#install">Install with BRAT</a> ·
  <a href="docs/docs/Getting%20started.md">Getting started</a> ·
  <a href="docs/docs/Folder%20overview.md">Folder overviews</a> ·
  <a href="https://github.com/cybersader/obsidian-folder-notes-ng/releases">Releases</a>
</p>

Give a project folder a landing page without adding another entry to the file explorer. For example, clicking **Atlas** can open `Atlas/Atlas.md` with the project brief at the top and a [folder overview](docs/docs/Folder%20overview.md) listing the notes below it. You can hide the folder note itself from the tree and still open it by clicking the folder name.

## What NG changes

Folder Notes NG builds on [LostPaul’s Folder Notes](https://github.com/LostPaul/obsidian-folder-notes). The main differences affect what happens when files and folders are created:

| When… | Folder Notes NG… |
| --- | --- |
| A sync service delivers a folder before its note | Can wait for the incoming note and check the vault again before creating an empty one. Configure this in **Settings → Folder notes → Sync safety**. |
| You want one note to stay a plain file | Skips automatic wrapping when the note has the `fn-ignore` frontmatter property. You can also exclude entire folder paths. |
| You *do* want loose files wrapped in folders | Uses the file’s name: `Atlas.md` becomes `Atlas/Atlas.md`, not `Untitled/Untitled.md`. |

## Install

1. Install and enable [BRAT](https://obsidian.md/plugins?id=obsidian42-brat) in Obsidian.
2. In BRAT, choose **Add beta plugin** and enter **`cybersader/obsidian-folder-notes-ng`**.
3. Enable **Folder notes** under **Settings → Community plugins**, then [create your first folder note](docs/docs/Getting%20started.md).

**Already using Folder Notes?** NG keeps the `folder-notes` plugin ID. It replaces the [community store version](https://obsidian.md/plugins?id=folder-notes) rather than running alongside it. Use BRAT for NG updates.

## Contributing and CI

Initialize the pinned Folder Overview submodule (`git submodule update --init --recursive`), then run `npm ci` with Node 22. Use `npm run lint` for the Obsidian recommended checks (plugin source, manifest, package, and license), `npm run build` for type-checking and bundling, and `npm run test:unit` for the Bun unit tests. `npm run e2e` starts real Obsidian against a copy of the synthetic test vault; on headless Linux, use `xvfb-run -a npm run e2e`.

Before pushing to this public repository, run `npm run check:privacy` and review the staged diff, including any screenshots or video. Use synthetic notes and settings only. CI rechecks the public tree and scans Git history for secrets; these checks cannot tell whether the text or images describe a real person. CI neither publishes releases nor uploads vaults or screenshots.

## Credits and license

Folder Notes was created by Lost Paul. This fork retains the upstream [GPL-3.0-or-later license](LICENSE). [Support the original developer](https://ko-fi.com/D1D1GHGSI) · [Upstream documentation](https://lostpaul.github.io/obsidian-folder-notes/) · [Community Discord](https://discord.gg/4UQEDfQmuH)
