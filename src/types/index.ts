export interface User {
  id: string;
  name: string;
  email: string;
  profilePic: string | null;
  bio?: string;
  followers?: string[];
  following?: string[];
  createdAt: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author?: {
    id: string;
    name: string;
    profilePic?: string;
  };
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  image?: string;
  published?: boolean;
  viewCount?: number;
  likes?: string[]; // Array of user IDs who liked
  likeCount?: number;
  featured?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author?: {
    name: string;
    profilePic?: string;
  };
  blogId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow';
  fromUserId: string;
  blogId?: string;
  read: boolean;
  createdAt: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
} 