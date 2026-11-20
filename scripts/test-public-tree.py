"""Exercise the public-tree gate using disposable Git repositories, never a user vault."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

CHECK = Path(__file__).with_name('check-public-tree.py').resolve()


class PublicTreeTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        subprocess.run(['git', 'init', '-q', tmp.name], check=True)

    def check_file(self, name, data, expected):
        file = self.root / name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(data)
        result = subprocess.run([sys.executable, CHECK], cwd=self.root, capture_output=True)
        self.assertEqual(result.returncode, expected, result.stderr)
        return result.stderr

    def test_fixture(self):
        self.check_file('test-vault/Welcome.md', b'Synthetic note.', 0)

    def test_extra_vault_note(self):
        self.check_file('test-vault/extra.md', b'Synthetic note.', 1)

    def test_home_path(self):
        data = b'/' + b'home' + b'/fake/notes'
        self.assertNotIn(data, self.check_file('doc.md', data, 1))

    def test_email(self):
        data = b'synthetic' + b'@' + b'example.org'
        self.assertNotIn(data, self.check_file('doc.md', data, 1))

    def test_archive(self):
        self.check_file('backup.zip', b'PK\x00', 1)


if __name__ == '__main__':
    unittest.main()
