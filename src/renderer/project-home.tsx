import React, { useEffect, useRef, useState } from "react";
import { call } from "./bridge";
import { flushControlEdits } from "./control-edits";
import { Icon } from "./icons";

type Project = { id: string; name: string; path: string; available: boolean };
export function ProjectHome({
  current,
  onReturn,
}: {
  current?: { name: string; path: string };
  onReturn: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [errorTitle, setErrorTitle] = useState("Couldn't load projects");
  const retry = useRef<() => void>(() => location.reload());
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    let live = true;
    void call<{ projects: Project[] }>({ type: "projects" })
      .then(
        (result) => {
          if (live) setProjects(result.projects);
        },
        (e) => {
          if (live) setError(String(e));
        },
      )
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  async function open(type: "project_open" | "project_create", id?: string) {
    retry.current = () => void open(type, id);
    setErrorTitle(
      type === "project_create"
        ? "Couldn't create project"
        : "Couldn't open project",
    );
    setBusy(true);
    setError(undefined);
    try {
      await flushControlEdits();
      const result = await call<{ origin?: string }>({ type, id });
      if (result.origin) {
        const url = new URL(result.origin);
        if (new URLSearchParams(location.search).has("desktop"))
          url.searchParams.set("desktop", "1");
        if (url.origin === location.origin) onReturn();
        else location.assign(url.href);
      }
    } catch (e) {
      setError(String(e).replace(/^Error: /, ""));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main
      className="project-home"
      aria-label="Projects"
      aria-busy={busy || loading}
    >
      <div className="home-toolbar">
        {current && (
          <button className="ui-button" onClick={onReturn}>
            <Icon name="arrowLeft" />
            {current.name}
          </button>
        )}
      </div>
      <div className="home-content">
        <header className="home-heading">
          <h1 tabIndex={-1} ref={heading}>
            Projects
          </h1>
          <div className="home-actions">
            <button
              className="ui-button"
              disabled={busy}
              onClick={() => void open("project_open")}
            >
              Open folder
            </button>
            <button
              className="ui-button"
              disabled={busy}
              onClick={() => void open("project_create")}
            >
              <Icon name="plus" />
              New project
            </button>
          </div>
        </header>
        {error && (
          <section aria-label="Project error" data-transport-keys="ignore">
            <p className="home-error" role="alert">
              {errorTitle}
            </p>
            <button
              className="ui-button"
              disabled={busy}
              onClick={() => retry.current()}
            >
              Retry
            </button>
            <details>
              <summary>Technical details</summary>
              <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {error}
              </pre>
            </details>
          </section>
        )}
        {loading ? (
          <span className="spinner" aria-label="Loading projects" />
        ) : (
          <div className="home-projects">
            {projects.map((project) => (
              <button
                className="home-project"
                key={project.id}
                disabled={busy || !project.available}
                onClick={() =>
                  project.path === current?.path
                    ? onReturn()
                    : void open("project_open", project.id)
                }
              >
                <Icon name="folder" size={22} />
                <span className="home-project-details">
                  <span className="home-project-name">{project.name}</span>
                  <span className="home-project-path">{project.path}</span>
                </span>
                {!project.available && <span>Folder unavailable</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
