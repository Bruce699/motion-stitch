export type PreviewRevisionNode = {
  revision: string;
  dependencies: readonly string[];
};

/** Only a composition and its reachable children can change its poster pixels.
 * Missing references and cycles still produce a stable key; preparing a preview
 * remains responsible for reporting invalid composition documents.
 */
export function compositionPreviewKey(
  rootId: string,
  nodes: ReadonlyMap<string, PreviewRevisionNode>,
) {
  const reachable = new Set<string>();
  const visit = (id: string) => {
    if (reachable.has(id)) return;
    reachable.add(id);
    for (const dependency of nodes.get(id)?.dependencies ?? [])
      visit(dependency);
  };
  visit(rootId);
  return JSON.stringify(
    [...reachable].sort().map((id) => [id, nodes.get(id)?.revision ?? null]),
  );
}
