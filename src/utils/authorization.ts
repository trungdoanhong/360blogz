import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Blog } from '@/types';

export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Check if user owns the blog
export const checkBlogOwnership = async (blogId: string, userId: string): Promise<void> => {
  if (!userId) {
    throw new AuthorizationError('User must be authenticated');
  }

  const blogRef = doc(db, 'blogs', blogId);
  const blogDoc = await getDoc(blogRef);
  
  if (!blogDoc.exists()) {
    throw new AuthorizationError('Blog not found');
  }

  const blogData = blogDoc.data() as Blog;
  if (blogData.authorId !== userId) {
    throw new AuthorizationError('You do not have permission to modify this blog');
  }
};

// Check if user can edit profile
export const checkProfileEditPermission = (profileUserId: string, currentUserId: string): void => {
  if (!currentUserId) {
    throw new AuthorizationError('User must be authenticated');
  }
  
  if (profileUserId !== currentUserId) {
    throw new AuthorizationError('You can only edit your own profile');
  }
};

// Check if user can delete comment
export const checkCommentOwnership = async (commentId: string, userId: string): Promise<void> => {
  if (!userId) {
    throw new AuthorizationError('User must be authenticated');
  }

  const commentRef = doc(db, 'comments', commentId);
  const commentDoc = await getDoc(commentRef);
  
  if (!commentDoc.exists()) {
    throw new AuthorizationError('Comment not found');
  }

  const commentData = commentDoc.data();
  if (commentData.authorId !== userId) {
    throw new AuthorizationError('You can only delete your own comments');
  }
};

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (userId: string, action: string, maxRequests: number = 10, windowMs: number = 60000): void => {
  const key = `${userId}_${action}`;
  const now = Date.now();
  const userLimit = rateLimitMap.get(key);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return;
  }

  if (userLimit.count >= maxRequests) {
    throw new AuthorizationError(`Rate limit exceeded for ${action}. Please try again later.`);
  }

  userLimit.count++;
};
