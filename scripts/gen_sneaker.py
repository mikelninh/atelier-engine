import bpy
import bmesh
import math
import os
from mathutils import Vector

# ---------------------------------------------------------------------------
# Clean scene
# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)

EXPECTED = [
    "base",
    "toe",
    "overlay",
    "eyestay",
    "tongue",
    "collar",
    "heelTab",
    "midsole",
    "outsole",
    "laces",
]

NEUTRAL = (0.8, 0.8, 0.8, 1.0)

_materials = {}


def get_material(name):
    if name in _materials:
        return _materials[name]
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = NEUTRAL
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = 0.6
    _materials[name] = mat
    return mat


def finalize(obj, mat_name, smooth=True, subsurf=0, bevel=0.0):
    obj.data.materials.clear()
    obj.data.materials.append(get_material(mat_name))
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    if bevel > 0.0:
        m = obj.modifiers.new(name="bevel", type="BEVEL")
        m.width = bevel
        m.segments = 2
        m.limit_method = "ANGLE"
        m.angle_limit = math.radians(40)
    if subsurf > 0:
        m = obj.modifiers.new(name="subsurf", type="SUBSURF")
        m.levels = subsurf
        m.render_levels = subsurf
    return obj


def new_mesh_obj(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(obj)
    return obj


# ---------------------------------------------------------------------------
# Coordinate system: X length (toe +X, heel -X), Y width, Z up (ground z=0)
# ---------------------------------------------------------------------------
def make_upper_base():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1.0)
    obj = new_mesh_obj("base", bm)
    for v in obj.data.vertices:
        x, y, z = v.co.x, v.co.y, v.co.z
        x *= 0.135
        y *= 0.050
        z *= 0.062
        if x > 0:  # toe end
            t = x / 0.135
            y *= 1.0 - 0.35 * t
            if z > 0:
                z *= 1.0 - 0.45 * t
        if x < 0:  # heel end
            t = -x / 0.135
            y *= 1.0 - 0.15 * t
        v.co = Vector((x, y, z))
    for v in obj.data.vertices:
        if v.co.z < 0.0:
            v.co.z *= 0.35
    obj.location = (0.0, 0.0, 0.022)
    return obj


def make_toe_cap():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=1.0)
    obj = new_mesh_obj("toe", bm)
    for v in obj.data.vertices:
        v.co.x *= 0.048
        v.co.y *= 0.047
        v.co.z *= 0.046
        if v.co.z < 0:
            v.co.z *= 0.3
    obj.location = (0.096, 0.0, 0.032)
    return obj


def make_overlay():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=22, v_segments=11, radius=1.0)
    obj = new_mesh_obj("overlay", bm)
    for v in obj.data.vertices:
        v.co.x *= 0.092
        v.co.y *= 0.054
        v.co.z *= 0.050
    obj.location = (-0.012, 0.0, 0.030)
    return obj


def make_eyestay():
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    obj = new_mesh_obj("eyestay", bm)
    for v in obj.data.vertices:
        v.co.x *= 0.062
        v.co.y *= 0.046
        v.co.z *= 0.020
    obj.location = (-0.005, 0.0, 0.074)
    return obj


def make_tongue():
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    obj = new_mesh_obj("tongue", bm)
    for v in obj.data.vertices:
        v.co.x *= 0.050
        v.co.y *= 0.036
        v.co.z *= 0.013
    obj.location = (-0.048, 0.0, 0.082)
    obj.rotation_euler = (0.0, math.radians(-24.0), 0.0)
    return obj


def make_collar():
    bm = bmesh.new()
    major = 0.046
    minor = 0.013
    seg_major = 28
    seg_minor = 12
    ring = []
    for i in range(seg_major):
        a = 2 * math.pi * i / seg_major
        rr = []
        for j in range(seg_minor):
            b = 2 * math.pi * j / seg_minor
            x = (major + minor * math.cos(b)) * math.cos(a)
            y = (major + minor * math.cos(b)) * math.sin(a)
            z = minor * math.sin(b)
            rr.append(bm.verts.new((x, y, z)))
        ring.append(rr)
    for i in range(seg_major):
        for j in range(seg_minor):
            v0 = ring[i][j]
            v1 = ring[(i + 1) % seg_major][j]
            v2 = ring[(i + 1) % seg_major][(j + 1) % seg_minor]
            v3 = ring[i][(j + 1) % seg_minor]
            bm.faces.new((v0, v1, v2, v3))
    obj = new_mesh_obj("collar", bm)
    for v in obj.data.vertices:
        v.co.x *= 0.92
        v.co.z *= 1.05
    obj.location = (-0.072, 0.0, 0.060)
    obj.rotation_euler = (0.0, math.radians(14.0), 0.0)
    return obj


def make_heel_tab():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1.0)
    obj = new_mesh_obj("heelTab", bm)
    for v in obj.data.vertices:
        v.co.x *= 0.016
        v.co.y *= 0.030
        v.co.z *= 0.024
    obj.location = (-0.150, 0.0, 0.052)
    return obj


def make_midsole():
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    obj = new_mesh_obj("midsole", bm)
    for v in obj.data.vertices:
        x, y, z = v.co
        x *= 0.152
        y *= 0.058
        z *= 0.021
        if x > 0:
            t = x / 0.152
            y *= 1.0 - 0.30 * t
        v.co = Vector((x, y, z))
    obj.location = (-0.006, 0.0, 0.020)
    return obj


def make_outsole():
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    obj = new_mesh_obj("outsole", bm)
    for v in obj.data.vertices:
        x, y, z = v.co
        x *= 0.157
        y *= 0.062
        z *= 0.013
        if x > 0:
            t = x / 0.157
            y *= 1.0 - 0.30 * t
        v.co = Vector((x, y, z))
    obj.location = (-0.006, 0.0, 0.007)
    return obj


def make_laces():
    bm = bmesh.new()
    n = 4
    x0 = 0.028
    dx = -0.024
    for i in range(n):
        cx = x0 + dx * i
        tmp = bmesh.new()
        bmesh.ops.create_cone(
            tmp, cap_ends=True, segments=10, radius1=0.0045, radius2=0.0045, depth=0.078
        )
        for v in tmp.verts:
            ny = v.co.z  # rotate cone (Z axis) to lie along Y
            nz = -v.co.y
            v.co.x = v.co.x + cx
            v.co.y = ny
            v.co.z = nz + 0.088
        me = bpy.data.meshes.new("lacepiece")
        tmp.to_mesh(me)
        tmp.free()
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    obj = new_mesh_obj("laces", bm)
    return obj


# ---------------------------------------------------------------------------
# Build all parts
# ---------------------------------------------------------------------------
parts = []

base = make_upper_base()
finalize(base, "base", subsurf=2)
parts.append(base)
toe = make_toe_cap()
finalize(toe, "toe", subsurf=2)
parts.append(toe)
overlay = make_overlay()
finalize(overlay, "overlay", subsurf=2)
parts.append(overlay)
eyestay = make_eyestay()
finalize(eyestay, "eyestay", subsurf=2, bevel=0.006)
parts.append(eyestay)
tongue = make_tongue()
finalize(tongue, "tongue", subsurf=2, bevel=0.005)
parts.append(tongue)
collar = make_collar()
finalize(collar, "collar", subsurf=1)
parts.append(collar)
heelTab = make_heel_tab()
finalize(heelTab, "heelTab", subsurf=2)
parts.append(heelTab)
midsole = make_midsole()
finalize(midsole, "midsole", subsurf=2, bevel=0.010)
parts.append(midsole)
outsole = make_outsole()
finalize(outsole, "outsole", subsurf=2, bevel=0.006)
parts.append(outsole)
laces = make_laces()
finalize(laces, "laces", subsurf=1)
parts.append(laces)

bpy.context.view_layer.update()


# ---------------------------------------------------------------------------
# Global elongation: critics flagged the form as too short/tall and blobby.
# Stretch on length (X), keep width, compress height (Z) so length >> height.
# ---------------------------------------------------------------------------
for o in parts:
    o.scale = (1.32, 1.05, 0.82)
    o.location.x *= 1.32
    o.location.z *= 0.82
bpy.context.view_layer.update()


# ---------------------------------------------------------------------------
# Drop so lowest point sits at z=0
# ---------------------------------------------------------------------------
def world_min_z():
    mn = 1e9
    deps = bpy.context.evaluated_depsgraph_get()
    for o in parts:
        ev = o.evaluated_get(deps)
        me = ev.to_mesh()
        mw = o.matrix_world
        for v in me.vertices:
            z = (mw @ v.co).z
            if z < mn:
                mn = z
        ev.to_mesh_clear()
    return mn


mn = world_min_z()
for o in parts:
    o.location.z -= mn
bpy.context.view_layer.update()


# ---------------------------------------------------------------------------
# Export GLB
# ---------------------------------------------------------------------------
out_dir = os.environ.get("SNEAKER_OUT_DIR", "/Users/mikel/atelier-engine/public/models")
os.makedirs(out_dir, exist_ok=True)
glb_path = os.path.join(out_dir, "atelier-runner.glb")

bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format="GLB",
    export_apply=True,
    use_selection=False,
)
print("Exported:", glb_path)


# ---------------------------------------------------------------------------
# Lights + camera + preview render
# ---------------------------------------------------------------------------
scene = bpy.context.scene

cam_data = bpy.data.cameras.new("Cam")
cam = bpy.data.objects.new("Cam", cam_data)
bpy.context.collection.objects.link(cam)
cam.location = (0.40, -0.46, 0.22)
target = Vector((0.0, 0.0, 0.06))
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.camera = cam
cam_data.lens = 55


def add_area(name, loc, energy, size=0.5):
    ld = bpy.data.lights.new(name, type="AREA")
    ld.energy = energy
    ld.size = size
    lo = bpy.data.objects.new(name, ld)
    lo.location = loc
    lo.rotation_euler = (
        (Vector((0, 0, 0.06)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    )
    bpy.context.collection.objects.link(lo)
    return lo


sun = bpy.data.lights.new("Sun", type="SUN")
sun.energy = 3.0
sun_o = bpy.data.objects.new("Sun", sun)
sun_o.rotation_euler = (math.radians(50), math.radians(20), math.radians(30))
bpy.context.collection.objects.link(sun_o)

add_area("Key", (0.5, -0.5, 0.6), 60)
add_area("Fill", (-0.5, -0.4, 0.4), 25)
add_area("Rim", (-0.3, 0.5, 0.5), 30)

world = bpy.data.worlds.new("W")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.9, 0.9, 0.92, 1.0)
    bg.inputs[1].default_value = 0.6
scene.world = world

try:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
except TypeError:
    scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 700
scene.render.resolution_y = 700
if hasattr(scene, "eevee"):
    try:
        scene.eevee.taa_render_samples = 16
    except Exception:
        pass
scene.render.image_settings.file_format = "PNG"
png_path = os.path.join(out_dir, "atelier-runner-preview.png")
scene.render.filepath = png_path
bpy.ops.render.render(write_still=True)
print("Rendered:", png_path)
