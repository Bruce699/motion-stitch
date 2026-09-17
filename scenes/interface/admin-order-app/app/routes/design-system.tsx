import { useEffect, useState } from 'react';
import { components } from './design-system/catalog';
import { getComponentDocs } from './design-system/component-docs';
import { Markdown } from './design-system/markdown';

const catalogComponents = Array.from(components).sort((first, second) =>
  first.name.localeCompare(second.name),
);

export function meta() {
  return [{ title: 'Design System - Shopify' }];
}

export default function DesignSystemRoute() {
  return (
    <main className="h-full w-full overflow-auto bg-background text-foreground">
      <div className="mx-auto grid min-h-dvh w-full max-w-420 grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="sticky top-0 z-10 max-h-dvh overflow-auto border-b border-border bg-background/95 p-5 backdrop-blur lg:border-r lg:border-b-0">
          <div className="flex flex-col gap-4">
            <div className="ml-1.5 flex flex-col">
              <a
                href="/store"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to admin
              </a>
              <h1 className="mt-1 text-2xl font-medium">Design System</h1>
            </div>

            <nav
              aria-label="Design system components"
              className="flex flex-col gap-0.5"
            >
              {catalogComponents.map((component) => (
                <a
                  key={component.slug}
                  href={`#${component.slug}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span>{component.name}</span>
                </a>
              ))}
            </nav>

            <nav
              aria-label="Design system foundations"
              className="border-t border-border pt-3"
            >
              <a
                href="#transitions"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <span>Transitions</span>
              </a>
            </nav>
          </div>
        </aside>

        <div className="px-5 py-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-8">
            {catalogComponents.map((component) => {
              const docs = getComponentDocs(component.slug);

              return (
                <section
                  key={component.slug}
                  id={component.slug}
                  className="scroll-mt-6 rounded-2xl border bg-white"
                >
                  <header className="border-b border-border p-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold tracking-tight">
                          {component.name}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {component.summary}
                      </p>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                    <div className="flex min-h-56 items-center justify-center overflow-visible border-b border-border bg-background p-6 xl:border-r xl:border-b-0">
                      <div className="w-full max-w-2xl">
                        {component.preview}
                      </div>
                    </div>
                    <div className="max-h-168 overflow-auto p-5">
                      {docs ? (
                        <Markdown content={docs} />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No markdown documentation found for this component.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}

            <section
              id="transitions"
              className="scroll-mt-6 rounded-2xl border bg-white"
            >
              <header className="border-b border-border p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold tracking-tight">
                      Transitions
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Motion tokens for default interface easing and rare
                    expressive feedback.
                  </p>
                </div>
              </header>

              <div className="bg-background p-6">
                <TransitionsDemoGrid />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function TransitionsDemoGrid() {
  const [isForward, setIsForward] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsForward((currentIsForward) => !currentIsForward);
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <TransitionDemo
        name="ease-out"
        timing="var(--ease-out)"
        duration="var(--ease-out-duration)"
        isForward={isForward}
        description="Default transition for short, functional UI changes."
      />
    </div>
  );
}

function TransitionDemo({
  name,
  timing,
  duration,
  isForward,
  description,
}: {
  name: string;
  timing: string;
  duration: string;
  isForward: boolean;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">{name}</h4>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          {duration}
        </code>
      </div>
      <div className="@container mx-auto h-12 w-1/3 p-2">
        <div
          className="size-8 rounded-full bg-foreground shadow-sm transition-transform motion-reduce:transition-none"
          style={
            {
              transform: isForward
                ? 'translateX(calc(100cqw - 2rem))'
                : 'translateX(0)',
              transitionDuration: duration,
              transitionTimingFunction: timing,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
