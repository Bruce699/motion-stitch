import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { BlogPostsEmptyState } from '~/components/content/blog-posts-empty-state';
import { BlogPostsToolbar } from '~/components/content/blog-posts-toolbar';
import { useBlogPostsData } from '~/data/blog-posts';
import { useMainContent } from '~/components/main-content/hooks/use-main-content';

export default function BlogPostsPage() {
  const blogPostsData = useBlogPostsData();
  const hasBlogPosts = blogPostsData.length > 0;

  useMainContent({ showBottomScrim: hasBlogPosts });

  return (
    <>
      <BlogPostsToolbar hasBlogPosts={hasBlogPosts} />
      {hasBlogPosts ? (
        <MainContentLayout variant="fullWidth">
          <UnderConstruction />
        </MainContentLayout>
      ) : (
        <MainContentLayout variant="bleed">
          <BlogPostsEmptyState />
        </MainContentLayout>
      )}
    </>
  );
}
