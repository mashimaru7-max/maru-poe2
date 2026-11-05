# Windows app

The website is HTML/CSS/JavaScript. Python builds a common page shell and launches the exact generated `docs/` UI in pywebview. Parsing and filter logic remain shared JavaScript, so web and EXE features do not diverge.

## Run from source (Windows)

Use Python 3.11+ and Microsoft Edge WebView2 Runtime.

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r desktop/requirements.txt
.venv\Scripts\python scripts/build_web.py
.venv\Scripts\python desktop/app.py
```

## Build an EXE

```powershell
.venv\Scripts\python scripts/build_windows.py
```

Output: `dist/MaruPOE2.exe`. Python is bundled; the recipient needs WebView2 Runtime. The EXE is unsigned and Windows may show its usual unknown-publisher prompt. No installer or auto-update is included.

The app serves bundled assets read-only on `127.0.0.1:17872`, never on the LAN. A stable port keeps the storage origin stable. If that port is busy, startup fails rather than opening an unknown local service. Searches/favorites are stored in the app's own web profile under `%LOCALAPPDATA%/MaruPOE2/webview` and are separate from browser storage. External `target=_blank` links open in the user's browser. File open/download behavior and microphone recognition must be verified on Windows before calling an EXE release tested; the embedded engine may not offer browser speech recognition, so the existing unsupported-browser fallback remains.

The current Linux development environment verifies the common build, Python syntax, server and JavaScript tests. It cannot certify a Windows GUI or produce a tested Windows EXE. This repository prepares a Windows build path; it does not claim that such an EXE has already been built.

References: https://pywebview.flowrl.com/api/ · https://pywebview.flowrl.com/guide/freezing · https://pyinstaller.org/en/stable/usage.html
