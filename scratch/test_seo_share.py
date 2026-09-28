import subprocess
import time
import json
import urllib.request
import websocket
import base64

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
port = 9566

proc = subprocess.Popen([
    edge_path,
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,950",
    f"--remote-debugging-port={port}",
    "--remote-allow-origins=*",
    "about:blank"
], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

try:
    time.sleep(1.0)
    with urllib.request.urlopen(f"http://127.0.0.1:{port}/json") as resp:
        tabs = json.loads(resp.read().decode())
    
    target_tab = [t for t in tabs if t.get("type") == "page"][0]
    ws = websocket.create_connection(target_tab["webSocketDebuggerUrl"])

    ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))

    url = "http://localhost:8080/?car=ford-focus-estate&item=65-tv-box"
    ws.send(json.dumps({"id": 3, "method": "Page.navigate", "params": {"url": url}}))
    time.sleep(2.0)

    # 1. Click share button to trigger toast
    ws.send(json.dumps({
        "id": 10,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """
                const btn = document.getElementById('btn-share-link');
                if (btn) btn.click();
            """
        }
    }))
    time.sleep(0.5)

    # Capture top view with toast
    ws.send(json.dumps({"id": 11, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("id") == 11:
            data = msg.get("result", {}).get("data")
            with open(r"scratch/seo_share_top.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved scratch/seo_share_top.png", flush=True)
            break

    # 2. Scroll to SEO section
    ws.send(json.dumps({
        "id": 12,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """
                const el = document.querySelector('.seo-guide-section');
                if (el) el.scrollIntoView();
            """
        }
    }))
    time.sleep(0.5)

    # Capture bottom view with SEO tables & FAQ
    ws.send(json.dumps({"id": 13, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("id") == 13:
            data = msg.get("result", {}).get("data")
            with open(r"scratch/seo_share_bottom.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved scratch/seo_share_bottom.png", flush=True)
            break

    ws.close()
    print("All screenshots captured successfully!", flush=True)
finally:
    proc.terminate()
    try:
        proc.wait(timeout=2)
    except Exception:
        proc.kill()
