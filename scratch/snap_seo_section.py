import subprocess
import time
import json
import urllib.request
import websocket
import base64

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
port = 9567

proc = subprocess.Popen([
    edge_path,
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,1200",
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
    ws.settimeout(10.0)

    ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))

    url = "http://localhost:8080/"
    ws.send(json.dumps({"id": 3, "method": "Page.navigate", "params": {"url": url}}))
    time.sleep(2.0)

    # Scroll down to SEO section
    ws.send(json.dumps({
        "id": 10,
        "method": "Runtime.evaluate",
        "params": {
            "expression": "window.scrollTo(0, 750);"
        }
    }))
    time.sleep(1.0)

    ws.send(json.dumps({"id": 20, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("id") == 20:
            data = msg.get("result", {}).get("data")
            with open(r"scratch/seo_section_view.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved scratch/seo_section_view.png", flush=True)
            break

    # Scroll down further to FAQ section and open first detail
    ws.send(json.dumps({
        "id": 30,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """
                window.scrollTo(0, 1600);
                const firstFaq = document.querySelector('.faq-item');
                if (firstFaq) firstFaq.open = true;
            """
        }
    }))
    time.sleep(1.0)

    ws.send(json.dumps({"id": 40, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("id") == 40:
            data = msg.get("result", {}).get("data")
            with open(r"scratch/seo_faq_view.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved scratch/seo_faq_view.png", flush=True)
            break

    ws.close()
finally:
    proc.terminate()
    try:
        proc.wait(timeout=2)
    except Exception:
        proc.kill()
