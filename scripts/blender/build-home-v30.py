"""Build the Study Hub V30 realistic CC0/local homepage scene.

Run from the repository root:
    blender --background --python scripts/blender/build-home-v30.py

The script consumes only committed local sources. Blender owns physical
hierarchy, pivots/origins, PBR material assignments and scroll-scrubbable
animation actions. Three.js later owns runtime camera, reversible timeline,
dynamic information surfaces and route handoff.
"""

from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path.cwd()
OUT_DIR = ROOT / "assets" / "3d" / "home-v30"
BLEND_OUT = OUT_DIR / "study-hub-home-v30.blend"
GLB_OUT = OUT_DIR / "study-hub-home-v30.glb"
SCENE_NAME = "StudyHubHomeV30"

# Committed local CC0 sources. No network access is permitted in this build.
LAMP_GLTF = ROOT / "assets/3d/desk-lamp-arm-01/desk_lamp_arm_01_1k.gltf"
NOTEPADS_GLTF = ROOT / "assets/3d/home-v30/vendor/office_notepads/office_notepads_1k.gltf"
STATIONERY_GLTF = ROOT / "assets/3d/home-v30/vendor/stationery_supplies/stationery_supplies_1k.gltf"
DRAWER_CABINET_GLTF = ROOT / "assets/3d/home-v30/vendor/drawer_cabinet/drawer_cabinet_1k.gltf"
WALNUT_DIFF = ROOT / "assets/3d/home-v30/vendor/natural_walnut_veneer/natural_walnut_veneer_diff_1k.jpg"
WALNUT_NORMAL = ROOT / "assets/3d/home-v30/vendor/natural_walnut_veneer/natural_walnut_veneer_nor_gl_1k.jpg"
WALNUT_ROUGH = ROOT / "assets/3d/home-v30/vendor/natural_walnut_veneer/natural_walnut_veneer_rough_1k.jpg"
PLASTER_DIFF = ROOT / "assets/3d/home-v30/vendor/white_plaster_02/white_plaster_02_diff_1k.jpg"
PLASTER_NORMAL = ROOT / "assets/3d/home-v30/vendor/white_plaster_02/white_plaster_02_nor_gl_1k.jpg"
PLASTER_ROUGH = ROOT / "assets/3d/home-v30/vendor/white_plaster_02/white_plaster_02_rough_1k.jpg"
STUDIO_HDRI = ROOT / "assets/3d/home-v30/vendor/poly_haven_studio/poly_haven_studio_2k.hdr"


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.actions,
    ):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def ensure_collection(name):
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
    return collection


def move_to_collection(obj, collection):
    for source in list(obj.users_collection):
        source.objects.unlink(obj)
    collection.objects.link(obj)


def add_empty(name, location=(0, 0, 0), collection=None, parent=None):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.12
    obj.location = location
    (collection or bpy.context.scene.collection).objects.link(obj)
    if parent is not None:
        obj.parent = parent
    return obj


def parent_keep_world(child, parent):
    world = child.matrix_world.copy()
    child.parent = parent
    child.matrix_world = world


def apply_bevel(obj, width=0.03, segments=4):
    modifier = obj.modifiers.new(name="Manufactured edge bevel", type="BEVEL")
    modifier.width = max(0.001, width)
    modifier.segments = max(2, segments)
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)


def add_box(name, size, location, mat, collection, bevel=0.03, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        apply_bevel(obj, min(bevel, min(size) * 0.22), 4)
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    if parent is not None:
        parent_keep_world(obj, parent)
    return obj


def add_cylinder(name, radius, depth, location, mat, collection, vertices=40, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    apply_bevel(obj, min(0.014, radius * 0.15), 3)
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    if parent is not None:
        parent_keep_world(obj, parent)
    return obj


def add_curved_cushion(name, location, scale, mat, collection, parent=None, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    subdiv = obj.modifiers.new(name="Subdivision curved upholstery", type="SUBSURF")
    subdiv.levels = 1
    subdiv.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=subdiv.name)
    obj.select_set(False)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    if parent is not None:
        parent_keep_world(obj, parent)
    return obj


def cylinder_between(name, start, end, radius, mat, collection, parent=None):
    a = Vector(start)
    b = Vector(end)
    direction = b - a
    length = max(direction.length, 0.001)
    midpoint = (a + b) * 0.5
    obj = add_cylinder(name, radius, length, midpoint, mat, collection, vertices=28)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    obj.rotation_mode = "XYZ"
    if parent is not None:
        parent_keep_world(obj, parent)
    return obj


def add_bezier_tube(name, points, radius, mat, collection, parent=None):
    curve_data = bpy.data.curves.new(name=f"{name}_Curve", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = 5
    spline = curve_data.splines.new(type="BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve_data)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    if parent is not None:
        obj.parent = parent
    return obj


def set_principled_input(bsdf, names, value):
    for name in names:
        socket = bsdf.inputs.get(name)
        if socket is not None:
            socket.default_value = value
            return True
    return False


def principled_material(name, color, metallic=0.0, roughness=0.5, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.diffuse_color = (*color, 1.0)
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    set_principled_input(bsdf, ["Base Color"], (*color, 1.0))
    set_principled_input(bsdf, ["Metallic"], metallic)
    set_principled_input(bsdf, ["Roughness"], roughness)
    if emission is not None:
        set_principled_input(bsdf, ["Emission Color", "Emission"], (*emission, 1.0))
        set_principled_input(bsdf, ["Emission Strength"], emission_strength)
    return mat


def image_pbr_material(name, diffuse_path, normal_path, roughness_path, roughness=0.5):
    for path_value in (diffuse_path, normal_path, roughness_path):
        if not path_value.exists():
            raise FileNotFoundError(path_value)
    mat = principled_material(name, (1.0, 1.0, 1.0), metallic=0.0, roughness=roughness)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")

    texcoord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    links.new(texcoord.outputs["UV"], mapping.inputs["Vector"])

    diffuse = nodes.new("ShaderNodeTexImage")
    diffuse.name = f"{name}_Diffuse"
    diffuse.image = bpy.data.images.load(str(diffuse_path), check_existing=True)
    diffuse.image.colorspace_settings.name = "sRGB"
    links.new(mapping.outputs["Vector"], diffuse.inputs["Vector"])
    links.new(diffuse.outputs["Color"], bsdf.inputs["Base Color"])

    normal_tex = nodes.new("ShaderNodeTexImage")
    normal_tex.name = f"{name}_Normal"
    normal_tex.image = bpy.data.images.load(str(normal_path), check_existing=True)
    normal_tex.image.colorspace_settings.name = "Non-Color"
    links.new(mapping.outputs["Vector"], normal_tex.inputs["Vector"])
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.inputs["Strength"].default_value = 0.52
    links.new(normal_tex.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])

    rough_tex = nodes.new("ShaderNodeTexImage")
    rough_tex.name = f"{name}_Roughness"
    rough_tex.image = bpy.data.images.load(str(roughness_path), check_existing=True)
    rough_tex.image.colorspace_settings.name = "Non-Color"
    links.new(mapping.outputs["Vector"], rough_tex.inputs["Vector"])
    links.new(rough_tex.outputs["Color"], bsdf.inputs["Roughness"])
    return mat


def build_materials():
    return {
        "walnut": image_pbr_material("Walnut_CC0_Veneer", WALNUT_DIFF, WALNUT_NORMAL, WALNUT_ROUGH, 0.48),
        "plaster": image_pbr_material("Plaster_Warm_CC0", PLASTER_DIFF, PLASTER_NORMAL, PLASTER_ROUGH, 0.88),
        "graphite": principled_material("Graphite_Powdercoat", (0.035, 0.038, 0.041), metallic=0.48, roughness=0.40),
        "aluminum": principled_material("Aluminum_Satin", (0.42, 0.44, 0.46), metallic=0.90, roughness=0.25),
        "fabric": principled_material("Fabric_Charcoal", (0.055, 0.052, 0.048), metallic=0.0, roughness=0.94),
        "paper": principled_material("Paper_Ivory", (0.82, 0.79, 0.70), metallic=0.0, roughness=0.88),
        "ceramic": principled_material("Ceramic_Warm", (0.78, 0.75, 0.68), metallic=0.0, roughness=0.30),
        "glass": principled_material("Glass_Monitor", (0.012, 0.015, 0.018), metallic=0.08, roughness=0.10),
        "floor": principled_material("Microcement_Neutral", (0.17, 0.165, 0.155), metallic=0.0, roughness=0.86),
        "screen": principled_material(
            "StudyHub_Information_Screen", (0.006, 0.015, 0.038), metallic=0.02, roughness=0.15,
            emission=(0.018, 0.075, 0.32), emission_strength=1.4,
        ),
        "warm_light": principled_material(
            "StudyHub_Accent_WarmLight", (0.9, 0.55, 0.25), metallic=0.0, roughness=0.28,
            emission=(1.0, 0.38, 0.10), emission_strength=2.4,
        ),
    }


def build_architecture(m, collection, root):
    add_box("Architecture_Floor", (9.2, 8.2, 0.12), (0.0, 0.45, -0.06), m["floor"], collection, bevel=0.015, parent=root)
    add_box("Architecture_BackWall", (9.2, 0.16, 5.3), (0.0, 3.0, 2.65), m["plaster"], collection, bevel=0.022, parent=root)
    add_box("Architecture_LeftWall", (0.16, 7.2, 5.3), (-4.5, -0.45, 2.65), m["plaster"], collection, bevel=0.022, parent=root)
    add_box("Architecture_BackShadowGap", (8.85, 0.045, 0.08), (0.0, 2.89, 0.10), m["graphite"], collection, bevel=0.01, parent=root)
    add_box("Architecture_LeftShadowGap", (0.045, 6.9, 0.08), (-4.39, -0.40, 0.10), m["graphite"], collection, bevel=0.01, parent=root)

    panel_root = add_empty("Architecture_WalnutPanel_Root", (-2.82, 2.86, 2.55), collection, parent=root)
    add_box("Architecture_WalnutPanel", (2.45, 0.07, 1.65), (-2.82, 2.86, 2.55), m["walnut"], collection, bevel=0.032, parent=panel_root)
    for idx in range(8):
        x = -3.72 + idx * 0.255
        add_box(f"Architecture_Slat_{idx+1:02d}", (0.055, 0.055, 1.42), (x, 2.79, 2.55), m["graphite"], collection, bevel=0.009, parent=panel_root)

    shelf = add_empty("Architecture_Shelf_Root", (2.55, 2.78, 2.65), collection, parent=root)
    add_box("Architecture_Shelf_Walnut", (2.25, 0.36, 0.10), (2.55, 2.69, 2.65), m["walnut"], collection, bevel=0.035, parent=shelf)
    for x in (1.65, 3.45):
        add_box("Architecture_ShelfBracket", (0.055, 0.28, 0.48), (x, 2.83, 2.44), m["graphite"], collection, bevel=0.018, parent=shelf)


def build_desk(m, collection, root):
    desk = add_empty("Desk_Root", (0, 0, 0), collection, parent=root)
    add_box("Desk_WalnutTop", (3.75, 1.55, 0.16), (0.0, 0.20, 1.04), m["walnut"], collection, bevel=0.065, parent=desk)
    add_box("Desk_UnderTopShadow", (3.55, 1.38, 0.055), (0.0, 0.23, 0.93), m["graphite"], collection, bevel=0.025, parent=desk)
    for x in (-1.58, 1.58):
        add_box(f"Desk_Frame_{'L' if x < 0 else 'R'}", (0.12, 1.18, 1.72), (x, 0.27, 0.19), m["graphite"], collection, bevel=0.032, parent=desk)
    add_box("Desk_CrossRail", (2.95, 0.09, 0.09), (0.0, 0.82, 0.48), m["aluminum"], collection, bevel=0.022, parent=desk)

    carcass = add_box("Desk_DrawerCarcass", (0.95, 0.88, 0.82), (1.05, 0.30, 0.56), m["graphite"], collection, bevel=0.035, parent=desk)
    carcass["studyhub_mass"] = "heavy"

    primary = add_empty("Drawer_Primary", (1.05, 0.10, 0.76), collection, parent=desk)
    add_box("Drawer_Primary_Box", (0.82, 0.72, 0.25), (1.05, 0.10, 0.76), m["graphite"], collection, bevel=0.022, parent=primary)
    add_box("Drawer_Primary_Front", (0.88, 0.055, 0.28), (1.05, -0.285, 0.76), m["walnut"], collection, bevel=0.030, parent=primary)
    add_box("Drawer_Primary_Liner", (0.70, 0.55, 0.018), (1.05, 0.08, 0.875), m["paper"], collection, bevel=0.005, parent=primary)
    add_box("Drawer_Primary_Handle", (0.42, 0.032, 0.035), (1.05, -0.332, 0.77), m["aluminum"], collection, bevel=0.010, parent=primary)

    secondary = add_empty("Drawer_Secondary", (1.05, 0.12, 0.47), collection, parent=desk)
    add_box("Drawer_Secondary_Box", (0.82, 0.70, 0.22), (1.05, 0.12, 0.47), m["graphite"], collection, bevel=0.022, parent=secondary)
    add_box("Drawer_Secondary_Front", (0.88, 0.055, 0.25), (1.05, -0.255, 0.47), m["walnut"], collection, bevel=0.030, parent=secondary)
    add_box("Drawer_Secondary_Handle", (0.42, 0.032, 0.035), (1.05, -0.302, 0.48), m["aluminum"], collection, bevel=0.010, parent=secondary)

    return desk, primary, secondary


def build_monitor(m, collection, desk):
    monitor = add_empty("Monitor_Root", (0, 0, 0), collection, parent=desk)
    add_box("Monitor_Frame", (1.92, 0.075, 1.12), (-0.12, 0.78, 1.84), m["graphite"], collection, bevel=0.070, parent=monitor)
    add_box("Monitor_Glass", (1.76, 0.024, 0.96), (-0.12, 0.728, 1.84), m["glass"], collection, bevel=0.030, parent=monitor)
    info_plane = add_box("Monitor_Info_Plane", (1.66, 0.010, 0.88), (-0.12, 0.710, 1.84), m["screen"], collection, bevel=0.022, parent=monitor)
    add_cylinder("Monitor_Neck", 0.060, 0.54, (-0.12, 0.80, 1.30), m["aluminum"], collection, parent=monitor)
    add_box("Monitor_Base", (0.67, 0.44, 0.065), (-0.12, 0.70, 1.07), m["graphite"], collection, bevel=0.040, parent=monitor)
    anchor = add_empty("Monitor_Screen_Anchor", (-0.12, 0.695, 1.84), collection, parent=monitor)
    anchor["studyhub_role"] = "dynamic-information-screen"
    return monitor, anchor, info_plane


def build_chair(m, collection, root):
    chair = add_empty("Chair_Root", (2.25, -0.80, 0.0), collection, parent=root)
    add_curved_cushion("Chair_Seat_Curved", (2.25, -0.80, 0.72), (0.50, 0.43, 0.12), m["fabric"], collection, parent=chair)
    add_curved_cushion("Chair_Back_Curved", (2.28, -0.52, 1.45), (0.44, 0.105, 0.61), m["fabric"], collection, parent=chair, rotation=(math.radians(-8), 0, 0))
    add_bezier_tube(
        "Chair_BackSupport_Curve",
        [(2.25, -0.63, 0.76), (2.25, -0.54, 1.02), (2.28, -0.50, 1.35)],
        0.040, m["graphite"], collection, parent=chair,
    )
    add_cylinder("Chair_Column", 0.070, 0.58, (2.25, -0.80, 0.36), m["aluminum"], collection, parent=chair)
    add_cylinder("Chair_Hub", 0.14, 0.08, (2.25, -0.80, 0.075), m["graphite"], collection, parent=chair)
    for idx in range(5):
        angle = math.radians(18 + idx * 72)
        start = (2.25, -0.80, 0.09)
        end = (2.25 + math.cos(angle) * 0.55, -0.80 + math.sin(angle) * 0.55, 0.075)
        cylinder_between(f"Chair_Spoke_{idx+1:02d}", start, end, 0.032, m["aluminum"], collection, parent=chair)
        add_cylinder(f"Chair_Wheel_{idx+1:02d}", 0.065, 0.045, end, m["graphite"], collection, vertices=24, rotation=(math.pi/2, 0, angle), parent=chair)
    return chair


def build_custom_cabinet(m, collection, root):
    cabinet = add_empty("Cabinet_Root", (-2.78, 1.82, 0.0), collection, parent=root)
    add_box("Cabinet_Custom_Body", (1.55, 0.72, 2.05), (-2.78, 2.05, 1.03), m["walnut"], collection, bevel=0.050, parent=cabinet)
    add_box("Cabinet_Custom_Inner", (1.34, 0.55, 1.82), (-2.78, 1.66, 1.04), m["graphite"], collection, bevel=0.030, parent=cabinet)
    # Cabinet_Door origin is the physical hinge pivot.
    door = add_empty("Cabinet_Door", (-3.56, 1.65, 1.08), collection, parent=cabinet)
    add_box("Cabinet_Door_Panel", (1.48, 0.060, 1.88), (-2.82, 1.62, 1.08), m["walnut"], collection, bevel=0.040, parent=door)
    add_box("Cabinet_Door_Handle", (0.040, 0.045, 0.46), (-2.14, 1.58, 1.08), m["aluminum"], collection, bevel=0.012, parent=door)
    return cabinet, door


def build_paper_props(m, collection, desk):
    paper = add_empty("Paper_Stack", (-1.05, 0.05, 1.14), collection, parent=desk)
    for idx in range(7):
        add_box(
            f"Paper_Sheet_{idx+1:02d}",
            (0.62, 0.43, 0.008),
            (-1.05 + idx * 0.006, 0.05 - idx * 0.004, 1.14 + idx * 0.010),
            m["paper"], collection, bevel=0.003,
            rotation=(0, 0, math.radians(-4 + idx * 0.7)), parent=paper,
        )
    notebook = add_empty("Notebook_Root", (-0.78, -0.30, 1.16), collection, parent=desk)
    add_box("Notebook_Cover", (0.52, 0.37, 0.035), (-0.78, -0.30, 1.16), m["graphite"], collection, bevel=0.024, rotation=(0, 0, math.radians(7)), parent=notebook)
    add_box("Notebook_Pages", (0.48, 0.34, 0.026), (-0.78, -0.30, 1.18), m["paper"], collection, bevel=0.015, rotation=(0, 0, math.radians(7)), parent=notebook)
    return paper, notebook


def build_small_props(m, collection, desk):
    add_box("Keyboard_Base", (1.22, 0.38, 0.065), (0.02, -0.16, 1.16), m["graphite"], collection, bevel=0.040, rotation=(math.radians(3), 0, 0), parent=desk)
    for row in range(4):
        for col in range(10):
            add_box(
                f"Keyboard_Key_{row:02d}_{col:02d}", (0.078, 0.050, 0.016),
                (-0.32 + col * 0.078, -0.26 + row * 0.070, 1.202), m["aluminum"], collection,
                bevel=0.010, parent=desk,
            )
    add_curved_cushion("Mouse_Curved", (0.90, -0.18, 1.18), (0.13, 0.17, 0.060), m["graphite"], collection, parent=desk)
    add_cylinder("Ceramic_Mug", 0.17, 0.34, (1.52, -0.08, 1.28), m["ceramic"], collection, parent=desk)
    add_bezier_tube("Ceramic_Mug_Handle", [(1.66, -0.08, 1.38), (1.80, -0.08, 1.30), (1.66, -0.08, 1.20)], 0.030, m["ceramic"], collection, parent=desk)


def imported_top_level(new_objects):
    new_set = set(new_objects)
    return [obj for obj in new_objects if obj.parent not in new_set]


def hierarchy_bounds(objects):
    corners = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            corners.append(obj.matrix_world @ Vector(corner))
    if not corners:
        return None
    minimum = Vector((min(v.x for v in corners), min(v.y for v in corners), min(v.z for v in corners)))
    maximum = Vector((max(v.x for v in corners), max(v.y for v in corners), max(v.z for v in corners)))
    return minimum, maximum


def import_cc0_model(filepath, marker_name, collection, parent, target_longest, location, rotation=(0, 0, 0)):
    if not filepath.exists():
        raise FileNotFoundError(filepath)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(filepath))
    imported = [obj for obj in bpy.data.objects if obj not in before]
    if not imported:
        raise RuntimeError(f"No objects imported from {filepath}")

    marker = add_empty(marker_name, (0, 0, 0), collection, parent=parent)
    for obj in imported_top_level(imported):
        parent_keep_world(obj, marker)
    for obj in imported:
        for source in list(obj.users_collection):
            source.objects.unlink(obj)
        collection.objects.link(obj)
        if obj.type == "MESH":
            obj["studyhub_cc0_source"] = filepath.stem

    bpy.context.view_layer.update()
    bounds = hierarchy_bounds(imported)
    if bounds:
        minimum, maximum = bounds
        dimensions = maximum - minimum
        longest = max(dimensions.x, dimensions.y, dimensions.z, 0.0001)
        factor = target_longest / longest
        marker.scale = (factor, factor, factor)
        bpy.context.view_layer.update()
        bounds = hierarchy_bounds(imported)
        minimum, maximum = bounds
        center = (minimum + maximum) * 0.5
        marker.location -= center
        marker.location += Vector(location)
    else:
        marker.location = location
    marker.rotation_euler = rotation
    marker["studyhub_source"] = "local-cc0"
    marker["studyhub_source_file"] = str(filepath.relative_to(ROOT))
    return marker, imported


def add_archive_origins(collection, root):
    origins = {
        "ArchiveOrigin_Paths": (0.35, 1.82, 2.65),
        "ArchiveOrigin_Review": (-1.60, 1.60, 2.25),
        "ArchiveOrigin_Progress": (-0.55, 2.55, 2.75),
        "ArchiveOrigin_Assessment": (1.72, 1.42, 2.20),
        "ArchiveOrigin_Search": (1.85, 2.45, 2.75),
    }
    result = {}
    for name, location in origins.items():
        anchor = add_empty(name, location, collection, parent=root)
        anchor["studyhub_role"] = "archive-origin"
        result[name] = anchor
    return result


def set_bezier(action):
    for curve in action.fcurves:
        for point in curve.keyframe_points:
            point.interpolation = "BEZIER"
            point.handle_left_type = "AUTO_CLAMPED"
            point.handle_right_type = "AUTO_CLAMPED"


def stash_action(obj, action):
    obj.animation_data_create()
    track = obj.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, 1, action)
    strip.name = action.name
    strip.action_frame_start = action.frame_range[0]
    strip.action_frame_end = action.frame_range[1]
    strip.extrapolation = "NOTHING"
    strip.blend_type = "REPLACE"
    obj.animation_data.action = None


def action_location(obj, name, start, end, frame_end=40):
    obj.animation_data_create()
    action = bpy.data.actions.new(name=name)
    obj.animation_data.action = action
    obj.location = start
    obj.keyframe_insert(data_path="location", frame=1, group=name)
    obj.location = end
    obj.keyframe_insert(data_path="location", frame=frame_end, group=name)
    set_bezier(action)
    stash_action(obj, action)
    obj.location = start
    return action


def action_rotation(obj, name, start, end, frame_end=40):
    obj.rotation_mode = "XYZ"
    obj.animation_data_create()
    action = bpy.data.actions.new(name=name)
    obj.animation_data.action = action
    obj.rotation_euler = start
    obj.keyframe_insert(data_path="rotation_euler", frame=1, group=name)
    obj.rotation_euler = end
    obj.keyframe_insert(data_path="rotation_euler", frame=frame_end, group=name)
    set_bezier(action)
    stash_action(obj, action)
    obj.rotation_euler = start
    return action


def action_scale(obj, name, start, end, frame_end=40):
    obj.animation_data_create()
    action = bpy.data.actions.new(name=name)
    obj.animation_data.action = action
    obj.scale = start
    obj.keyframe_insert(data_path="scale", frame=1, group=name)
    obj.scale = end
    obj.keyframe_insert(data_path="scale", frame=frame_end, group=name)
    set_bezier(action)
    stash_action(obj, action)
    obj.scale = start
    return action


def create_actions(primary, secondary, door, lamp, chair, paper, notebook, info_plane):
    action_location(primary, "Drawer_Primary_Open", tuple(primary.location), (primary.location.x, primary.location.y - 0.58, primary.location.z), 42)
    action_location(secondary, "Drawer_Secondary_Open", tuple(secondary.location), (secondary.location.x, secondary.location.y - 0.42, secondary.location.z), 42)
    action_rotation(door, "Cabinet_Door_Open", tuple(door.rotation_euler), (door.rotation_euler.x, door.rotation_euler.y, math.radians(-82)), 44)
    action_rotation(lamp, "Lamp_Adjust", tuple(lamp.rotation_euler), (math.radians(2), math.radians(-7), math.radians(-12)), 40)
    action_location(chair, "Chair_Shift", tuple(chair.location), (chair.location.x + 0.18, chair.location.y - 0.22, chair.location.z), 36)
    action_location(paper, "Paper_Lift", tuple(paper.location), (paper.location.x - 0.12, paper.location.y - 0.10, paper.location.z + 0.54), 42)
    action_location(notebook, "Notebook_Lift", tuple(notebook.location), (notebook.location.x + 0.12, notebook.location.y - 0.04, notebook.location.z + 0.42), 42)
    action_scale(info_plane, "Monitor_Info_Reveal", (0.985, 0.985, 0.985), (1.0, 1.0, 1.0), 34)


def setup_world_and_lighting(m, collection):
    scene = bpy.context.scene
    world = bpy.data.worlds.new("StudyHubV30_World") if bpy.data.worlds.get("StudyHubV30_World") is None else bpy.data.worlds["StudyHubV30_World"]
    scene.world = world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputWorld")
    background = nodes.new("ShaderNodeBackground")
    environment = nodes.new("ShaderNodeTexEnvironment")
    environment.image = bpy.data.images.load(str(STUDIO_HDRI), check_existing=True)
    background.inputs["Strength"].default_value = 0.36
    links.new(environment.outputs["Color"], background.inputs["Color"])
    links.new(background.outputs["Background"], output.inputs["Surface"])

    def area_light(name, location, energy, size, color):
        data = bpy.data.lights.new(name=f"{name}_Data", type="AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        data.color = color
        obj = bpy.data.objects.new(name, data)
        collection.objects.link(obj)
        obj.location = location
        return obj

    key = area_light("Render_Key_Warm", (3.2, -3.4, 4.8), 760, 4.2, (1.0, 0.82, 0.68))
    key.rotation_euler = (math.radians(31), 0, math.radians(39))
    fill = area_light("Render_Fill_Neutral", (-3.5, -1.4, 3.2), 310, 3.4, (0.78, 0.86, 1.0))
    fill.rotation_euler = (math.radians(62), 0, math.radians(-58))
    practical = area_light("Render_Practical_Warm", (1.48, -0.02, 2.25), 110, 0.65, (1.0, 0.60, 0.32))
    practical.rotation_euler = (math.radians(18), 0, math.radians(12))
    return key, fill, practical


def setup_render_camera(collection):
    camera_data = bpy.data.cameras.new("V30_RenderCamera_Data")
    camera = bpy.data.objects.new("V30_RenderCamera", camera_data)
    collection.objects.link(camera)
    camera.location = (5.25, -6.25, 3.75)
    target = Vector((0.0, 0.35, 1.35))
    direction = target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera_data.lens = 48
    bpy.context.scene.camera = camera
    return camera


def configure_scene():
    scene = bpy.context.scene
    scene.name = SCENE_NAME
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except Exception:
        try:
            scene.render.engine = "BLENDER_EEVEE"
        except Exception:
            pass
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 50
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.frame_start = 1
    scene.frame_end = 48
    for candidate in ("AgX", "Filmic", "Standard"):
        try:
            scene.view_settings.look = "Medium High Contrast" if candidate == "AgX" else scene.view_settings.look
            scene.view_settings.view_transform = candidate
            break
        except Exception:
            continue


def build():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    reset_scene()
    configure_scene()

    architecture = ensure_collection("V30_Architecture")
    furniture = ensure_collection("V30_CustomFurniture")
    imported_cc0 = ensure_collection("V30_ImportedCC0")
    props = ensure_collection("V30_Props")
    anchors = ensure_collection("V30_ArchiveAnchors")
    lighting = ensure_collection("V30_RenderLighting")

    m = build_materials()
    root = add_empty("V30_Root", (0, 0, 0), furniture)
    root["studyhub_version"] = "v30"
    root["studyhub_runtime_network"] = "none"

    build_architecture(m, architecture, root)
    desk, primary, secondary = build_desk(m, furniture, root)
    _, _, info_plane = build_monitor(m, furniture, desk)
    chair = build_chair(m, furniture, root)
    _, door = build_custom_cabinet(m, furniture, root)
    paper, notebook = build_paper_props(m, props, desk)
    build_small_props(m, props, desk)
    add_archive_origins(anchors, root)

    # High-quality local CC0 detail. Imported models are normalized by bounds and
    # wrapped in stable Study Hub marker origins so the runtime can audit them.
    lamp_shell, _ = import_cc0_model(
        LAMP_GLTF, "CC0_DeskLamp_Root", imported_cc0, root,
        target_longest=1.18, location=(1.42, 0.05, 1.72), rotation=(0, 0, math.radians(-18)),
    )
    lamp = add_empty("Lamp_Root", (1.42, 0.05, 1.05), furniture, parent=root)
    parent_keep_world(lamp_shell, lamp)

    notepad_marker, _ = import_cc0_model(
        NOTEPADS_GLTF, "CC0_Notepad_Root", imported_cc0, desk,
        target_longest=0.62, location=(-1.18, 0.28, 1.19), rotation=(0, 0, math.radians(-8)),
    )
    notepad_marker["studyhub_role"] = "paper-detail"

    stationery_marker, _ = import_cc0_model(
        STATIONERY_GLTF, "CC0_Stationery_Root", imported_cc0, desk,
        target_longest=0.48, location=(0.98, 0.40, 1.30), rotation=(0, 0, math.radians(12)),
    )
    stationery_marker["studyhub_role"] = "editorial-detail"

    cabinet_marker, _ = import_cc0_model(
        DRAWER_CABINET_GLTF, "CC0_DrawerCabinet_Root", imported_cc0, root,
        target_longest=1.35, location=(3.35, 2.10, 0.70), rotation=(0, 0, math.radians(-8)),
    )
    cabinet_marker["studyhub_role"] = "secondary-storage-detail"

    create_actions(primary, secondary, door, lamp, chair, paper, notebook, info_plane)
    setup_world_and_lighting(m, lighting)
    setup_render_camera(lighting)

    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))

    # Render lights/camera/world are useful for authoring and poster generation,
    # but runtime Three.js owns lighting/camera, so they are not exported.
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_extras=True,
    )
    print(f"V30 Blender source: {BLEND_OUT}")
    print(f"V30 runtime GLB: {GLB_OUT}")


if __name__ == "__main__":
    build()
