"""Run on Windows to bundle the Python launcher and the generated web UI."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    if sys.platform != 'win32':
        raise SystemExit('Windows EXE must be built on Windows. Use Windows Python or the Windows build workflow.')
    subprocess.run([sys.executable, str(ROOT / 'scripts/build_web.py')], check=True, cwd=ROOT)
    subprocess.run([sys.executable, '-m', 'PyInstaller', '--noconfirm', '--clean', '--onefile', '--windowed', '--name', 'MaruPOE2', '--collect-all', 'webview', '--add-data', 'docs:docs', 'desktop/app.py'], check=True, cwd=ROOT)
    print('Built: dist/MaruPOE2.exe')


if __name__ == '__main__':
    main()
