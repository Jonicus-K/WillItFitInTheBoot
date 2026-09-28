import subprocess
import time
import json
import urllib.request
import websocket
import base64

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
port = 9569

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
    ws.settimeout(12.0)

    ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))

    url = "http://localhost:8080/?car=bmw-3-series-saloon&item=55-tv-box"
    ws.send(json.dumps({"id": 3, "method": "Page.navigate", "params": {"url": url}}))
    time.sleep(3.5)

    # 1. 3D View with closed boot
    ws.send(json.dumps({"id": 10, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("id") == 10:
            data = msg.get("result", {}).get("data")
            with open(r"scratch/bmw_3d_closed.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved scratch/bmw_3d_closed.png", flush=True)
            break

    # 2. Rear View with closed boot
    ws.send(json.dumps({"id": 20, "method": "Runtime.evaluate", "params": {"expression": "snapCamera('rear');"}}))
    time.sleep(1.0)

    ws.send(json.dumps({"id": 30, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("id") == 30:
            data = msg.get("result", {}).get("data")
            with open(r"scratch/bmw_rear_closed.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved scratch/bmw_rear_closed.png", flush=True)
            break

    ws.close()
finally:
    proc.terminate()
    try:
        proc.wait(timeout=2)
    except Exception:
        proc.kill()
