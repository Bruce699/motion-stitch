import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { BlogPostsIcon } from '~/icons/navigation/blog-posts';

export function BlogPostsToolbar({ hasBlogPosts }: { hasBlogPosts: boolean }) {
  useToolbar({
    title: 'Blog posts',
    hidden: !hasBlogPosts,
    icon: <BlogPostsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Blog posts',
        icon: <BlogPostsIcon />,
        variant: 'title',
      },
    ],
    actions: hasBlogPosts
      ? [
          {
            type: 'secondary',
            icon: 'Pen',
            label: 'Manage',
            onClick: () => {},
          },
        ]
      : undefined,
  });

  return null;
}
