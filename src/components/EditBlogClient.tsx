'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import MarkdownToolbar from '@/components/MarkdownToolbar';
import { Blog } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function EditBlogClient() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;
      const docRef = doc(db, 'blogs', id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const blogData = docSnap.data() as Blog;
        // Check if the current user is the author
        if (user?.id !== blogData.authorId) {
          toast.error('You are not authorized to edit this post');
          router.push(`/blog/${id}`);
          return;
        }
        
        setTitle(blogData.title);
        setContent(blogData.content);
        setTags(blogData.tags.join(', '));
        setCurrentImage(blogData.image || null);
      } else {
        toast.error('Blog post not found');
        router.push('/');
      }
    };

    if (user) {
      fetchBlog();
    }
  }, [id, user, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', '360blogz');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    return data.secure_url;
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    try {
      setLoading(true);
      let imageUrl = currentImage;

      if (image) {
        imageUrl = await uploadImage(image);
      }

      const blogRef = doc(db, 'blogs', id as string);
      await updateDoc(blogRef, {
        title,
        content,
        tags: tags.split(',').map(tag => tag.trim()),
        image: imageUrl,
        updatedAt: new Date().toISOString(),
      });

      toast.success('Blog post updated successfully!');
      router.push(`/blog/${id}`);
    } catch (error) {
      toast.error('Failed to update blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div>
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p>Please login to edit this post.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Blog Post</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content (Markdown supported)
              </label>
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                {isPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            
            {!isPreview ? (
              <>
                <MarkdownToolbar 
                  textareaRef={contentRef} 
                  onContentChange={handleContentChange}
                />
                <textarea
                  ref={contentRef}
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={15}
                  className="mt-0 block w-full border border-t-0 border-gray-300 rounded-b-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </>
            ) : (
              <div className="mt-1 prose prose-lg max-w-none border border-gray-300 rounded-md p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || '*No content*'}
                </ReactMarkdown>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="technology, personal, lifestyle"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Cover Image
            </label>
            {currentImage && (
              <img
                src={currentImage}
                alt="Current cover"
                className="mt-2 w-full h-48 object-cover rounded-lg"
              />
            )}
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-2 block w-full"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 