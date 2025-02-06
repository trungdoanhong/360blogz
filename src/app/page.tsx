'use client';

import Navigation from '@/components/Navigation';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Blog } from '@/types';
import { useEffect, useState, Suspense } from 'react';
import BlogCard from '@/components/BlogCard';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Loading component
function LoadingUI() {
  return (
    <div>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main content component
function HomeContent() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const tag = searchParams?.get('tag');

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const blogsRef = collection(db, 'blogs');
        let q;
        
        if (tag) {
          q = query(
            blogsRef,
            where('tags', 'array-contains', tag),
            orderBy('createdAt', 'desc')
          );
        } else {
          q = query(blogsRef, orderBy('createdAt', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        const blogsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Blog[];

        setBlogs(blogsData);

        // Fetch all tags in a separate query if needed
        if (!tag) {
          const allBlogsSnapshot = await getDocs(query(blogsRef));
          const tags = new Set<string>();
          allBlogsSnapshot.docs.forEach(doc => {
            const blogData = doc.data();
            blogData.tags?.forEach((tag: string) => tags.add(tag));
          });
          setAllTags(Array.from(tags));
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, [tag]);

  if (loading) {
    return <LoadingUI />;
  }

  return (
    <div>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
          <div>
            {tag ? (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Posts tagged with #{tag}
                </h1>
                <Link 
                  href="/"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  ← Back to all posts
                </Link>
              </div>
            ) : (
              <h1 className="text-3xl font-bold text-gray-900">
                All Posts
              </h1>
            )}
          </div>
          
          {!tag && allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {allTags.map((t) => (
                <Link
                  key={t}
                  href={`/?tag=${t}`}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {blogs.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900">
              {tag ? `No posts found with tag #${tag}` : 'No posts found'}
            </h2>
            <p className="mt-2 text-gray-600">
              {tag ? (
                <>
                  Try searching for a different tag or{' '}
                  <Link href="/" className="text-indigo-600 hover:underline">
                    view all posts
                  </Link>
                </>
              ) : (
                'Check back later for new posts'
              )}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Main page component with Suspense
export default function HomePage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <HomeContent />
    </Suspense>
  );
}
