'use client';

import { Blog } from '@/types';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMemo } from 'react';

interface BlogCardProps {
  blog: Blog;
}

export default function BlogCard({ blog }: BlogCardProps) {
  // Extract the first image from the content if no cover image
  const thumbnailUrl = useMemo(() => {
    if (blog.image) return blog.image;

    // Try to find the first image in the content
    const markdownImageRegex = /!\[.*?\]\((.*?)\)|<img.*?src=["'](.*?)["']/;
    const match = blog.content.match(markdownImageRegex);
    if (match) {
      // Return the first captured group (URL) from either markdown or HTML format
      return match[1] || match[2];
    }
    return null;
  }, [blog.image, blog.content]);

  // Clean content for preview by removing HTML tags and markdown syntax
  const cleanContent = useMemo(() => {
    let content = blog.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove markdown images
      .replace(/\[.*?\]\(.*?\)/g, '$1') // Replace markdown links with just the text
      .replace(/[#*`~]/g, '') // Remove special markdown characters
      .trim();
    return content.length > 200 ? content.substring(0, 200) + '...' : content;
  }, [blog.content]);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
      <Link href={`/blog/${blog.id}`} className="flex-1">
        {thumbnailUrl && (
          <div className="relative h-48">
            <img
              src={thumbnailUrl}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {blog.title}
          </h2>
          <div className="prose prose-sm line-clamp-3 text-gray-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {cleanContent}
            </ReactMarkdown>
          </div>
        </div>
      </Link>

      <div className="px-6 pb-4">
        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Author info */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
          <Link 
            href={`/user/${blog.authorId}`} 
            className="flex items-center hover:text-indigo-600 transition-colors"
          >
            {blog.author?.profilePic && (
              <img
                src={blog.author.profilePic}
                alt={blog.author.name}
                className="w-6 h-6 rounded-full mr-2"
              />
            )}
            <span>{blog.author?.name || 'Anonymous'}</span>
          </Link>
          <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
} 