'use client';

import Navigation from '@/components/Navigation';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Blog } from '@/types';
import { useEffect, useState } from 'react';
import BlogCard from '@/components/BlogCard';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag');

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
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, [tag]);

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tag && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Posts tagged with #{tag}
            </h1>
          </div>
        )}
        
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
              {tag ? 'Try searching for a different tag' : 'Check back later for new posts'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
