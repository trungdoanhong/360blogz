'use client';

import Navigation from '@/components/Navigation';
// Removed unused Firestore imports - now handled by services
import { Blog, PaginatedResult } from '@/types';
import { useEffect, useState, Suspense } from 'react';
import BlogCard from '@/components/BlogCard';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchBlogsWithPagination, searchBlogs, getFeaturedBlogs } from '@/utils/blogService';
import { getTagsForFilter } from '@/utils/tagService';
import Pagination from '@/components/Pagination';
import { BlogCardSkeleton } from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

// Loading component
function LoadingUI() {
  return (
    <div>
      <Navigation />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// Main content component
function HomeContent() {
  const [paginatedResult, setPaginatedResult] = useState<PaginatedResult<Blog> | null>(null);
  const [featuredBlogs, setFeaturedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  const tag = searchParams?.get('tag');
  const search = searchParams?.get('search');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch featured blogs for homepage
        if (!tag && !search && currentPage === 1) {
          try {
            const featured = await getFeaturedBlogs(3);
            setFeaturedBlogs(featured);
          } catch (error) {
            console.error('Error fetching featured blogs:', error);
          }
        }
        
        let result: PaginatedResult<Blog>;
        
        if (search) {
          // Search blogs
          result = await searchBlogs(search, currentPage);
        } else {
          // Fetch with filters
          const filters = {
            published: true,
            ...(tag && { tags: [tag] })
          };
          result = await fetchBlogsWithPagination(currentPage, filters);
        }
        
        setPaginatedResult(result);
        
        // Fetch tags efficiently
        if (currentPage === 1 && !search) {
          try {
            const tags = await getTagsForFilter(tag || undefined);
            setAllTags(tags);
          } catch (error) {
            console.error('Error fetching tags:', error);
          }
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        
        // More specific error handling
        let errorMessage = 'Failed to load blogs. Please try again.';
        if (error instanceof Error) {
          if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection.';
          } else if (error.message.includes('permission')) {
            errorMessage = 'Permission denied. Please try logging in again.';
          }
        }
        
        toast.error(errorMessage);
        setPaginatedResult({
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tag, search, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tag, search]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !paginatedResult) {
    return <LoadingUI />;
  }

  return (
    <div>
      <Navigation />
      {/* Add padding-top to account for fixed navigation */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {search ? `Search results for "${search}"` : 
             tag ? `Posts tagged "${tag}"` : 'Latest Blog Posts'}
          </h1>
          
          {/* Tag filter */}
          {!search && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Link
                href="/"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  !tag 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </Link>
              {allTags.slice(0, 10).map((tagName) => (
                <Link
                  key={tagName}
                  href={`/?tag=${encodeURIComponent(tagName)}`}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    tag === tagName
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tagName}
                </Link>
              ))}
              {allTags.length > 10 && (
                <span className="px-3 py-1 text-sm text-gray-500">
                  +{allTags.length - 10} more
                </span>
              )}
            </div>
          )}
          
          {/* Results info */}
          {paginatedResult && (
            <p className="text-gray-600 text-sm mb-4">
              {paginatedResult.pagination.totalItems === 0 
                ? 'No posts found' 
                : `Showing ${paginatedResult.data.length} of ${paginatedResult.pagination.totalItems} posts`
              }
            </p>
          )}
        </div>

        {/* Featured blogs section */}
        {featuredBlogs.length > 0 && !tag && !search && currentPage === 1 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Posts</h2>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {featuredBlogs.map((blog) => (
                <div key={blog.id} className="relative">
                  <BlogCard blog={blog} />
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-lg">
                      ⭐ Featured
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-8"></div>
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        )}
        
        {/* Main blog list */}
        {!loading && paginatedResult && (
          <>
            {paginatedResult.data.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {search ? 'No search results' : tag ? 'No posts with this tag' : 'No blog posts yet'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {search ? 'Try a different search term' : 
                     tag ? 'Try browsing other tags' : 
                     'Be the first to share your thoughts!'}
                  </p>
                  {!search && !tag && (
                    <Link 
                      href="/new-blog" 
                      className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Write the first post
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                  {paginatedResult.data.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
                  ))}
                </div>
                
                {/* Pagination */}
                <Pagination
                  currentPage={paginatedResult.pagination.currentPage}
                  totalPages={paginatedResult.pagination.totalPages}
                  onPageChange={handlePageChange}
                  className="mt-12"
                />
              </>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <HomeContent />
    </Suspense>
  );
}