export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.errors = errors;
  }
}

// Blog validation
export const validateBlogData = (title: string, content: string, tags: string[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Title validation
  if (!title.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be less than 200 characters' });
  }

  // Content validation
  if (!content.trim()) {
    errors.push({ field: 'content', message: 'Content is required' });
  } else if (content.length > 50000) {
    errors.push({ field: 'content', message: 'Content must be less than 50,000 characters' });
  }

  // Tags validation
  if (tags.length > 10) {
    errors.push({ field: 'tags', message: 'Maximum 10 tags allowed' });
  }

  tags.forEach((tag, index) => {
    if (tag.length > 30) {
      errors.push({ field: `tags[${index}]`, message: 'Each tag must be less than 30 characters' });
    }
  });

  return errors;
};

// User validation
export const validateUserData = (name: string, email: string, bio?: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!name.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be less than 100 characters' });
  }

  if (!email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (bio && bio.length > 500) {
    errors.push({ field: 'bio', message: 'Bio must be less than 500 characters' });
  }

  return errors;
};

// Comment validation
export const validateCommentData = (content: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!content.trim()) {
    errors.push({ field: 'content', message: 'Comment content is required' });
  } else if (content.length > 1000) {
    errors.push({ field: 'content', message: 'Comment must be less than 1,000 characters' });
  }

  return errors;
};

// Sanitize HTML content
export const sanitizeContent = (content: string): string => {
  // Basic HTML sanitization - remove script tags and potentially dangerous attributes
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};
