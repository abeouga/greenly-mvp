import bpy
from mathutils import Vector
from pathlib import Path
root=Path.cwd()
bpy.ops.wm.open_mainfile(filepath=str(root/'assets/blender/tree-oak.blend'))
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE_NEXT'
scene.render.resolution_x=512
scene.render.resolution_y=512
scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.world.color=(0.25,0.25,0.25)
bpy.ops.object.camera_add(location=(5,-7,4))
camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,2))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=4.7
scene.camera=camera
for location,power,size in [((3,-4,7),650,5),((-4,1,5),400,5)]:
    bpy.ops.object.light_add(type='AREA',location=location)
    light=bpy.context.object
    light.data.energy=power
    light.data.shape='DISK'
    light.data.size=size
    light.rotation_euler=(Vector((0,0,2))-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(root/'artifacts/models/tree-oak-preview.png')
bpy.ops.render.render(write_still=True)
