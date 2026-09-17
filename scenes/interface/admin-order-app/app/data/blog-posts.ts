import type { RichTextEditorValue } from '~/ui';

export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: RichTextEditorValue;
  status: string;
  author: string;
  publishedAt?: string;
};

const blogPosts: BlogPost[] = [];

function getBlogPost(blogPostId: string) {
  return blogPosts.find((blogPost) => blogPost.id === blogPostId);
}

function useBlogPostsData() {
  return blogPosts;
}

export { blogPosts, getBlogPost, useBlogPostsData };
