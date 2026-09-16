"""
VR Garage - procedural 2.0L Hurricane engine bay builder.

Run inside the Unreal 5.8 editor (Tools > Execute Python Script, or the
Python console). Builds /Game/Garage/Maps/GarageBay out of engine basic
shapes with part tags matching the web app (part:<id>), plus lights,
floor, engine stand and a fly-camera spectator.

Idempotent: re-running deletes previous VRG_* actors and rebuilds.
"""
import unreal

MAP_FOLDER = "/Game/Garage/Maps"
MAP_NAME = "GarageBay"
MAP_PATH = f"{MAP_FOLDER}/{MAP_NAME}"

# 1 web unit = 20 cm; engine sits on an 80 cm stand.
S = 20.0
ZOFF = 80.0

SHAPES = {
    "box": "/Engine/BasicShapes/Cube",
    "sphere": "/Engine/BasicShapes/Sphere",
    "cyl": "/Engine/BasicShapes/Cylinder",
}


def log(msg):
    unreal.log(f"[VRG] {msg}")


def load_shape(key):
    mesh = unreal.EditorAssetLibrary.load_asset(SHAPES[key])
    if not mesh:
        log(f"ERROR: cannot load {SHAPES[key]}")
    return mesh


def get_or_create_level():
    level = unreal.EditorAssetLibrary.load_asset(MAP_PATH)
    if level:
        log(f"Opened existing {MAP_PATH}")
        unreal.EditorLevelLibrary.load_level(MAP_PATH)
        return
    try:
        tools = unreal.AssetToolsHelpers.get_asset_tools()
        factory = unreal.WorldFactory()
        tools.create_asset(MAP_NAME, MAP_FOLDER, unreal.World, factory)
        log(f"Created {MAP_PATH}")
    except Exception as e:  # noqa: BLE001
        log(f"ERROR creating level (create {MAP_PATH} manually, then re-run): {e}")
        raise SystemExit(1)
    unreal.EditorLevelLibrary.load_level(MAP_PATH)


def clear_previous():
    count = 0
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        try:
            if "vrg" in [str(t) for t in actor.tags]:
                unreal.EditorLevelLibrary.destroy_actor(actor)
                count += 1
        except Exception:  # noqa: BLE001, S110
            pass
    log(f"Cleared {count} previous VRG actors")


BASE_MAT = None


def base_material():
    global BASE_MAT
    if BASE_MAT is None:
        BASE_MAT = unreal.EditorAssetLibrary.load_asset("/Engine/BasicShapes/BasicShapeMaterial")
    return BASE_MAT


def spawn_part(part_id, shape, loc, size_cm, rot=(0, 0, 0), color=(0.6, 0.6, 0.6)):
    """loc in web units (x fwd, y up, z side) -> UE cm (x fwd, y side, z up)."""
    mesh = load_shape(shape)
    if not mesh:
        return None
    x, y, z = loc
    location = unreal.Vector(x * S, z * S, y * S + ZOFF)
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(
        unreal.StaticMeshActor, location, unreal.Rotator(*rot)
    )
    actor.set_actor_label(f"VRG_{part_id}")
    actor.tags.append("vrg")
    actor.tags.append(f"part:{part_id}")
    # BasicShapes are 100 cm; scale to desired size.
    actor.set_actor_scale3d(unreal.Vector(size_cm[0] / 100.0, size_cm[2] / 100.0, size_cm[1] / 100.0))
    comp = actor.static_mesh_component
    comp.set_static_mesh(mesh)
    comp.set_mobility(unreal.ComponentMobility.MOVABLE)
    try:
        mat = base_material()
        if mat:
            mid = comp.create_dynamic_material_instance(0, mat)
            mid.set_vector_parameter_value("Color", unreal.LinearColor(*color, 1.0))
    except Exception:  # noqa: BLE001
        pass  # color is cosmetic; geometry + tags are what matter
    return actor


def spawn_light(light_class, loc_cm, rot, intensity, color, label):
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(
        light_class, unreal.Vector(*loc_cm), unreal.Rotator(*rot)
    )
    actor.set_actor_label(label)
    actor.tags.append("vrg")
    try:
        comp = actor.get_component_by_class(unreal.LightComponent)
        comp.set_editor_property("intensity", intensity)
        comp.set_light_color(unreal.LinearColor(*color, 1.0))
    except Exception:  # noqa: BLE001
        pass
    return actor


# (part_id, shape, (x,y,z) web units, (w,h,d) cm, rot, rgb)
PARTS = [
    ("engineBlock", "box", (0, 1.25, 0), (64, 30, 36), (0, 0, 0), (0.24, 0.26, 0.30)),
    ("oilPan", "box", (0, 0.28, 0), (56, 10, 30), (0, 0, 0), (0.11, 0.12, 0.14)),
    ("headGasket", "box", (0, 2.04, 0), (60, 1.5, 34), (0, 0, 0), (0.69, 0.44, 0.23)),
    ("cylinderHead", "box", (0, 2.40, 0), (60, 12, 34), (0, 0, 0), (0.60, 0.64, 0.68)),
    ("valveCover", "box", (0, 3.05, 0), (58, 7, 32), (0, 0, 0), (0.09, 0.10, 0.11)),
    ("camIntake", "cyl", (0, 2.78, -0.35), (58, 4, 4), (0, 0, 0), (0.83, 0.85, 0.88)),
    ("camExhaust", "cyl", (0, 2.78, 0.35), (58, 4, 4), (0, 0, 0), (0.83, 0.85, 0.88)),
    ("timingCover", "box", (1.78, 1.85, 0), (7, 46, 38), (0, 0, 0), (0.52, 0.55, 0.58)),
    ("crankPulley", "cyl", (2.06, 1.10, 0), (8, 17, 17), (0, 90, 0), (0.17, 0.19, 0.22)),
    ("idlerPulley", "cyl", (2.06, 1.95, 0.48), (6, 6, 6), (0, 90, 0), (0.17, 0.19, 0.22)),
    ("mgu", "cyl", (1.75, 2.95, -1.15), (14, 17, 17), (0, 90, 0), (0.29, 0.32, 0.38)),
    ("vacuumPump", "box", (2.05, 2.30, 0.62), (8, 10, 10), (0, 0, 0), (0.14, 0.15, 0.17)),
    ("turbo", "cyl", (-1.10, 1.85, 1.45), (10, 14, 14), (90, 0, 0), (0.48, 0.29, 0.16)),
    ("exhaustManifold", "box", (-0.55, 2.10, 1.00), (40, 5, 4), (0, 0, 0), (0.35, 0.23, 0.16)),
    ("intakeManifold", "box", (-0.20, 2.50, -1.15), (48, 8, 10), (0, 0, 0), (0.11, 0.13, 0.15)),
    ("fuelRail", "cyl", (0, 2.62, -0.62), (52, 2.5, 2.5), (0, 0, 0), (0.78, 0.80, 0.83)),
    ("acCompressor", "cyl", (1.00, 0.62, 1.05), (11, 12, 12), (0, 90, 0), (0.23, 0.25, 0.28)),
    ("camSensor", "box", (1.35, 2.95, 0.35), (4, 3, 4), (0, 0, 0), (0.83, 0.24, 0.24)),
    ("tmap", "box", (-0.20, 2.75, -1.12), (4, 4, 3), (0, 0, 0), (0.24, 0.44, 0.83)),
    ("egrSensor", "cyl", (-0.60, 2.20, 1.00), (5, 2.5, 2.5), (90, 0, 0), (0.24, 0.83, 0.48)),
]


def build():
    get_or_create_level()
    clear_previous()

    # Floor + stand (absolute cm, no ZOFF).
    floor = unreal.EditorLevelLibrary.spawn_actor_from_class(
        unreal.StaticMeshActor, unreal.Vector(0, 0, -5), unreal.Rotator(0, 0, 0)
    )
    floor.set_actor_label("VRG_Floor")
    floor.tags.append("vrg")
    floor.set_actor_scale3d(unreal.Vector(12, 12, 0.1))
    floor.static_mesh_component.set_static_mesh(load_shape("box"))

    for i, part in enumerate(PARTS):
        # head bolts: ring of 10 small cylinders instead of one mesh.
        if part[0] == "cylinderHead":
            for zi, z in enumerate((-0.72, 0.72)):
                for xi in range(5):
                    spawn_part(
                        f"headBolts_{zi}_{xi}", "cyl",
                        (-1.3 + xi * 0.65, 2.70, z), (2, 10, 2),
                        color=(0.78, 0.80, 0.83),
                    )
        spawn_part(*part)
        if i % 6 == 0:
            log(f"... {i + 1}/{len(PARTS)} parts")

    # Stand legs + top plate.
    for lx, lz in ((-25, -15), (25, -15), (-25, 15), (25, 15)):
        leg = unreal.EditorLevelLibrary.spawn_actor_from_class(
            unreal.StaticMeshActor, unreal.Vector(lx, lz, 40), unreal.Rotator(0, 0, 0)
        )
        leg.set_actor_label("VRG_StandLeg")
        leg.tags.append("vrg")
        leg.set_actor_scale3d(unreal.Vector(0.06, 0.06, 0.8))
        leg.static_mesh_component.set_static_mesh(load_shape("box"))
    plate = unreal.EditorLevelLibrary.spawn_actor_from_class(
        unreal.StaticMeshActor, unreal.Vector(0, 0, 78), unreal.Rotator(0, 0, 0)
    )
    plate.set_actor_label("VRG_StandPlate")
    plate.tags.append("vrg")
    plate.set_actor_scale3d(unreal.Vector(0.8, 0.6, 0.04))
    plate.static_mesh_component.set_static_mesh(load_shape("box"))

    # Lights.
    spawn_light(unreal.DirectionalLight, (300, 200, 500), (-50, -30, 0), 3.0, (1.0, 0.97, 0.92), "VRG_KeyLight")
    spawn_light(unreal.PointLight, (-150, -120, 220), (0, 0, 0), 800.0, (1.0, 0.55, 0.25), "VRG_WarmFill")
    spawn_light(unreal.PointLight, (150, 150, 200), (0, 0, 0), 500.0, (0.55, 0.70, 1.0), "VRG_CoolFill")

    # Fly-camera spectator, auto-possessed by player 0.
    try:
        pawn = unreal.EditorLevelLibrary.spawn_actor_from_class(
            unreal.DefaultPawn, unreal.Vector(170, 190, 190), unreal.Rotator(-25, -225, 0)
        )
        pawn.set_actor_label("VRG_Spectator")
        pawn.tags.append("vrg")
        pawn.set_editor_property("auto_possess_player", unreal.AutoPossessPlayer.PLAYER_0)
        log("Spectator placed (auto-possess Player 0)")
    except Exception as e:  # noqa: BLE001
        log(f"WARNING: place a DefaultPawn manually and set Auto Possess Player = Player 0 ({e})")

    unreal.EditorLevelLibrary.save_current_level()
    log(f"DONE: {MAP_PATH} built with {len(PARTS)} parts. Save-all in the editor and press Play to test.")


if __name__ == "__main__":
    build()
