"""Check public file paths and text without printing matched personal data."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip())
FILES = subprocess.check_output(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], cwd=ROOT)
FIXTURES = {'test-vault/Welcome.md'} | {
    f'test-vault/.obsidian/{name}.json' for name in ('app', 'appearance', 'community-plugins', 'core-plugins')
}
LOCAL = {'.claude', '.env', '.obsidian', '.obsidian-cache', '.ssh', 'design-drafts', 'test-results', 'test-screenshots'}
PRIVATE = re.compile(r'(?:/home/|/Users/|[a-z]:[\\/]+Users[\\/]+|/mnt/[a-z]/Users/)[\w.-]+', re.I)
EMAIL = re.compile(r'(?<![\w.+-])[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b')
failed = False


def flag(name, reason):
    global failed
    failed = True
    # Escape newlines/control characters in untrusted file names. Never echo the matched line.
    print(f'{ascii(name)}: {reason}', file=sys.stderr)


for raw in sorted(set(FILES.split(b'\0')) - {b''}):
    name = os.fsdecode(raw)
    path = ROOT / name
    parts = Path(name).parts
    if name not in FIXTURES and (parts[0] == 'test-vault' or LOCAL.intersection(parts)
            or path.name.startswith('.env.') or path.name in {'data.json', 'SYNC_FIX_BRIEF.md', 'ESCAPE_HATCHES.md'}
            or path.suffix.lower() in {'.edtz', '.pem', '.key', '.p12', '.log'} or name.endswith('.portagenty.toml')):
        flag(name, 'local or non-fixture file')
    if path.is_symlink():
        flag(name, 'symlink requires explicit review'); continue
    if not path.is_file():  # Deleted working-tree file or pinned submodule directory.
        continue
    data = path.read_bytes()
    if b'\x00' in data:
        # Never accept a vault dump, database, attachment, or archive by silently skipping it.
        # The docs already contain these media types. Review their visible content and metadata manually.
        if not (parts[:3] == ('docs', 'docs', 'assets') and path.suffix.lower() in {'.gif', '.mp4', '.png'}):
            flag(name, 'unexpected binary file')
        continue
    text = data.decode('utf-8', errors='replace')
    if PRIVATE.search(text):
        flag(name, 'absolute user profile path')
    if name == 'package-lock.json':
        # glob's published deprecation notice contains its maintainer's public support address.
        # Do not exempt any other lockfile field, package, or address.
        lock = json.loads(text)
        for key, package in lock.get('packages', {}).items():
            if key.endswith('node_modules/glob') and 'deprecated' in package:
                package['deprecated'] = package['deprecated'].replace('i' + '@' + 'izs.me', '')
        text = json.dumps(lock)
    if EMAIL.search(text):
        flag(name, 'email address requires review')

if failed:
    sys.exit(1)
print('Public-tree check passed (file paths and text).')
