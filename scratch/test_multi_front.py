import subprocess
import time
import json
import urllib.request
import websocket
import base64

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
port = 9563

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

    def capture_front(car_keyword, filename, cam_x=-410, cam_y=85, cam_z=-140, tgt_x=-170, tgt_y=45, tgt_z=0):
        # Select car and set camera
        expr = f"""
            const sel = document.getElementById('carSelect');
            for (let i = 0; i < sel.options.length; i++) {{
                if (sel.options[i].text.toLowerCase().includes('{car_keyword.lower()}')) {{
                    sel.selectedIndex = i;
                    sel.dispatchEvent(new Event('change'));
                    break;
                }}
            }}
            if (controls && camera) {{
                controls.target.set({tgt_x}, {tgt_y}, {tgt_z});
                camera.position.set({cam_x}, {cam_y}, {cam_z});
                controls.update();
            }}
        """
        ws.send(json.dumps({
            "id": 100,
            "method": "Runtime.evaluate",
            "params": {"expression": expr}
        }))
        time.sleep(1.0)

        # Snap
        ws.send(json.dumps({"id": 101, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
        while True:
            raw = ws.recv()
            msg = json.loads(raw)
            if msg.get("id") == 101:
                data = msg.get("result", {}).get("data")
                with open(rf"scratch_front_{filename}.png", "wb") as f:
                    f.write(base64.b64decode(data))
                print(f"Saved scratch_front_{filename}.png")
                break

    # 1. Ford Focus front 3/4
    capture_front("ford", "focus_persp", cam_x=-400, cam_y=85, cam_z=-150, tgt_x=-160, tgt_y=45)

    # 2. Ford Focus front direct head-on
    capture_front("ford", "focus_direct", cam_x=-440, cam_y=60, cam_z=0, tgt_x=-160, tgt_y=50)

    # 3. VW Golf Mk8 front 3/4
    capture_front("golf", "golf_persp", cam_x=-400, cam_y=85, cam_z=-150, tgt_x=-160, tgt_y=45)

    # 4. BMW 3 Series front 3/4
    capture_front("bmw", "bmw_persp", cam_x=-400, cam_y=85, cam_z=-150, tgt_x=-160, tgt_y=45)

finally:
    proc.terminate()
    try:
        proc.wait(timeout=2)
    except Exception:
        proc.kill()
