import fs from "node:fs/promises";
import path from "node:path";

type Document = { path: string; hash: string; content: string; links: string[] };
type Bundle = {
  schemaVersion: number;
  version: string;
  skills: { name: string; description: string; path: string; hash: string; files: string[] }[];
  documents: Record<string, Document>;
};

export const guidanceInstructions =
  "Start with capabilities and guidance (CLI: skills; MCP: tilt_guidance). Read workspace-context for authoring workflow and motion-design for creative motion decisions, then load only relevant guides. Guidance paths are logical document IDs: retrieve them through guidance, not scene read_file. Scene content uses the guarded file commands. Inspect authored output with review. Follow project-specific instructions too.";

/** Reads the installed runtime's bundle, never the agent's cwd or project secrets. */
export class GuidanceLibrary {
  private bundle?: Promise<Bundle>;
  constructor(readonly runtime: string) {}
  private load() {
    return this.bundle ??= fs.readFile(path.join(this.runtime, "guidance.json"), "utf8")
      .then(text => JSON.parse(text) as Bundle)
      .catch(error => {
        this.bundle = undefined;
        throw new Error(`Tilt guidance unavailable; rebuild the runtime bundle. ${String(error)}`);
      });
  }
  async catalogue() {
    const bundle = await this.load();
    return {
      version: bundle.version,
      instructions: guidanceInstructions,
      entrypoints: {
        workspace: ".agents/skills/workspace-context/SKILL.md",
        motion: ".agents/skills/motion-design/SKILL.md",
      },
      skills: bundle.skills,
      documents: Object.values(bundle.documents).map(({ path, hash }) => ({ path, hash })),
    };
  }
  async read(documentPath: string) {
    const bundle = await this.load();
    if (!Object.hasOwn(bundle.documents, documentPath))
      throw new Error("Unknown guidance document. Use guidance without a path to list available documents.");
    return { version: bundle.version, ...bundle.documents[documentPath] };
  }
}

export function projectAgentInstructions(cliPath?: string) {
  // Quote a POSIX shell argument without allowing interpolation of installation paths.
  const cli = cliPath ? `node '${cliPath.replaceAll("'", "'\\''")}'` : "<Tilt CLI>";
  return `# Working in this Tilt project\n\n${guidanceInstructions}\n\nFrom this folder, use:\n\n\`\`\`sh\n${cli} capabilities\n${cli} skills\n${cli} skill motion-design\n${cli} skill workspace-context\n\`\`\`\n\nIf the installation moved, use its current CLI path or the connected Tilt MCP tools. For a remote workspace, configure TILT_URL and a scoped runtime-injected TILT_TOKEN. Do not store credentials here. The guidance catalogue comes from the connected runtime and includes document hashes and followable paths.\n\nScene files are creative authority. Preserve real source UI, use revision-guarded edit groups, sample from absolute time, expose meaningful controls/tracks, and verify rendered output. Do not persist authored state only in the agent conversation.\n`;
}
