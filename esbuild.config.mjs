import esbuild from "esbuild";
import process from "process";
import { builtinModules } from 'node:module';

import { readFileSync } from 'node:fs';

// BRAT installs main.js without the repository docs. Carry the notices with it.
const banner = `/*!\n${readFileSync(new URL('./NOTICE', import.meta.url), 'utf8')}*/`;

const prod = process.argv.includes('production');
const baseDir = process.argv.includes('--overview') ? './src/obsidian-folder-overview/' : './';

esbuild.build({
	banner: {
		js: banner,
	},
	entryPoints: [`${baseDir}src/main.ts`],
	bundle: true,
	external: [
		'obsidian',
		'electron',
		'@codemirror/autocomplete',
		'@codemirror/collab',
		'@codemirror/commands',
		'@codemirror/language',
		'@codemirror/lint',
		'@codemirror/search',
		'@codemirror/state',
		'@codemirror/view',
		'@lezer/common',
		'@lezer/highlight',
		'@lezer/lr',
		...builtinModules],
	format: 'cjs',
	watch: !prod,
	target: 'es2018',
	logLevel: "info",
	sourcemap: prod ? false : 'inline',
	treeShaking: true,
	outfile: `${baseDir}main.js`,
	conditions: ['types'],
}).catch(() => process.exit(1));
