"""Render the V30 fallback poster from the exact verified Blender source."""
from pathlib import Path
import bpy

ROOT = Path.cwd()
OUT = ROOT / "assets" / "3d" / "home-v30" / "home-v30-poster.png"

scene = bpy.context.scene
camera = bpy.data.objects.get("V30_RenderCamera")
if camera is None or camera.type != "CAMERA":
    raise RuntimeError("V30_RenderCamera missing from the verified Blender source")
scene.camera = camera
scene.frame_set(1)
scene.render.resolution_x = 1600
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.film_transparent = False
scene.render.filepath = str(OUT)
try:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
except Exception:
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except Exception:
        pass
bpy.ops.render.render(write_still=True)
if not OUT.exists() or OUT.stat().st_size < 32768:
    raise RuntimeError("V30 poster render is missing or implausibly small")
print(f"V30 poster PNG: {OUT}")
