import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Blog, PaginatedResult } from '@/types';

const BLOGS_PER_PAGE = 6;

export interface BlogFilters {
  authorId?: string;
  tags?: string[];
  searchQuery?: string;
  published?: boolean;
}

// Cache for pagination cursors
const paginationCache = new Map<string, unknown>();

export const fetchBlogsWithPagination = async (
  page: number = 1,
  filters: BlogFilters = {},
  pageSize: number = BLOGS_PER_PAGE
): Promise<PaginatedResult<Blog>> => {
  try {
    const blogsRef = collection(db, 'blogs');
    
    // Build query constraints
    const constraints = [];
    
    // Add filters
    if (filters.published !== undefined) {
      constraints.push(where('published', '==', filters.published));
    }
    
    if (filters.authorId) {
      constraints.push(where('authorId', '==', filters.authorId));
    }
    
    if (filters.tags && filters.tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', filters.tags));
    }
    
    // Add ordering
    constraints.push(orderBy('createdAt', 'desc'));
    
    // Create cache key
    const cacheKey = JSON.stringify({ filters, pageSize });
    
    // Create query with pagination
    let q = query(blogsRef, ...constraints, limit(pageSize));
    
    // Handle pagination with cursor
    if (page > 1) {
      const cursorKey = `${cacheKey}_${page - 1}`;
      const lastDoc = paginationCache.get(cursorKey);
      
      if (lastDoc) {
        q = query(blogsRef, ...constraints, startAfter(lastDoc), limit(pageSize));
      } else {
        // Fallback: fetch from beginning and skip
        const skipQuery = query(blogsRef, ...constraints, limit((page - 1) * pageSize));
        const skipSnapshot = await getDocs(skipQuery);
        const lastSkipDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
        
        if (lastSkipDoc) {
          q = query(blogsRef, ...constraints, startAfter(lastSkipDoc), limit(pageSize));
        }
      }
    }
    
    // Execute query
    const querySnapshot = await getDocs(q);
    const blogs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Blog[];
    
    // Cache the last document for next page
    if (querySnapshot.docs.length > 0) {
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      paginationCache.set(`${cacheKey}_${page}`, lastDoc);
    }
    
    // Estimate total count (more efficient than exact count)
    let totalItems = page * pageSize;
    if (blogs.length < pageSize) {
      totalItems = (page - 1) * pageSize + blogs.length;
    } else {
      // Try to get a better estimate by checking if there's a next page
      const nextPageQuery = query(blogsRef, ...constraints, startAfter(querySnapshot.docs[querySnapshot.docs.length - 1]), limit(1));
      const nextPageSnapshot = await getDocs(nextPageQuery);
      if (nextPageSnapshot.empty) {
        totalItems = (page - 1) * pageSize + blogs.length;
      }
    }
    
    const totalPages = Math.ceil(totalItems / pageSize);
    
    return {
      data: blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage: blogs.length === pageSize,
        hasPreviousPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching blogs with pagination:', error);
    throw new Error('Failed to fetch blogs');
  }
};

// Simple search cache
const searchCache = new Map<string, { data: Blog[], timestamp: number }>();
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const searchBlogs = async (
  searchQuery: string,
  page: number = 1,
  pageSize: number = BLOGS_PER_PAGE
): Promise<PaginatedResult<Blog>> => {
  try {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    }
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const cacheKey = `search_${normalizedQuery}`;
    
    // Check cache first
    const cached = searchCache.get(cacheKey);
    const now = Date.now();
    
    let allMatchingBlogs: Blog[];
    
    if (cached && (now - cached.timestamp) < SEARCH_CACHE_TTL) {
      allMatchingBlogs = cached.data;
    } else {
      // Improved search with title-first approach
      const blogsRef = collection(db, 'blogs');
      
      // First, try to find blogs with title containing search terms
      const titleSearchQuery = query(
        blogsRef,
        where('published', '==', true),
        orderBy('title'),
        limit(100) // Limit initial fetch
      );
      
      const titleSnapshot = await getDocs(titleSearchQuery);
      const titleBlogs = titleSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Blog[];
      
      // If title search doesn't yield enough results, do content search
      let contentBlogs: Blog[] = [];
      if (titleBlogs.length < 20) {
        const contentSearchQuery = query(
          blogsRef,
          where('published', '==', true),
          orderBy('createdAt', 'desc'),
          limit(200) // Reasonable limit for content search
        );
        
        const contentSnapshot = await getDocs(contentSearchQuery);
        contentBlogs = contentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Blog[];
      }
      
      // Combine and filter results
      const allBlogs = [...titleBlogs, ...contentBlogs];
      const uniqueBlogs = allBlogs.filter((blog, index, self) => 
        index === self.findIndex(b => b.id === blog.id)
      );
      
      // Filter blogs based on search query with better scoring
      const searchTerms = normalizedQuery.split(' ').filter(term => term.length > 1);
      
      allMatchingBlogs = uniqueBlogs
        .map(blog => {
          const title = (blog.title || '').toLowerCase();
          const content = (blog.content || '').toLowerCase();
          const tags = (blog.tags || []).join(' ').toLowerCase();
          const author = (blog.author?.name || '').toLowerCase();
          
          let score = 0;
          
          searchTerms.forEach(term => {
            if (title.includes(term)) score += 10; // Title matches are most important
            if (author.includes(term)) score += 5;  // Author matches
            if (tags.includes(term)) score += 3;    // Tag matches
            if (content.includes(term)) score += 1; // Content matches
          });
          
          return { ...blog, searchScore: score };
        })
        .filter(blog => blog.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore);
      
      // Cache results
      searchCache.set(cacheKey, { data: allMatchingBlogs, timestamp: now });
      
      // Clean old cache entries
      searchCache.forEach((value, key) => {
        if (now - value.timestamp > SEARCH_CACHE_TTL) {
          searchCache.delete(key);
        }
      });
    }
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBlogs = allMatchingBlogs.slice(startIndex, endIndex);
    
    const totalItems = allMatchingBlogs.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    return {
      data: paginatedBlogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error searching blogs:', error);
    return {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
  }
};

export const getFeaturedBlogs = async (limitCount: number = 3): Promise<Blog[]> => {
  try {
    const blogsRef = collection(db, 'blogs');
    const q = query(
      blogsRef,
      where('published', '==', true),
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Blog[];
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    return [];
  }
};

export const getRelatedBlogs = async (currentBlogId: string, tags: string[], limitCount: number = 3): Promise<Blog[]> => {
  try {
    if (!tags || tags.length === 0) return [];
    
    const blogsRef = collection(db, 'blogs');
    const q = query(
      blogsRef,
      where('published', '==', true),
      where('tags', 'array-contains-any', tags),
      orderBy('createdAt', 'desc'),
      limit(limitCount + 1) // Get one extra to exclude current blog
    );
    
    const querySnapshot = await getDocs(q);
    const relatedBlogs = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as Blog)
      .filter(blog => blog.id !== currentBlogId) // Exclude current blog
      .slice(0, limitCount); // Take only the requested number
    
    return relatedBlogs;
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return [];
  }
};
