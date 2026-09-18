# Choreography

Use this guide to organize relationships among moving elements. Spatial containment and timing groups need not be identical: a button may belong to a panel while participating in a different coordinated action.

Identify the leading action, supporting actions and useful stable references. Consider object motion and global framing separately before combining them.

## Coordinate a group

- **Use when:** several elements express one action, hierarchy or assembly.
- **Decide:** what leads; which elements share timing; which depend on another arrival; whether the group moves as a unit or changes internally.
- **Options:** simultaneous motion for direct comparison; stagger for ordered attention; overlap for flow; a deliberate pause for a changed idea.
- **Failure:** a uniform delay is applied to every element regardless of its role.
- **Check:** does the sequence reveal a relationship, or merely delay completion?

## Separate layers

Also retrieved as **exploded UI**, **layer reveal**, or **depth hierarchy**.

- **Use when:** overlap hides a relationship worth showing, or spatial separation is explicitly requested.
- **Decide:** the anchor; selected regions; direction and amount of separation; arrival order; whether the parts return to normal use.
- **Options:** translate in depth, offset laterally, rotate selected parts, or reveal with masking/highlighting when physical separation adds little.
- **Failure:** every surface floats equally; the original layout becomes unrecognizable; separated pieces duplicate the base UI.
- **Check:** can the viewer map parts back to the original interface? Inspect both maximum separation and any reassembled endpoint.

## Keep an anchor through change

- **Use when:** content changes rapidly or several channels move together.
- **Decide:** what persists—a subject, location, silhouette, outer frame or layout relationship. It need not stay at the center.
- **Options:** hold the carrier while changing its contents; preserve one part while others assemble; release the anchor deliberately at a chapter change.
- **Failure:** a fixed element obstructs the next composition, or everything moves and attention has no useful reference.
- **Check:** can the intended subject be followed through the busiest interval?

## Give channels distinct jobs

- **Use when:** position, scale, angle, opacity or framing need different arrival behavior.
- **Decide:** what each channel contributes and which endpoint it serves. Different starts and finishes can shape a path or hierarchy.
- **Options:** position arrives before rotation settles; scale establishes presence while layout resolves; local assembly occurs within broader reframing.
- **Failure:** independent easings accidentally create a hook, wobble or diagonal drift.
- **Check:** inspect the combined screen path, not just each channel in isolation. See [timing](timing.md).

Camera and elements may move together, independently or in opposition. Choose according to the visible result; opposing movement is not inherently more cinematic. A stable frame with active content can be the strongest choreography.
