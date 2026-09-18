# Apply motion design in Tilt

This adapter connects creative decisions to existing Tilt contracts. The creative core and six guides do not depend on these APIs. Resolve the implementation skills in the current Tilt checkout; if this skill folder is moved, update these relative links.

1. Read [workspace-context](../../workspace-context/SKILL.md) for current viewer evidence, file authority and coordinated edit groups. Preserve inspection pan/zoom/orbit as inspection state.
2. Use [scene-authoring](../../scene-authoring/SKILL.md) for executable composition, absolute time, lifecycle and verification. Use its current contracts rather than introducing another clock or animation store.
3. Represent useful independent actions with meaningful tracks/groups following [animation groups](../../../../docs/animation-groups.md). Coordinate child timing without making every DOM element a lane. The declared intervals must drive the authored motion. Keep independently editable camera actions separate where useful.
4. For real interfaces, use [import-web-ui](../../import-web-ui/SKILL.md). For separation or depth, use [ui-layers](../../ui-layers/SKILL.md) and the shared layered-source helper. Do not substitute a drawn approximation or duplicate the capture system.
5. For cameras, geometry and materials, use [custom-rendering](../../custom-rendering/SKILL.md) and [the camera contract](../../../../docs/camera.md). Reuse the shared projection state; choose exact projection controls when isometric geometry is requested.
6. Expose useful creative choices through [parameter-controls](../../parameter-controls/SKILL.md). Prefer controls that affect the intended result—separation, framing, emphasis or group timing—over every implementation variable. Reuse existing values and conventions.
7. Follow [resolution guidance](../../../../docs/resolution.md) for close-ups. Keep CSS layout, output size and capture density separate.

Verify the affected entry, busiest or maximum-separation state, and arrival. Play neighboring scenes together when editing their handoff. Check backward seeking, relevant controls and the actual export according to the execution skills. For lifted UI, inspect duplicate paint, clipping, masks and reassembly alignment.

New creative treatments normally belong in authored composition code. The motion-design skill does not authorize new editor widgets, engine effects, alternate renderers or changes to unrelated scenes. If the current host cannot achieve the intended result, identify the concrete limitation and available alternatives before expanding implementation scope.
