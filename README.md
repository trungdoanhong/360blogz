# 360° Blog - Modern Blogging Platform

A modern, secure, and feature-rich blogging platform built with Next.js, Firebase, and TypeScript. Inspired by the classic Yahoo! 360° experience but with modern web standards and security practices.

## ✨ Features

### Core Features
- 🔐 **Secure Authentication** - Firebase Auth with Google OAuth support
- 📝 **Rich Blog Editor** - Markdown support with live preview
- 🖼️ **Image Management** - Optimized image upload with Cloudinary integration
- 🏷️ **Tag System** - Organize posts with tags and filtering
- 🔍 **Search Functionality** - Full-text search across all published posts
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS

### Advanced Features
- ⭐ **Featured Posts** - Highlight important content
- 📄 **Pagination** - Efficient content loading with pagination
- 🚀 **Performance Optimized** - Image compression, lazy loading, and caching
- 🔒 **Security First** - Input validation, authorization checks, and rate limiting
- 🎨 **Modern UI/UX** - Clean design with loading states and error boundaries
- 📊 **Analytics Ready** - View counts and engagement tracking

## 🛡️ Security Features

- **Input Validation** - Comprehensive validation for all user inputs
- **Authorization Checks** - Proper ownership verification for CRUD operations
- **Rate Limiting** - Prevent spam and abuse with built-in rate limiting
- **Content Sanitization** - XSS protection through content sanitization
- **Error Handling** - Graceful error handling with user-friendly messages

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled
- Cloudinary account for image uploads (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 360blog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Cloudinary Configuration (Optional)
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   ```

4. **Firebase Setup**
   - Enable Firestore Database
   - Enable Authentication (Email/Password and Google)
   - Set up Firestore security rules
   - Deploy the provided Firestore indexes

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── blog/              # Blog detail and edit pages
│   ├── login/             # Authentication pages
│   ├── new-blog/          # Blog creation
│   └── profile/           # User profiles
├── components/            # Reusable UI components
│   ├── BlogCard.tsx       # Blog preview card
│   ├── Navigation.tsx     # Main navigation
│   ├── Pagination.tsx     # Pagination component
│   └── ErrorBoundary.tsx  # Error handling
├── hooks/                 # Custom React hooks
│   └── useAuth.tsx        # Authentication context
├── lib/                   # External service configurations
│   └── firebase.ts        # Firebase configuration
├── types/                 # TypeScript type definitions
│   └── index.ts           # Shared interfaces
└── utils/                 # Utility functions
    ├── validation.ts      # Input validation
    ├── authorization.ts   # Authorization checks
    ├── imageUtils.ts      # Image processing
    └── blogService.ts     # Blog data operations
```

## 🔧 Configuration

### Deployment Options

**Static Export (GitHub Pages, Netlify)**
```bash
# Set environment variable
DEPLOY_TARGET=static

# Build and export
npm run build
```

**Server Deployment (Vercel, Railway)**
```bash
# Regular build
npm run build
npm start
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Blogs are readable by all, writable by owner
    match /blogs/{blogId} {
      allow read: if resource.data.published == true;
      allow create: if request.auth != null && 
                   request.auth.uid == resource.data.authorId;
      allow update, delete: if request.auth != null && 
                           request.auth.uid == resource.data.authorId;
    }
    
    // Comments are readable by all, writable by owner
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                           request.auth.uid == resource.data.authorId;
    }
  }
}
```

## 🎯 Performance Optimizations

- **Image Optimization** - Automatic image compression and resizing
- **Lazy Loading** - Components and images load on demand
- **Pagination** - Efficient data loading with Firestore pagination
- **Caching** - Smart caching strategies for better performance
- **Bundle Optimization** - Code splitting and tree shaking
- **CDN Integration** - Cloudinary for optimized image delivery

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

- **TypeScript** - Full type safety
- **ESLint** - Code linting and formatting
- **Error Boundaries** - Graceful error handling
- **Input Validation** - Comprehensive validation system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the classic Yahoo! 360° platform
- Built with modern web technologies and best practices
- Thanks to the open-source community for the amazing tools and libraries

---

**Note**: This is a modern recreation inspired by Yahoo! 360°, not an official Yahoo! product.