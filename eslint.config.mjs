import { defineConfig, globalIgnores } from 'eslint/config';
import obsidianmd from 'eslint-plugin-obsidianmd';

export default defineConfig([
	// Upstream submodule is checked out at a fixed commit and included in the build.
	globalIgnores(['src/obsidian-folder-overview/**']),
	...obsidianmd.configs.recommended,
	{
		files: ['src/**/*.ts'],
		languageOptions: { parserOptions: { project: './tsconfig.json' } },
	},
]);
