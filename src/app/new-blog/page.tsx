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
import { validateBlogData, sanitizeContent } from '@/utils/validation';
import { checkRateLimit } from '@/utils/authorization';
import { resizeImage, validateImageFile, generateImagePreview } from '@/utils/imageUtils';

export default function NewBlog() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [_imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [_validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
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
        <div className="pt-16">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate image
      const imageErrors = validateImageFile(file);
      if (imageErrors.length > 0) {
        toast.error(imageErrors.join(', '));
        return;
      }
      
      try {
        // Resize image for optimization
        const resizedImage = await resizeImage(file, { maxWidth: 1200, maxHeight: 800, quality: 0.85 });
        setImage(resizedImage);
        
        // Generate preview
        const preview = await generateImagePreview(resizedImage);
        setImagePreview(preview);
        
        toast.success('Image uploaded and optimized successfully!');
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error('Failed to process image. Please try again.');
      }
    }
  };

  const uploadImage = async (file: File) => {
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary configuration is missing');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '360blogz');
    formData.append('folder', 'blog-images');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate form data
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    const validationErrors = validateBlogData(title, content, tagArray);
    
    if (validationErrors.length > 0) {
      const errorMap: {[key: string]: string} = {};
      validationErrors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setValidationErrors(errorMap);
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      setLoading(true);
      
      // Check rate limiting
      checkRateLimit(user.id, 'create_blog', 5, 300000); // 5 blogs per 5 minutes
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

      // Sanitize content before saving
      const sanitizedContent = sanitizeContent(processedContent);
      
      const now = new Date().toISOString();
      const blogData = {
        title: title.trim(),
        content: sanitizedContent,
        tags: tagArray,
        image: imageUrl,
        authorId: user.id,
        author: {
          id: user.id,
          name: user.name,
          profilePic: user.profilePic,
        },
        createdAt: now,
        updatedAt: now,
        published: true,
        viewCount: 0,
        likes: [],
        likeCount: 0,
      };

      await addDoc(collection(db, 'blogs'), blogData);
      toast.success('Blog post created successfully!');
      router.push('/');
    } catch (error: unknown) {
      console.error('Error creating blog post:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Rate limit')) {
        toast.error(errorMessage);
      } else if (errorMessage.includes('Cloudinary')) {
        toast.error('Failed to upload image. Please try again.');
      } else {
        toast.error('Failed to create blog post. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navigation />
      <div className="pt-16">
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
    </div>
  );
} 