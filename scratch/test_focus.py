import subprocess
import time
import json
import urllib.request
import websocket
import base64

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
port = 9562

proc = subprocess.Popen([
    edge_path,
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,800",
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
    ws.send(json.dumps({"id": 3, "method": "Page.navigate", "params": {"url": "http://localhost:8080"}}))
    time.sleep(2.0)

    # 1. Select Ford Focus
    ws.send(json.dumps({
        "id": 10,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """
                const sel = document.getElementById('carSelect');
                for (let i = 0; i < sel.options.length; i++) {
                    if (sel.options[i].text.includes('Ford Focus')) {
                        sel.selectedIndex = i;
                        sel.dispatchEvent(new Event('change'));
                        break;
                    }
                }
            """
        }
    }))
    time.sleep(1.0)

    # 2. Position camera at front
    ws.send(json.dumps({
        "id": 11,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """
                if (controls && camera) {
                    controls.target.set(-180, 50, 0);
                    camera.position.set(-420, 95, -160);
                    controls.update();
                }
            """
        }
    }))
    time.sleep(1.0)

    ws.send(json.dumps({"id": 12, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("id") == 12:
            data = msg.get("result", {}).get("data")
            with open(r"scratch_focus_front.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved scratch_focus_front.png")
            break

finally:
    proc.terminate()
    try:
        proc.wait(timeout=2)
    except Exception:
        proc.kill()
