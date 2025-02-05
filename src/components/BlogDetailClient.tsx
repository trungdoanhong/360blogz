'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Blog, Comment } from '@/types';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

export default function BlogDetailClient() {
  const { id } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;
      const docRef = doc(db, 'blogs', id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setBlog({ id: docSnap.id, ...docSnap.data() } as Blog);
      }
    };

    fetchBlog();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, 'comments'),
      where('blogId', '==', id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsList);
    });

    return () => unsubscribe();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !blog) return;

    try {
      await addDoc(collection(db, 'comments'), {
        blogId: blog.id,
        authorId: user.id,
        author: {
          name: user.name,
          profilePic: user.profilePic,
        },
        content: newComment,
        createdAt: new Date().toISOString(),
      });

      setNewComment('');
      toast.success('Comment added successfully!');
    } catch (error) {
      toast.error('Failed to add comment. Please try again.');
    }
  };

  if (!blog) {
    return (
      <div>
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <article className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
            <div className="flex items-center text-gray-600">
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <span>{blog.author?.name || 'Anonymous'}</span>
            </div>
          </div>
          {user && user.id === blog.authorId && (
            <Link
              href={`/blog/${blog.id}/edit`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Edit Post
            </Link>
          )}
        </div>

        {blog.image && (
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-96 object-cover rounded-lg mb-8"
          />
        )}

        <div className="prose prose-lg max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {blog.content}
          </ReactMarkdown>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Comments</h2>
          {user ? (
            <form onSubmit={handleAddComment} className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                required
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
              <button
                type="submit"
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Comment
              </button>
            </form>
          ) : (
            <p className="mb-8 text-gray-600">
              Please <a href="/login" className="text-indigo-600">login</a> to add a comment.
            </p>
          )}

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-6">
                <div className="flex items-center mb-2">
                  {comment.author?.profilePic ? (
                    <img
                      src={comment.author.profilePic}
                      alt={comment.author.name}
                      className="h-8 w-8 rounded-full mr-2"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 mr-2" />
                  )}
                  <div>
                    <p className="font-medium">{comment.author?.name || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
} 