/** Keep diagnostics intact while removing transport wrappers from the summary. */
export function presentError(raw: string) {
  const message = raw
    .replace(/^Error invoking remote method '[^']+':\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();
  if (
    /not valid JSON|Unexpected (?:token|end).*JSON|JSON\.parse/i.test(message)
  ) {
    return { title: "Couldn’t read the response", summary: null, details: raw };
  }
  if (
    /Failed to fetch|NetworkError|ERR_CONNECTION|runtime disconnected/i.test(
      message,
    )
  ) {
    return {
      title: "Connection interrupted",
      summary: "Check that Tilt is running, then retry.",
      details: raw,
    };
  }
  return {
    title: "Something went wrong",
    summary: message.split("\n")[0].slice(0, 240) || null,
    details: raw,
  };
}
