'use client';

import { Blog } from '@/types';
import Link from 'next/link';
import { useMemo } from 'react';
import { getAvatarSrc } from '@/utils/avatarUtils';

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
    if (!blog.content) return '';
    
    try {
      const content = blog.content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/!\[.*?\]\(.*?\)/g, '') // Remove markdown images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Replace markdown links with just the text
        .replace(/[#*`~_]/g, '') // Remove special markdown characters
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();
      
      return content.length > 200 ? content.substring(0, 200) + '...' : content;
    } catch (error) {
      console.error('Error cleaning content:', error);
      return 'Content preview unavailable';
    }
  }, [blog.content]); // Removed unnecessary blog.id dependency

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full group">
      <Link href={`/blog/${blog.id}`} className="flex-1">
        {thumbnailUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={thumbnailUrl}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-6 flex-1 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {blog.title}
          </h2>
          <div className="text-gray-600 flex-1">
            <p className="line-clamp-3 leading-relaxed text-sm">
              {cleanContent}
            </p>
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
            <img
              src={getAvatarSrc(blog.author?.profilePic, blog.author?.name)}
              alt={blog.author?.name || 'Author'}
              className="w-6 h-6 rounded-full mr-2 border border-gray-200"
            />
            <span>{blog.author?.name || 'Anonymous'}</span>
          </Link>
          <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
} 