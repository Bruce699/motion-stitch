import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { BlogPostsEmptyStateVisual } from './blog-posts-empty-state-visual';

export function BlogPostsEmptyState() {
  return (
    <div className="relative isolate flex flex-1 items-center overflow-hidden rounded-3xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <svg
          className="absolute inset-0 size-full"
          viewBox="0 0 1024 768"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="blog-posts-empty-state-page-lines"
              width="1024"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 23.5H1024" stroke="rgb(219 234 254 / 0.72)" />
            </pattern>
          </defs>
          <rect width="1024" height="768" fill="white" />
          <rect
            width="1024"
            height="768"
            fill="url(#blog-posts-empty-state-page-lines)"
          />
          <path d="M52 0V768" stroke="rgb(254 202 202 / 0.52)" />
          <path d="M68 0V768" stroke="rgb(254 202 202 / 0.36)" />
        </svg>
      </div>
      <BlogPostsEmptyStateVisual />
      <div className="relative z-2 mx-auto flex w-220 flex-col">
        <div className="text-3xl font-medium">
          <h1 className="mb-1 text-3xl">Blog posts</h1>
          <p className="text-muted-foreground">Get the word out</p>
        </div>
        <div className="mt-10 inline-flex gap-3">
          <Button
            onClick={() => {}}
            type="button"
            prefix={<Icon name="Plus" />}
          >
            Create blog post
          </Button>
          <Button onClick={() => {}} type="button" variant="secondary">
            Learn more
          </Button>
        </div>
      </div>
    </div>
  );
}
