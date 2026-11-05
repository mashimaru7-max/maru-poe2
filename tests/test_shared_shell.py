import importlib.util
from pathlib import Path
import threading
import unittest
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

build = load('build_web', 'scripts/build_web.py')
app = load('desktop_app', 'desktop/app.py')


class SharedBuildTests(unittest.TestCase):
    def test_all_pages_share_one_shell_and_one_stylesheet(self):
        from html.parser import HTMLParser
        class Read(HTMLParser):
            def __init__(self):
                super().__init__(); self.ids = []; self.tabs = []; self.in_tabs = False
            def handle_starttag(self, tag, attrs):
                d = dict(attrs)
                if 'id' in d: self.ids.append(d['id'])
                if tag == 'nav' and d.get('class') == 'app-tabs': self.in_tabs = True
                if tag == 'a' and self.in_tabs: self.tabs.append(d)
            def handle_endtag(self, tag):
                if tag == 'nav': self.in_tabs = False
        self.assertTrue((ROOT / 'docs/assets/mascot-stickers.webp').is_file())
        for name, html in build.render_pages().items():
            p = Read(); p.feed(html)
            self.assertEqual([t['href'] for t in p.tabs], list(build.PAGES))
            self.assertEqual(sum(t.get('aria-current') == 'page' for t in p.tabs), 1)
            self.assertEqual(next(t['href'] for t in p.tabs if t.get('aria-current') == 'page'), name)
            self.assertEqual(len(p.ids), len(set(p.ids)), name)
            self.assertEqual(html.count('site-shell.css?v='), 1)
            self.assertEqual(html.count('workshop-theme.css?v='), 1)
            self.assertEqual((ROOT / 'docs' / name).read_text(encoding='utf-8'), html)

    def test_desktop_serves_the_same_built_pages(self):
        server = app.create_server(port=0)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            self.assertEqual(server.server_address[0], '127.0.0.1')
            for page in build.PAGES:
                with urlopen(f'http://127.0.0.1:{server.server_port}/{page}') as response:
                    self.assertEqual(response.read(), (ROOT / 'docs' / page).read_bytes())
        finally:
            server.shutdown(); server.server_close(); thread.join()


if __name__ == '__main__': unittest.main()
