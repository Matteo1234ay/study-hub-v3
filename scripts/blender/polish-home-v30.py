"""Second-pass art direction for the Study Hub V30 Blender scene.

This script opens the deterministic base .blend produced by build-home-v30.py,
then performs the visual-quality pass that is easier to reason about as authored
Blender edits: texture scale, material response, manufactured chair geometry,
monitor interface detail, grounding props and poster camera composition.

It never downloads anything. All materials and source meshes already live in
the committed V30 scene/local CC0 bundle.
"""

from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path.cwd()
OUT_DIR = ROOT / "assets" / "3d" / "home-v30"
BLEND_PATH = OUT_DIR / "study-hub-home-v30.blend"
GLB_PATH = OUT_DIR / "study-hub-home-v30.glb"


def material(name):
    value = bpy.data.materials.get(name)
    if value is None:
        raise RuntimeError(f"Missing V30 material: {name}")
    return value


def principled(name):
    mat = material(name)
    node = mat.node_tree.nodes.get("Principled BSDF") if mat.use_nodes else None
    if node is None:
        raise RuntimeError(f"Missing Principled BSDF: {name}")
    return mat, node


def set_socket(node, names, value):
    for name in names:
        socket = node.inputs.get(name)
        if socket is not None:
            socket.default_value = value
            return


def parent_keep_world(child, parent):
    world = child.matrix_world.copy()
    child.parent = parent
    child.matrix_world = world


def bevel(obj, width, segments=5):
    modifier = obj.modifiers.new(name="V30_Polish_Bevel", type="BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)


def rounded_box(name, size, location, mat, collection, *, radius=0.06, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel(obj, min(radius, min(size) * 0.46), 6)
    obj.data.materials.append(mat)
    for source in list(obj.users_collection):
        source.objects.unlink(obj)
    collection.objects.link(obj)
    if parent is not None:
        parent_keep_world(obj, parent)
    return obj


def cylinder(name, radius, depth, location, mat, collection, *, rotation=(0, 0, 0), parent=None, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    bevel(obj, min(0.012, radius * 0.18), 3)
    obj.data.materials.append(mat)
    for source in list(obj.users_collection):
        source.objects.unlink(obj)
    collection.objects.link(obj)
    if parent is not None:
        parent_keep_world(obj, parent)
    return obj


def cylinder_between(name, start, end, radius, mat, collection, *, parent=None):
    a = Vector(start)
    b = Vector(end)
    direction = b - a
    midpoint = (a + b) * 0.5
    obj = cylinder(name, radius, max(direction.length, 0.001), midpoint, mat, collection, parent=parent, vertices=28)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    obj.rotation_mode = "XYZ"
    return obj


def new_material(name, color, *, roughness=0.5, metallic=0.0, emission=None, emission_strength=0.0):
    existing = bpy.data.materials.get(name)
    if existing is not None:
        return existing
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    set_socket(bsdf, ["Base Color"], (*color, 1.0))
    set_socket(bsdf, ["Roughness"], roughness)
    set_socket(bsdf, ["Metallic"], metallic)
    if emission is not None:
        set_socket(bsdf, ["Emission Color", "Emission"], (*emission, 1.0))
        set_socket(bsdf, ["Emission Strength"], emission_strength)
    return mat


def tune_image_material(name, *, scale, normal_strength, value=None, saturation=1.0):
    mat, bsdf = principled(name)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    mapping = next((node for node in nodes if node.bl_idname == "ShaderNodeMapping"), None)
    if mapping is not None:
        mapping.inputs["Scale"].default_value = (scale, scale, scale)
    normal = next((node for node in nodes if node.bl_idname == "ShaderNodeNormalMap"), None)
    if normal is not None:
        normal.inputs["Strength"].default_value = normal_strength

    if value is None:
        return
    diffuse = nodes.get(f"{name}_Diffuse")
    if diffuse is None:
        return
    hue = nodes.get(f"{name}_ArtDirection")
    if hue is None:
        hue = nodes.new("ShaderNodeHueSaturation")
        hue.name = f"{name}_ArtDirection"
    hue.inputs["Saturation"].default_value = saturation
    hue.inputs["Value"].default_value = value
    for link in list(bsdf.inputs["Base Color"].links):
        links.remove(link)
    for link in list(hue.inputs["Color"].links):
        links.remove(link)
    links.new(diffuse.outputs["Color"], hue.inputs["Color"])
    links.new(hue.outputs["Color"], bsdf.inputs["Base Color"])


def tune_materials():
    tune_image_material("Walnut_CC0_Veneer", scale=2.7, normal_strength=0.28, value=0.50, saturation=0.84)
    tune_image_material("Plaster_Warm_CC0", scale=4.2, normal_strength=0.13, value=0.78, saturation=0.56)

    _, floor = principled("Microcement_Neutral")
    set_socket(floor, ["Base Color"], (0.075, 0.072, 0.068, 1.0))
    set_socket(floor, ["Roughness"], 0.92)

    _, fabric = principled("Fabric_Charcoal")
    set_socket(fabric, ["Base Color"], (0.038, 0.040, 0.043, 1.0))
    set_socket(fabric, ["Roughness"], 0.88)

    _, graphite = principled("Graphite_Powdercoat")
    set_socket(graphite, ["Base Color"], (0.020, 0.022, 0.025, 1.0))
    set_socket(graphite, ["Metallic"], 0.34)
    set_socket(graphite, ["Roughness"], 0.48)

    _, screen = principled("StudyHub_Information_Screen")
    set_socket(screen, ["Base Color"], (0.003, 0.007, 0.015, 1.0))
    set_socket(screen, ["Emission Color", "Emission"], (0.008, 0.025, 0.075, 1.0))
    set_socket(screen, ["Emission Strength"], 0.30)
    set_socket(screen, ["Roughness"], 0.22)


def remove_named(prefixes):
    targets = [obj for obj in bpy.data.objects if any(obj.name.startswith(prefix) for prefix in prefixes)]
    for obj in sorted(targets, key=lambda item: len(item.children_recursive), reverse=True):
        if obj.name in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)


def rebuild_chair():
    chair = bpy.data.objects.get("Chair_Root")
    if chair is None:
        raise RuntimeError("Missing Chair_Root")
    collection = bpy.data.collections.get("V30_CustomFurniture")
    fabric = material("Fabric_Charcoal")
    graphite = material("Graphite_Powdercoat")
    aluminum = material("Aluminum_Satin")

    remove_named(("Chair_Seat_Curved", "Chair_Back_Curved", "Chair_BackSupport_Curve", "Chair_Spoke_", "Chair_Wheel_"))

    rounded_box("Chair_Seat_Manufactured", (0.94, 0.82, 0.14), (2.25, -0.80, 0.72), fabric, collection, radius=0.11, parent=chair)
    rounded_box(
        "Chair_Back_Manufactured", (0.88, 0.14, 1.02), (2.25, -0.48, 1.40), fabric, collection,
        radius=0.12, rotation=(math.radians(-8), 0, 0), parent=chair,
    )
    rounded_box("Chair_Lumbar_Pad", (0.62, 0.11, 0.20), (2.25, -0.57, 1.18), graphite, collection, radius=0.07, parent=chair)
    cylinder_between("Chair_Back_Yoke", (2.25, -0.69, 0.82), (2.25, -0.54, 1.25), 0.035, aluminum, collection, parent=chair)

    for side in (-1, 1):
        x = 2.25 + side * 0.49
        cylinder_between(f"Chair_Arm_Post_{'L' if side < 0 else 'R'}", (x, -0.72, 0.82), (x, -0.64, 1.06), 0.025, aluminum, collection, parent=chair)
        rounded_box(
            f"Chair_Arm_Pad_{'L' if side < 0 else 'R'}", (0.11, 0.47, 0.075),
            (x, -0.54, 1.08), fabric, collection, radius=0.035, parent=chair,
        )

    hub = (2.25, -0.80, 0.10)
    for idx in range(5):
        angle = math.radians(18 + idx * 72)
        end = (hub[0] + math.cos(angle) * 0.52, hub[1] + math.sin(angle) * 0.52, 0.085)
        cylinder_between(f"Chair_BaseLeg_{idx+1:02d}", hub, end, 0.028, aluminum, collection, parent=chair)
        cylinder(
            f"Chair_Caster_{idx+1:02d}", 0.052, 0.035, (end[0], end[1], 0.045), graphite, collection,
            rotation=(math.pi / 2, 0, angle), parent=chair, vertices=28,
        )


def add_grounding_and_shelf_detail():
    root = bpy.data.objects.get("V30_Root")
    if root is None:
        raise RuntimeError("Missing V30_Root")
    architecture = bpy.data.collections.get("V30_Architecture")
    props = bpy.data.collections.get("V30_Props")
    fabric = material("Fabric_Charcoal")
    graphite = material("Graphite_Powdercoat")
    paper = material("Paper_Ivory")
    ceramic = material("Ceramic_Warm")

    rounded_box("V30_Polish_Rug", (3.2, 2.55, 0.035), (1.05, -0.78, 0.025), fabric, architecture, radius=0.08, parent=root)

    for idx, (x, width, height, mat) in enumerate([
        (1.85, 0.15, 0.50, graphite),
        (2.03, 0.13, 0.42, paper),
        (2.19, 0.16, 0.55, graphite),
        (2.38, 0.12, 0.46, paper),
    ], start=1):
        rounded_box(
            f"Shelf_Book_{idx:02d}", (width, 0.24, height), (x, 2.55, 2.74 + height / 2),
            mat, props, radius=0.025, rotation=(0, math.radians((idx - 2.5) * 1.8), 0), parent=root,
        )
    cylinder("Shelf_Ceramic_Object", 0.13, 0.27, (2.75, 2.57, 2.835), ceramic, props, parent=root, vertices=40)

    cabinet = bpy.data.objects.get("CC0_DrawerCabinet_Root")
    if cabinet is not None:
        cabinet.location = (3.30, 2.53, 0.10)
        cabinet.scale *= 0.82


def add_monitor_ui():
    info = bpy.data.objects.get("Monitor_Info_Plane")
    if info is None:
        raise RuntimeError("Missing Monitor_Info_Plane")
    props = bpy.data.collections.get("V30_Props")
    ui_text = new_material("ScreenUI_Ivory", (0.62, 0.66, 0.70), roughness=0.38, emission=(0.42, 0.48, 0.56), emission_strength=0.24)
    ui_muted = new_material("ScreenUI_Muted", (0.12, 0.15, 0.19), roughness=0.44, emission=(0.06, 0.08, 0.11), emission_strength=0.18)
    ui_accent = new_material("ScreenUI_Accent", (0.025, 0.10, 0.30), roughness=0.34, emission=(0.035, 0.17, 0.52), emission_strength=0.65)

    # Slightly in front of the dark monitor plane (toward negative Blender Y).
    y = 0.699
    rounded_box("ScreenUI_Header", (1.22, 0.008, 0.070), (-0.23, y, 2.12), ui_text, props, radius=0.018, parent=info)
    rounded_box("ScreenUI_AccentBar", (0.055, 0.008, 0.57), (-0.82, y - 0.001, 1.82), ui_accent, props, radius=0.016, parent=info)
    rounded_box("ScreenUI_Card_A", (0.54, 0.008, 0.23), (-0.42, y, 1.82), ui_muted, props, radius=0.025, parent=info)
    rounded_box("ScreenUI_Card_B", (0.54, 0.008, 0.23), (0.20, y, 1.82), ui_muted, props, radius=0.025, parent=info)
    rounded_box("ScreenUI_Line_A", (0.39, 0.006, 0.035), (-0.42, y - 0.003, 1.86), ui_text, props, radius=0.010, parent=info)
    rounded_box("ScreenUI_Line_B", (0.30, 0.006, 0.035), (0.16, y - 0.003, 1.86), ui_accent, props, radius=0.010, parent=info)
    for index, width in enumerate((0.88, 0.70, 0.80)):
        rounded_box(
            f"ScreenUI_FooterLine_{index+1:02d}", (width, 0.006, 0.024),
            (-0.18 + index * 0.06, y - 0.002, 1.55 - index * 0.065), ui_text if index == 0 else ui_muted,
            props, radius=0.008, parent=info,
        )


def tune_poster_camera():
    camera = bpy.data.objects.get("V30_RenderCamera")
    if camera is None:
        raise RuntimeError("Missing V30_RenderCamera")
    camera.location = (3.55, -4.45, 2.45)
    target = Vector((0.05, 0.15, 1.35))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 54


def save_and_export():
    scene = bpy.context.scene
    scene.frame_set(1)
    bpy.context.view_layer.update()
    scene["studyhub_art_direction"] = "V30_Polish_Interior"
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_extras=True,
    )


def main():
    if not BLEND_PATH.exists():
        raise FileNotFoundError(BLEND_PATH)
    bpy.ops.wm.open_mainfile(filepath=str(BLEND_PATH))
    tune_materials()
    rebuild_chair()
    add_grounding_and_shelf_detail()
    add_monitor_ui()
    tune_poster_camera()
    save_and_export()
    print(f"V30 polished Blender source: {BLEND_PATH}")
    print(f"V30 polished runtime GLB: {GLB_PATH}")


if __name__ == "__main__":
    main()
