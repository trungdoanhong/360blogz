'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import Navigation from '@/components/Navigation';
import BlogCard from '@/components/BlogCard';
import { Blog } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePic?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
}

export default function UserProfileClient() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndBlogs = async () => {
      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', id as string));
        if (userDoc.exists()) {
          setUser({
            id: userDoc.id,
            ...userDoc.data()
          } as UserProfile);

          // Fetch user's blogs
          let blogsQuery;
          if (currentUser?.id === id) {
            // If viewing own profile, show all blogs
            blogsQuery = query(
              collection(db, 'blogs'),
              where('authorId', '==', id),
              orderBy('createdAt', 'desc')
            );
          } else {
            // If viewing other's profile, show only published blogs
            // First get all blogs
            const allBlogsQuery = query(
              collection(db, 'blogs'),
              where('authorId', '==', id),
              orderBy('createdAt', 'desc')
            );

            const blogsSnapshot = await getDocs(allBlogsQuery);
            const blogsList = blogsSnapshot.docs
              .map(doc => {
                const data = doc.data();
                // Consider a post as published if published is true or not set
                const isPublished = data.published === undefined || data.published === true;
                if (!isPublished) return null;

                return {
                  id: doc.id,
                  ...data,
                  author: {
                    id: userDoc.id,
                    name: userDoc.data().name,
                    profilePic: userDoc.data().profilePic
                  },
                  published: true
                } as Blog;
              })
              .filter(blog => blog !== null) as Blog[];
            
            setBlogs(blogsList);
            return; // Exit early as we've already set the blogs
          }

          // For own profile, continue with the original query
          const blogsSnapshot = await getDocs(blogsQuery);
          const blogsList = blogsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              author: {
                id: userDoc.id,
                name: userDoc.data().name,
                profilePic: userDoc.data().profilePic
              },
              published: data.published === undefined ? true : data.published
            } as Blog;
          });
          
          setBlogs(blogsList);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserAndBlogs();
    }
  }, [id, currentUser]);

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p>User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            {user.profilePic && (
              <img
                src={user.profilePic}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              {user.bio && <p className="text-gray-600 mt-2">{user.bio}</p>}
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span>{user.followers?.length || 0} followers</span>
                <span>{user.following?.length || 0} following</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">
          {currentUser?.id === id ? 'Your Posts' : 'Published Posts'}
        </h2>
        {blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No posts yet</p>
        )}
      </div>
    </div>
  );
} 