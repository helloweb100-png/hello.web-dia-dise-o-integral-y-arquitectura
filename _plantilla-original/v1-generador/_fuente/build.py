#!/usr/bin/env python3
"""Compila el sitio DIIA: make_site.py -> site.json -> index.html + styles.css + app.js (en la raíz del proyecto).

Requiere el generador de la skill 'landing-bigtech-premium' (variable de entorno LANDING_SKILL o ruta por defecto).
"""
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SKILL = Path(os.environ.get("LANDING_SKILL", r"C:\Users\Lenovo\.claude\skills\synced\a39e7b0c-a3bd-49d6-9d6b-b902f0553e2c_34eebd31-8f57-4b47-9181-f3fef167a951\landing-bigtech-premium"))
env = {**os.environ, "PYTHONIOENCODING": "utf-8"}

subprocess.run([sys.executable, str(HERE / "make_site.py")], check=True, env=env)
subprocess.run([sys.executable, str(SKILL / "scripts" / "build.py"), str(ROOT / "site.json"), "--out", str(ROOT)], check=True, env=env)

# El proyecto usa app.js como nombre del script: renombramos la salida y su referencia.
js, new = ROOT / "script.js", ROOT / "app.js"
if js.exists():
    new.write_bytes(js.read_bytes())
    js.unlink()
    idx = ROOT / "index.html"
    idx.write_text(idx.read_text(encoding="utf-8").replace('src="script.js"', 'src="app.js"'), encoding="utf-8")
print("Listo: index.html · styles.css · app.js")
