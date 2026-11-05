"""Windows launcher for exactly the same static UI published to GitHub Pages."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import argparse
import os
import sys

APP_PORT = 17872  # Stable origin preserves localStorage between app launches.


def resource_root():
    return Path(getattr(sys, '_MEIPASS', Path(__file__).resolve().parents[1])) / 'docs'


class StaticHandler(SimpleHTTPRequestHandler):
    def list_directory(self, path):
        self.send_error(403, 'Directory listing disabled')
        return None

    def log_message(self, fmt, *args):
        pass


def create_server(directory=None, port=APP_PORT):
    root = Path(directory) if directory else resource_root()
    if not (root / 'index.html').is_file():
        raise FileNotFoundError('Built web files are missing. Run python scripts/build_web.py first.')
    return ThreadingHTTPServer(('127.0.0.1', port), partial(StaticHandler, directory=str(root)))


def show_error(message):
    if sys.platform == 'win32':
        import ctypes
        ctypes.windll.user32.MessageBoxW(None, str(message), 'Maru POE2', 0x10)
    else:
        print(message, file=sys.stderr)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true')
    args = parser.parse_args()
    try:
        import webview
    except ImportError:
        raise SystemExit('Install desktop dependencies: python -m pip install -r desktop/requirements.txt')
    try:
        server = create_server()
    except OSError as exc:
        show_error(f'Cannot start local app on 127.0.0.1:{APP_PORT}. Close another Maru POE2 instance. {exc}')
        return
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    profile = Path(os.environ.get('LOCALAPPDATA', Path.home() / '.local/share')) / 'MaruPOE2' / 'webview'
    profile.mkdir(parents=True, exist_ok=True)
    webview.settings['ALLOW_DOWNLOADS'] = True
    webview.settings['OPEN_EXTERNAL_LINKS_IN_BROWSER'] = True
    try:
        webview.create_window('MARU POE2 · 유배자의 공방', f'http://127.0.0.1:{APP_PORT}/index.html', width=1280, height=900, min_size=(800, 600), text_select=True, background_color='#f1efe9')
        webview.start(gui='edgechromium' if sys.platform == 'win32' else None, private_mode=False, storage_path=str(profile), debug=args.debug)
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)


if __name__ == '__main__':
    from multiprocessing import freeze_support
    freeze_support()
    try:
        main()
    except Exception as exc:
        show_error(f'Could not start Maru POE2. Check Microsoft Edge WebView2 Runtime.\n{exc}')
        raise SystemExit(1)
