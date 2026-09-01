"""Build the Study Hub V29 Blender-first homepage asset.

Run from repository root:
    blender --background --python scripts/blender/build-home-v29.py

This file intentionally owns the hero geometry, PBR materials, pivots and
scroll-scrubbable animation actions. The generated .blend is the editable
source of truth and the generated .glb is the static GitHub Pages runtime
asset. No external asset host, API, add-on or paid dependency is required.
"""

from pathlib import Path
import math
import random
import bpy

ROOT = Path.cwd()
OUT_DIR = ROOT / "assets" / "3d" / "home-v29"
BLEND_OUT = OUT_DIR / "study-hub-home-v29.blend"
GLB_OUT = OUT_DIR / "study-hub-home-v29.glb"
SCENE_NAME = "StudyHubHomeV29"


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


def material(name, color, metallic=0.0, roughness=0.5, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.diffuse_color = (*color, 1.0)
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission is not None:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
            bsdf.inputs["Emission Strength"].default_value = emission_strength
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = (*emission, 1.0)
    return mat


def generated_walnut_material():
    mat = material("Walnut_Oiled", (0.235, 0.085, 0.028), metallic=0.0, roughness=0.46)
    image = bpy.data.images.new("Walnut_Grain_512", width=512, height=512, alpha=True)
    rng = random.Random(29)
    pixels = []
    for y in range(512):
        v = y / 511.0
        for x in range(512):
            u = x / 511.0
            warp = math.sin(v * math.pi * 5.5) * 0.012 + math.sin(v * math.pi * 17.0) * 0.004
            grain = 0.5 + 0.5 * math.sin((u + warp) * math.pi * 42.0)
            fine = 0.5 + 0.5 * math.sin((u * 137.0 + v * 9.0) * math.pi)
            noise = (rng.random() - 0.5) * 0.07
            r = max(0.06, min(0.42, 0.16 + grain * 0.12 + fine * 0.025 + noise))
            g = max(0.025, min(0.20, 0.052 + grain * 0.055 + fine * 0.010 + noise * 0.35))
            b = max(0.012, min(0.09, 0.018 + grain * 0.022 + fine * 0.006 + noise * 0.12))
            pixels.extend((r, g, b, 1.0))
    image.pixels = pixels
    image.pack()
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    tex = nodes.new("ShaderNodeTexImage")
    tex.name = "Walnut_Grain_Texture"
    tex.image = image
    tex.interpolation = "Linear"
    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


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


def apply_bevel(obj, width=0.04, segments=4):
    modifier = obj.modifiers.new(name="Manufactured edge rolloff", type="BEVEL")
    modifier.width = max(0.001, width)
    modifier.segments = max(2, segments)
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)


def add_box(name, size, location, mat, collection, bevel=0.04, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        apply_bevel(obj, min(bevel, min(size) * 0.24), 4)
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    if parent is not None:
        parent_keep_world(obj, parent)
    return obj


def add_cylinder(name, radius, depth, location, mat, collection, vertices=32, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation
    )
    obj = bpy.context.object
    obj.name = name
    apply_bevel(obj, min(0.018, radius * 0.16), 3)
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    if parent is not None:
        parent_keep_world(obj, parent)
    return obj


def add_uv_cushion(name, location, scale, mat, collection, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    # Subdivision gives the chair a deliberately non-box silhouette.
    subdiv = obj.modifiers.new(name="Subdivision ergonomic shell", type="SUBSURF")
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


def cylinder_between(name, start, end, radius, mat, collection, parent=None, vertices=28):
    from mathutils import Vector
    a = Vector(start)
    b = Vector(end)
    direction = b - a
    length = max(direction.length, 0.001)
    midpoint = (a + b) * 0.5
    obj = add_cylinder(name, radius, length, midpoint, mat, collection, vertices=vertices)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    obj.rotation_mode = "XYZ"
    if parent is not None:
        parent_keep_world(obj, parent)
    return obj


def add_torus(name, location, major_radius, minor_radius, mat, collection, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=36,
        minor_segments=10,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    if parent is not None:
        parent_keep_world(obj, parent)
    return obj


def set_bezier(action):
    for curve in action.fcurves:
        for point in curve.keyframe_points:
            point.interpolation = "BEZIER"
            point.handle_left_type = "AUTO_CLAMPED"
            point.handle_right_type = "AUTO_CLAMPED"


def stash_action(obj, action, strip_start=1):
    obj.animation_data_create()
    track = obj.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, strip_start, action)
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


def build_materials():
    return {
        "wall": material("Wall_Plaster_Warm", (0.62, 0.60, 0.56), metallic=0.0, roughness=0.92),
        "walnut": generated_walnut_material(),
        "graphite": material("Graphite_Powdercoat", (0.035, 0.04, 0.045), metallic=0.55, roughness=0.42),
        "aluminum": material("Aluminum_Satin", (0.42, 0.45, 0.48), metallic=0.90, roughness=0.24),
        "fabric": material("Fabric_Charcoal", (0.055, 0.052, 0.05), metallic=0.0, roughness=0.95),
        "paper": material("Paper_Warm", (0.82, 0.79, 0.70), metallic=0.0, roughness=0.88),
        "glass": material("Glass_Monitor", (0.008, 0.01, 0.012), metallic=0.0, roughness=0.08),
        "ceramic": material("Ceramic_Warm", (0.76, 0.73, 0.67), metallic=0.0, roughness=0.34),
        "screen": material(
            "StudyHub_Screen_Accent", (0.006, 0.018, 0.055), metallic=0.05, roughness=0.12,
            emission=(0.015, 0.07, 0.32), emission_strength=1.6,
        ),
        "orange": material(
            "Warm_Orange_Accent", (0.55, 0.16, 0.035), metallic=0.18, roughness=0.38,
            emission=(0.22, 0.035, 0.005), emission_strength=0.3,
        ),
        "floor": material("Floor_Microcement_Warm", (0.18, 0.175, 0.165), metallic=0.0, roughness=0.86),
    }


def build_architecture(m, collection):
    add_box("Floor", (8.8, 8.2, 0.12), (0, 0.6, -0.06), m["floor"], collection, bevel=0.015)
    add_box("BackWall", (8.8, 0.14, 5.4), (0, 3.1, 2.7), m["wall"], collection, bevel=0.025)
    add_box("LeftWall", (0.14, 7.1, 5.4), (-4.35, -0.35, 2.7), m["wall"], collection, bevel=0.025)
    # Architectural depth: skirting, acoustic slats and a recessed warm panel.
    add_box("BackSkirting", (8.55, 0.06, 0.16), (0, 3.0, 0.12), m["graphite"], collection, bevel=0.018)
    add_box("LeftSkirting", (0.06, 6.8, 0.16), (-4.25, -0.28, 0.12), m["graphite"], collection, bevel=0.018)
    panel_root = add_empty("WallPanelRoot", (-2.9, 2.98, 2.55), collection)
    add_box("WallPanelWalnut", (2.25, 0.08, 1.45), (-2.9, 2.94, 2.55), m["walnut"], collection, bevel=0.035, parent=panel_root)
    for idx in range(7):
        x = -3.78 + idx * 0.29
        add_box(f"WallSlat_{idx+1:02d}", (0.07, 0.055, 1.18), (x, 2.88, 2.55), m["graphite"], collection, bevel=0.012, parent=panel_root)


def build_drawer(root_name, location, m, collection, desk_root, width=0.84, height=0.28, depth=0.78):
    root = add_empty(root_name, location, collection, parent=desk_root)
    add_box(f"{root_name}_Body", (width, depth, height), location, m["graphite"], collection, bevel=0.025, parent=root)
    front = (location[0], location[1] - depth * 0.51, location[2])
    add_box(f"{root_name}_Front", (width + 0.035, 0.055, height + 0.025), front, m["walnut"], collection, bevel=0.025, parent=root)
    add_box(f"{root_name}_Handle", (0.40, 0.025, 0.035), (front[0], front[1] - 0.035, front[2] + 0.015), m["aluminum"], collection, bevel=0.012, parent=root)
    # A visible inner paper liner makes the open drawer read as a volume, not a floating front panel.
    add_box(f"{root_name}_Liner", (width * 0.83, depth * 0.72, 0.018), (location[0], location[1] - 0.03, location[2] + height * 0.42), m["paper"], collection, bevel=0.006, parent=root)
    return root


def build_desk(m, collection):
    desk_root = add_empty("DeskRoot", (0, 0, 0), collection)
    top = add_box("DeskTop_Walnut", (3.6, 1.55, 0.18), (0, 0.35, 1.05), m["walnut"], collection, bevel=0.065, parent=desk_root)
    # Layered front lip breaks the simple rounded-box silhouette.
    add_box("DeskTop_FrontLip", (3.46, 0.10, 0.10), (0, -0.435, 1.02), m["walnut"], collection, bevel=0.045, parent=desk_root)
    for x in (-1.50, 1.50):
        add_box(f"DeskLeg_{'L' if x < 0 else 'R'}", (0.14, 1.16, 1.70), (x, 0.42, 0.20), m["graphite"], collection, bevel=0.035, parent=desk_root)
    add_box("DeskCrossRail", (2.84, 0.10, 0.10), (0, 0.92, 0.46), m["aluminum"], collection, bevel=0.025, parent=desk_root)
    add_box("DrawerCarcass", (0.94, 0.92, 0.84), (1.02, 0.39, 0.55), m["graphite"], collection, bevel=0.035, parent=desk_root)
    drawer_top = build_drawer("DrawerTop", (1.02, 0.22, 0.78), m, collection, desk_root, height=0.25)
    drawer_middle = build_drawer("DrawerMiddle", (1.02, 0.23, 0.48), m, collection, desk_root, height=0.23)
    add_box("DeskCableTray", (1.35, 0.32, 0.07), (-0.15, 0.93, 0.86), m["graphite"], collection, bevel=0.022, parent=desk_root)
    return desk_root, drawer_top, drawer_middle, top


def build_monitor(m, collection, desk_root):
    monitor_root = add_empty("MonitorRoot", (0, 0, 0), collection, parent=desk_root)
    add_box("MonitorFrame", (1.88, 0.10, 1.12), (0, 0.98, 1.95), m["graphite"], collection, bevel=0.075, parent=monitor_root)
    add_box("MonitorGlass", (1.70, 0.025, 0.94), (0, 0.918, 1.95), m["glass"], collection, bevel=0.035, parent=monitor_root)
    add_box("MonitorScreenSurface", (1.62, 0.012, 0.87), (0, 0.900, 1.95), m["screen"], collection, bevel=0.025, parent=monitor_root)
    add_cylinder("MonitorNeck", 0.065, 0.58, (0, 0.99, 1.36), m["aluminum"], collection, parent=monitor_root)
    add_box("MonitorFoot", (0.65, 0.46, 0.07), (0, 0.89, 1.11), m["graphite"], collection, bevel=0.04, parent=monitor_root)
    anchor = add_empty("MonitorScreenAnchor", (0, 0.885, 1.95), collection, parent=monitor_root)
    anchor["studyhub_role"] = "dynamic-screen"
    return monitor_root, anchor


def build_keyboard_mouse_mug(m, collection, desk_root):
    add_box("KeyboardBody", (1.28, 0.39, 0.07), (-0.18, -0.08, 1.18), m["graphite"], collection, bevel=0.045, rotation=(math.radians(3), 0, 0), parent=desk_root)
    for row in range(4):
        for col in range(10):
            add_box(
                f"Key_{row:02d}_{col:02d}",
                (0.085, 0.055, 0.018),
                (-0.55 + col * 0.083, -0.20 + row * 0.075, 1.225),
                m["aluminum"],
                collection,
                bevel=0.012,
                parent=desk_root,
            )
    mouse = add_uv_cushion("Mouse", (0.90, -0.04, 1.205), (0.13, 0.19, 0.065), m["graphite"], collection, parent=desk_root)
    mouse.scale.z = 0.76
    mug = add_cylinder("MugBody", 0.18, 0.38, (1.38, 0.13, 1.32), m["ceramic"], collection, vertices=40, parent=desk_root)
    add_torus("MugHandle", (1.56, 0.13, 1.34), 0.135, 0.035, m["ceramic"], collection, rotation=(math.pi / 2, 0, 0), parent=desk_root)
    return mug


def build_chair(m, collection):
    root = add_empty("ChairRoot", (2.30, -0.55, 0.0), collection)
    seat = add_uv_cushion("ChairSeat_Curved", (2.30, -0.55, 0.72), (0.48, 0.43, 0.12), m["fabric"], collection, parent=root)
    seat.scale.y = 1.04
    back = add_uv_cushion("ChairBack_Curved", (2.34, -0.28, 1.48), (0.43, 0.10, 0.62), m["fabric"], collection, parent=root)
    back.rotation_euler.x = math.radians(-8)
    add_box("ChairLumbar", (0.66, 0.08, 0.12), (2.34, -0.37, 1.26), m["graphite"], collection, bevel=0.055, parent=root)
    add_cylinder("ChairColumn", 0.075, 0.64, (2.30, -0.55, 0.35), m["aluminum"], collection, parent=root)
    add_cylinder("ChairHub", 0.15, 0.08, (2.30, -0.55, 0.075), m["graphite"], collection, parent=root)
    for idx in range(5):
        angle = math.radians(18 + idx * 72)
        start = (2.30, -0.55, 0.09)
        end = (2.30 + math.cos(angle) * 0.55, -0.55 + math.sin(angle) * 0.55, 0.075)
        cylinder_between(f"ChairSpoke_{idx+1:02d}", start, end, 0.032, m["aluminum"], collection, parent=root, vertices=20)
        wheel_root = add_empty(f"ChairWheel_{idx+1:02d}", (end[0], end[1], 0.03), collection, parent=root)
        add_cylinder(f"ChairWheelMesh_{idx+1:02d}", 0.065, 0.045, (end[0], end[1], 0.03), m["graphite"], collection, vertices=24, rotation=(math.pi / 2, 0, angle), parent=wheel_root)
    return root


def build_lamp(m, collection, desk_root):
    root = add_empty("LampRoot", (1.50, 0.28, 1.16), collection, parent=desk_root)
    add_cylinder("LampBase", 0.23, 0.065, (1.50, 0.28, 1.19), m["graphite"], collection, vertices=40, parent=root)
    lower = add_empty("LampJointLower", (1.50, 0.28, 1.25), collection, parent=root)
    elbow = (1.67, 0.30, 1.82)
    cylinder_between("LampLowerArm", (1.50, 0.28, 1.28), elbow, 0.038, m["aluminum"], collection, parent=lower)
    add_uv_cushion("LampElbowHousing", elbow, (0.09, 0.09, 0.09), m["graphite"], collection, parent=lower)
    upper = add_empty("LampJointUpper", elbow, collection, parent=lower)
    head_pos = (1.48, 0.34, 2.16)
    cylinder_between("LampUpperArm", elbow, head_pos, 0.034, m["aluminum"], collection, parent=upper)
    head = add_empty("LampHead", head_pos, collection, parent=upper)
    bpy.ops.mesh.primitive_cone_add(vertices=40, radius1=0.24, radius2=0.115, depth=0.32, location=head_pos, rotation=(0, math.radians(74), 0))
    shade = bpy.context.object
    shade.name = "LampShade"
    shade.data.materials.append(m["graphite"])
    move_to_collection(shade, collection)
    parent_keep_world(shade, head)
    add_cylinder("LampDiffuser", 0.108, 0.018, (1.33, 0.34, 2.12), m["orange"], collection, vertices=40, rotation=(0, math.radians(74), 0), parent=head)
    return root, lower, upper, head


def build_cabinet(m, collection):
    root = add_empty("CabinetRoot", (-2.90, 2.10, 0), collection)
    add_box("CabinetBody", (1.48, 0.70, 2.05), (-2.90, 2.30, 1.03), m["walnut"], collection, bevel=0.055, parent=root)
    add_box("CabinetInner", (1.28, 0.55, 1.78), (-2.90, 1.91, 1.06), m["graphite"], collection, bevel=0.035, parent=root)
    door = add_empty("CabinetDoor", (-3.64, 1.92, 1.12), collection, parent=root)
    add_box("CabinetDoorPanel", (1.44, 0.065, 1.86), (-2.92, 1.88, 1.12), m["walnut"], collection, bevel=0.045, parent=door)
    add_box("CabinetDoorHandle", (0.045, 0.05, 0.48), (-2.28, 1.83, 1.12), m["aluminum"], collection, bevel=0.015, parent=door)
    door["pivot"] = "hinge-left"
    shelf = add_empty("PulloutShelf", (-2.90, 1.86, 0.72), collection, parent=root)
    add_box("PulloutShelfBoard", (1.18, 0.48, 0.055), (-2.90, 1.77, 0.72), m["walnut"], collection, bevel=0.025, parent=shelf)
    for level in (0.42, 1.30, 1.66):
        add_box(f"CabinetShelf_{int(level*100)}", (1.22, 0.50, 0.045), (-2.90, 2.02, level), m["aluminum"], collection, bevel=0.018, parent=root)
    return root, door, shelf


def build_props(m, collection, desk_root, cabinet_root, drawer_top):
    books = []
    colors = [m["paper"], m["walnut"], m["graphite"], m["orange"]]
    for idx in range(5):
        x = -1.28 + idx * 0.26
        height = 0.48 + (idx % 3) * 0.06
        root = add_empty(f"Book_{idx+1:02d}", (x, 0.86, 1.40 + height * 0.5), collection, parent=desk_root)
        add_box(f"Book_{idx+1:02d}_Block", (0.19, 0.40, height), (x, 0.86, 1.40 + height * 0.5), colors[idx % len(colors)], collection, bevel=0.018, rotation=(0, 0, math.radians((idx - 2) * 1.3)), parent=root)
        add_box(f"Book_{idx+1:02d}_Spine", (0.02, 0.415, height * 0.92), (x - 0.095, 0.86, 1.40 + height * 0.5), m["paper"], collection, bevel=0.007, parent=root)
        books.append(root)
    papers = []
    for idx in range(6):
        x = 0.82 + (idx % 2) * 0.14
        y = 0.06 + (idx // 2) * 0.018
        z = 0.90 + idx * 0.012
        root = add_empty(f"Paper_{idx+1:02d}", (x, y, z), collection, parent=drawer_top)
        add_box(f"Paper_{idx+1:02d}_Sheet", (0.56, 0.36, 0.012), (x, y, z), m["paper"], collection, bevel=0.004, rotation=(0, 0, math.radians((idx - 2) * 1.5)), parent=root)
        papers.append(root)
    # Cabinet books physically explain the later digital archive.
    for idx in range(4):
        add_box(f"CabinetBook_{idx+1:02d}", (0.20, 0.36, 0.48 + idx * 0.025), (-3.24 + idx * 0.23, 1.94, 1.55), colors[(idx + 1) % len(colors)], collection, bevel=0.018, parent=cabinet_root)
    return books, papers


def build_archive_origins(collection):
    anchors = {
        "ArchiveOrigin_Paths": (0.78, 1.55, 2.55),
        "ArchiveOrigin_Review": (-1.35, 1.20, 2.10),
        "ArchiveOrigin_Progress": (-0.55, 2.15, 1.65),
        "ArchiveOrigin_Assessment": (1.55, 1.70, 1.62),
        "ArchiveOrigin_Search": (0.05, 2.30, 2.75),
    }
    for name, location in anchors.items():
        obj = add_empty(name, location, collection)
        obj["studyhub_role"] = "archive-origin"


def build_lights(collection):
    def area(name, location, energy, color, size, rotation=(0, 0, 0)):
        data = bpy.data.lights.new(name=f"{name}Data", type="AREA")
        data.energy = energy
        data.color = color
        data.shape = "DISK"
        data.size = size
        obj = bpy.data.objects.new(name, data)
        obj.location = location
        obj.rotation_euler = rotation
        collection.objects.link(obj)
        return obj

    area("KeySoftbox", (-3.6, -2.8, 5.5), 760, (1.0, 0.91, 0.80), 4.0, (math.radians(30), 0, math.radians(-28)))
    area("CoolFill", (4.2, 0.8, 3.8), 280, (0.64, 0.74, 0.90), 3.0, (math.radians(55), 0, math.radians(150)))
    data = bpy.data.lights.new(name="PracticalLampData", type="POINT")
    data.energy = 75
    data.color = (1.0, 0.56, 0.28)
    data.shadow_soft_size = 0.35
    obj = bpy.data.objects.new("PracticalLamp", data)
    obj.location = (1.30, 0.20, 2.10)
    collection.objects.link(obj)


def animate_scene(parts):
    drawer_top = parts["drawer_top"]
    drawer_middle = parts["drawer_middle"]
    chair = parts["chair"]
    lamp_lower = parts["lamp_lower"]
    cabinet_door = parts["cabinet_door"]
    pullout = parts["pullout"]
    book = parts["book"]
    paper = parts["paper"]

    action_rotation(
        lamp_lower,
        "LampWake",
        (0, 0, math.radians(-8)),
        (math.radians(2), math.radians(-7), math.radians(6)),
        frame_end=32,
    )
    action_location(
        chair,
        "ChairClear",
        tuple(chair.location),
        (chair.location.x + 0.52, chair.location.y - 0.36, chair.location.z),
        frame_end=44,
    )
    action_location(
        drawer_top,
        "DrawerReveal",
        tuple(drawer_top.location),
        (drawer_top.location.x, drawer_top.location.y - 0.58, drawer_top.location.z),
        frame_end=42,
    )
    action_location(
        drawer_middle,
        "DrawerSecondary",
        tuple(drawer_middle.location),
        (drawer_middle.location.x, drawer_middle.location.y - 0.18, drawer_middle.location.z),
        frame_end=30,
    )
    action_rotation(
        cabinet_door,
        "CabinetOpen",
        (0, 0, 0),
        (0, 0, math.radians(-82)),
        frame_end=46,
    )
    action_location(
        pullout,
        "ShelfPull",
        tuple(pullout.location),
        (pullout.location.x, pullout.location.y - 0.46, pullout.location.z),
        frame_end=38,
    )
    action_rotation(
        book,
        "BooksRelease",
        tuple(book.rotation_euler),
        (math.radians(-12), math.radians(8), math.radians(-18)),
        frame_end=42,
    )
    action_location(
        paper,
        "PaperLift",
        tuple(paper.location),
        (paper.location.x - 0.08, paper.location.y - 0.10, paper.location.z + 0.72),
        frame_end=44,
    )


def build():
    reset_scene()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.name = SCENE_NAME
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.frame_start = 1
    scene.frame_end = 60
    scene.frame_set(1)
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = engine
            break
        except Exception:
            continue
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 50
    scene.world.color = (0.025, 0.028, 0.032)

    collections = {name: ensure_collection(name) for name in (
        "Architecture", "Desk", "Chair", "Lamp", "Cabinet", "Props", "ArchiveAnchors", "Lighting"
    )}
    m = build_materials()
    build_architecture(m, collections["Architecture"])
    desk_root, drawer_top, drawer_middle, _ = build_desk(m, collections["Desk"])
    build_monitor(m, collections["Desk"], desk_root)
    build_keyboard_mouse_mug(m, collections["Props"], desk_root)
    chair = build_chair(m, collections["Chair"])
    _, lamp_lower, _, _ = build_lamp(m, collections["Lamp"], desk_root)
    cabinet_root, cabinet_door, pullout = build_cabinet(m, collections["Cabinet"])
    books, papers = build_props(m, collections["Props"], desk_root, cabinet_root, drawer_top)
    build_archive_origins(collections["ArchiveAnchors"])
    build_lights(collections["Lighting"])

    animate_scene({
        "drawer_top": drawer_top,
        "drawer_middle": drawer_middle,
        "chair": chair,
        "lamp_lower": lamp_lower,
        "cabinet_door": cabinet_door,
        "pullout": pullout,
        "book": books[0],
        "paper": papers[0],
    })

    # Helpful semantic metadata survives in the Blender source and several fields export as extras.
    scene["studyhub_release"] = "20260901-29"
    scene["art_direction"] = "warm physical studio -> cool semantic archive"
    for obj in scene.objects:
        if obj.type == "MESH":
            obj["hero_physical"] = True
            for polygon in obj.data.polygons:
                if "Chair" in obj.name or "Lamp" in obj.name or "Mug" in obj.name or "Mouse" in obj.name:
                    polygon.use_smooth = True

    scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=True,
        export_extras=True,
    )
    print(f"V29 Blender source: {BLEND_OUT}")
    print(f"V29 runtime GLB: {GLB_OUT}")


if __name__ == "__main__":
    build()
