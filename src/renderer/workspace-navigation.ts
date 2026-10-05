export type WorkspacePage = "home" | "playground" | "library" | "editor";

export function workspacePage(hash: string): WorkspacePage {
  const page = hash.replace(/^#/, "");
  return page === "home" || page === "library" || page === "editor"
    ? page
    : "playground";
}

/** Name-based collections stay useful before a composition has custom tags. */
export function compositionTags(
  name: string,
  custom: readonly string[] = [],
): string[] {
  const tags = [...custom];
  const order = name.match(/\border[\s-]*(\d{2})[\s-]?(\d{2})\b/i);
  if (order) tags.push(`Order ${order[1]}-${order[2]}`);
  if (/\bdemo\b/i.test(name)) tags.push("Demo videos");
  return [...new Set(tags)];
}
