import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Blog } from '@/types';

// Cache for tags
const tagsCache = new Map<string, { data: string[], timestamp: number }>();
const TAGS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const getAllTags = async (): Promise<string[]> => {
  try {
    const cacheKey = 'all_tags';
    const cached = tagsCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < TAGS_CACHE_TTL) {
      return cached.data;
    }
    
    // Fetch a reasonable sample of recent blogs to get popular tags
    const blogsRef = collection(db, 'blogs');
    const recentBlogsQuery = query(
      blogsRef,
      where('published', '==', true),
      limit(100) // Only fetch recent blogs for tags
    );
    
    const snapshot = await getDocs(recentBlogsQuery);
    const tagCounts = new Map<string, number>();
    
    snapshot.docs.forEach(doc => {
      const blogData = doc.data() as Blog;
      if (blogData.tags && Array.isArray(blogData.tags)) {
        blogData.tags.forEach(tag => {
          if (tag && typeof tag === 'string' && tag.trim()) {
            const normalizedTag = tag.trim().toLowerCase();
            tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
          }
        });
      }
    });
    
    // Sort tags by popularity and return top 50
    const sortedTags = Array.from(tagCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50)
      .map(([tag]) => tag);
    
    // Cache results
    tagsCache.set(cacheKey, { data: sortedTags, timestamp: now });
    
    return sortedTags;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// Get tags for a specific filter context
export const getTagsForFilter = async (currentTag?: string): Promise<string[]> => {
  const allTags = await getAllTags();
  
  // If we have a current tag, make sure it's included even if not in top tags
  if (currentTag && !allTags.includes(currentTag.toLowerCase())) {
    return [currentTag.toLowerCase(), ...allTags.slice(0, 49)];
  }
  
  return allTags;
};
