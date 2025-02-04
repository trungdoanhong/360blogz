'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import MarkdownToolbar from '@/components/MarkdownToolbar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function NewBlog() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
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
    return null;
  }

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
    if (!user) return;

    try {
      setLoading(true);
      let imageUrl = null;
      let processedContent = content;

      // Upload cover image
      if (image) {
        imageUrl = await uploadImage(image);
      }

      // Process content to find and upload any inline images that are base64 or blob URLs
      const markdownImageRegex = /!\[.*?\]\((blob:.*?|data:image\/.*?)\)/g;
      const matches = content.match(markdownImageRegex);

      if (matches) {
        for (const match of matches) {
          try {
            // Extract the URL from the markdown syntax
            const urlMatch = match.match(/!\[.*?\]\((.*?)\)/);
            if (urlMatch && urlMatch[1]) {
              const blobUrl = urlMatch[1];
              
              // Fetch the image from blob URL
              const response = await fetch(blobUrl);
              const blob = await response.blob();
              
              // Create a File object from the blob
              const file = new File([blob], 'image.jpg', { type: blob.type });
              
              // Upload the image
              const uploadedUrl = await uploadImage(file);
              
              // Replace the blob URL with the uploaded URL in the content
              processedContent = processedContent.replace(blobUrl, uploadedUrl);
            }
          } catch (error) {
            console.error('Error processing inline image:', error);
          }
        }
      }

      const now = new Date().toISOString();
      const blogData = {
        title,
        content: processedContent, // Use the processed content with uploaded image URLs
        tags: tags.split(',').map(tag => tag.trim()),
        image: imageUrl,
        authorId: user.id,
        author: {
          name: user.name,
          profilePic: user.profilePic,
        },
        createdAt: now,
        updatedAt: now,
        likes: 0,
      };

      await addDoc(collection(db, 'blogs'), blogData);
      toast.success('Blog post created successfully!');
      router.push('/');
    } catch (error) {
      console.error('Error creating blog post:', error);
      toast.error('Failed to create blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>
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
            {image && (
              <img
                src={URL.createObjectURL(image)}
                alt="Cover preview"
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

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 