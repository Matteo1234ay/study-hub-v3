"""Build the local Study Hub studio-core GLB with Blender.

Run from the repository root:
    blender --background --python scripts/blender/build-studio-core.py

The runtime asset is project-authored and intentionally compact. This script is the
editable Blender source recipe so the geometry can be refined without adding any
paid service or runtime network dependency.
"""

from pathlib import Path
import math
import bpy

ROOT = Path.cwd()
OUT = ROOT / "assets" / "3d" / "studio-core" / "studio-core.glb"


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def make_material(name, color, metallic=0.0, roughness=0.5, emission=None):
    material = bpy.data.materials.new(name=name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
            bsdf.inputs["Emission Strength"].default_value = 1.4
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = (*emission, 1.0)
    return material


def box(name, size, location, material, bevel=0.045, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new(name="Soft manufactured edges", type="BEVEL")
    modifier.width = min(bevel, min(size) * 0.22)
    modifier.segments = 3
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.materials.append(material)
    return obj


def cylinder(name, radius, depth, location, material, vertices=24, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth,
                                       location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    bevel = obj.modifiers.new(name="Edge rolloff", type="BEVEL")
    bevel.width = min(0.025, radius * 0.18)
    bevel.segments = 2
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.data.materials.append(material)
    return obj


def build():
    reset_scene()
    OUT.parent.mkdir(parents=True, exist_ok=True)

    wood = make_material("Walnut_Oiled", (0.32, 0.16, 0.075), roughness=0.48)
    metal = make_material("Metal_Graphite", (0.06, 0.075, 0.095), metallic=0.72, roughness=0.25)
    black = make_material("Paint_Black", (0.018, 0.022, 0.03), metallic=0.24, roughness=0.34)
    fabric = make_material("Fabric_Charcoal", (0.045, 0.055, 0.075), roughness=0.92)
    paper = make_material("Paper", (0.76, 0.72, 0.64), roughness=0.88)
    ceramic = make_material("Ceramic", (0.82, 0.82, 0.78), roughness=0.28)
    blue = make_material("StudyHub_Blue", (0.018, 0.085, 0.35), roughness=0.28,
                         emission=(0.025, 0.12, 0.55))

    # Desk: thick top, recessed legs and a dark structural rail give it believable mass.
    box("studio-desk-top", (3.5, 0.18, 1.55), (0, 1.05, -0.35), wood, 0.055)
    box("studio-desk-leg-left", (0.16, 1.75, 1.18), (-1.45, 0.15, -0.35), black, 0.025)
    box("studio-desk-leg-right", (0.16, 1.75, 1.18), (1.45, 0.15, -0.35), black, 0.025)
    box("studio-desk-rail", (2.72, 0.12, 0.12), (0, 0.48, -0.93), metal, 0.025)

    # Monitor. The actual Study Hub UI remains a live Three.js surface in front of this shell.
    box("studio-monitor-frame", (1.85, 1.12, 0.12), (0, 1.95, -1.02), black, 0.075)
    box("studio-monitor-screen", (1.68, 0.94, 0.025), (0, 1.95, -0.95), blue, 0.018)
    cylinder("studio-monitor-neck", 0.065, 0.58, (0, 1.35, -1.05), metal)
    box("studio-monitor-foot", (0.62, 0.08, 0.44), (0, 1.18, -0.98), black, 0.035)

    # Desk props.
    box("studio-keyboard", (1.25, 0.08, 0.38), (-0.15, 1.18, 0.12), black, 0.035,
        rotation=(-0.08, 0, 0))
    box("studio-mouse", (0.26, 0.10, 0.40), (0.9, 1.18, 0.14), black, 0.05)

    # Chair with a slight recline so it reads as a physical object rather than stacked primitives.
    box("studio-chair-seat", (0.92, 0.20, 0.85), (2.35, 0.70, 1.28), fabric, 0.08,
        rotation=(-0.08, 0, 0))
    box("studio-chair-back", (0.82, 1.22, 0.17), (2.52, 1.48, 1.55), fabric, 0.08,
        rotation=(-0.10, 0, 0))
    cylinder("studio-chair-column", 0.085, 0.72, (2.35, 0.25, 1.28), metal)
    cylinder("studio-chair-hub", 0.16, 0.08, (2.35, -0.08, 1.28), metal)

    # Books and notebook are semantic props: they visually precede the archive transition.
    box("studio-book-1", (0.22, 0.55, 0.45), (-1.10, 1.695, -0.76), paper, 0.02)
    box("studio-book-2", (0.22, 0.62, 0.45), (-0.82, 1.73, -0.76), blue, 0.02)
    box("studio-book-3", (0.22, 0.50, 0.45), (-0.53, 1.67, -0.76), paper, 0.02)
    box("studio-notebook", (0.62, 0.055, 0.82), (-0.72, 1.175, 0.14), paper, 0.025)

    cylinder("studio-mug", 0.18, 0.38, (1.30, 1.34, -0.55), ceramic, vertices=32)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.15, minor_radius=0.035,
                                    major_segments=24, minor_segments=8,
                                    location=(1.46, 1.34, -0.55),
                                    rotation=(math.pi / 2, 0, 0))
    handle = bpy.context.object
    handle.name = "studio-mug-handle"
    handle.data.materials.append(ceramic)

    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.select_set(True)
            for polygon in obj.data.polygons:
                polygon.use_smooth = False

    bpy.ops.export_scene.gltf(
        filepath=str(OUT),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )
    print(f"Study Hub studio core exported to {OUT}")


if __name__ == "__main__":
    build()
