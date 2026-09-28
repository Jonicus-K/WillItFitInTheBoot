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

    # 1. Load BMW 3 Series Saloon with open boot
    url = "http://localhost:8080/?car=bmw-3-series-saloon&item=55-tv-box"
    ws.send(json.dumps({"id": 3, "method": "Page.navigate", "params": {"url": url}}))
    time.sleep(3.5)

    # Set camera angle matching user image 2 (rear 3/4 elevated view), open boot, enable see-inside
    setup_expr = """
        (() => {
            // Open boot
            if (btnBootToggle && !isTailgateOpen) {
                btnBootToggle.click();
            }
            // Enable See-Inside (X-Ray)
            if (btnXRayToggle && xRayMode >= 0.85) {
                btnXRayToggle.click();
            }
            if (controls && camera) {
                const carCenterX = selectedCar ? (70 - selectedCar.overall_length + 70) / 2 : -160;
                controls.target.set(carCenterX + 50, 50, 0);
                camera.position.set(carCenterX + 280, 175, 230);
                controls.update();
            }
        })()
    """
    ws.send(json.dumps({"id": 10, "method": "Runtime.evaluate", "params": {"expression": setup_expr}}))
    time.sleep(1.2)

    # Take screenshot of BMW Saloon rear 3/4 matching image 2
    ws.send(json.dumps({"id": 20, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("id") == 20:
            data = msg.get("result", {}).get("data")
            with open(r"scratch/bmw_rear_open.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved scratch/bmw_rear_open.png", flush=True)
            break

    # 2. Side View of BMW Saloon to verify floor circle centering
    side_expr = """
        (() => {
            snapCamera('side');
        })()
    """
    ws.send(json.dumps({"id": 30, "method": "Runtime.evaluate", "params": {"expression": side_expr}}))
    time.sleep(1.0)

    ws.send(json.dumps({"id": 40, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("id") == 40:
            data = msg.get("result", {}).get("data")
            with open(r"scratch/bmw_side_view.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved scratch/bmw_side_view.png", flush=True)
            break

    # 3. Switch to VW Golf to verify compact hatchback is ALSO centered on the circle
    golf_expr = """
        (() => {
            const sel = document.getElementById('car-select');
            for (let i = 0; i < sel.options.length; i++) {
                if (sel.options[i].text.includes('Golf')) {
                    sel.selectedIndex = i;
                    sel.dispatchEvent(new Event('change'));
                    break;
                }
            }
            snapCamera('side');
        })()
    """
    ws.send(json.dumps({"id": 50, "method": "Runtime.evaluate", "params": {"expression": golf_expr}}))
    time.sleep(1.0)

    ws.send(json.dumps({"id": 60, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("id") == 60:
            data = msg.get("result", {}).get("data")
            with open(r"scratch/golf_side_view.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved scratch/golf_side_view.png", flush=True)
            break

    ws.close()
    print("All tests completed successfully!", flush=True)
finally:
    proc.terminate()
    try:
        proc.wait(timeout=2)
    except Exception:
        proc.kill()
