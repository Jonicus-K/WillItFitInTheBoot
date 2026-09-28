import subprocess
import time
import json
import urllib.request
import websocket
import base64

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
port = 9565

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

    def snap_car_front(car_text, name):
        expr = f"""
            (() => {{
                const sel = document.getElementById('car-select');
                for (let i = 0; i < sel.options.length; i++) {{
                    if (sel.options[i].text.includes('{car_text}')) {{
                        sel.selectedIndex = i;
                        sel.dispatchEvent(new Event('change'));
                        break;
                    }}
                }}
                // Calculate front position based on carFrontX
                const rearBumperX = 70;
                const totalLen = selectedCar.overall_length;
                const frontX = rearBumperX - totalLen;
                if (controls && camera) {{
                    controls.target.set(frontX + 60, 50, 0);
                    camera.position.set(frontX - 220, 100, -180);
                    controls.update();
                }}
            }})()
        """
        ws.send(json.dumps({"id": 10, "method": "Runtime.evaluate", "params": {"expression": expr}}))
        time.sleep(1.2)

        ws.send(json.dumps({"id": 20, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
        while True:
            raw = ws.recv()
            msg = json.loads(raw)
            if msg.get("id") == 20:
                data = msg.get("result", {}).get("data")
                with open(rf"front_{name}.png", "wb") as f:
                    f.write(base64.b64decode(data))
                print(f"Saved front_{name}.png")
                break

    # Snap Ford Focus
    snap_car_front("Ford Focus", "focus")
    # Snap VW Golf
    snap_car_front("Golf", "golf")
    # Snap BMW 3 Series
    snap_car_front("BMW", "bmw")
    # Snap Tesla Model Y
    snap_car_front("Tesla", "tesla")
    # Snap Nissan Qashqai
    snap_car_front("Nissan", "nissan")

finally:
    proc.terminate()
    try:
        proc.wait(timeout=2)
    except Exception:
        proc.kill()
