export default function createScene({ THREE, world, camera, createLayeredSource }) {
  const search = createLayeredSource('search', { width: 12.8 });
  world.add(search.group);
  camera.position.set(0, 0, 7.2 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
  camera.lookAt(0, 0, 0);
  return {
    sample({ controls }) {
      for (const id of search.ids) {
        if (id === 'cursor') continue;
        const key = id.replaceAll('-', '_');
        const node = search.get(id).object;
        node.position.fromArray(controls.vector3(key + 'Position'));
        node.rotation.set(...controls.vector3(key + 'Rotation').map(THREE.MathUtils.degToRad));
        node.scale.setScalar(controls.number(key + 'Scale'));
      }
    }
  };
}
