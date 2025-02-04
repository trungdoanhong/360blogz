# Yahoo! 360 Clone

A modern blogging and social networking platform built with Next.js, Firebase, and Cloudinary.

## Features

- User authentication (Email/Password and Google Sign-in)
- Blog creation and management
- Markdown support for blog content
- Image uploads
- Comments system
- User profiles
- Responsive design

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Image Storage**: Cloudinary
- **Markdown**: react-markdown

## Prerequisites

Before you begin, ensure you have the following:

- Node.js (v18 or higher)
- npm or yarn
- Firebase project
- Cloudinary account

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd 360blog
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Set up Firebase:
   - Create a new Firebase project
   - Enable Authentication (Email/Password and Google providers)
   - Create a Firestore database
   - Copy your Firebase configuration to the `.env.local` file

5. Set up Cloudinary:
   - Create a Cloudinary account
   - Copy your Cloudinary configuration to the `.env.local` file
   - Create an upload preset and update it in the `new-blog/page.tsx` file

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to your preferred hosting platform (e.g., Vercel):
```bash
vercel deploy
```

## Project Structure

```
360blog/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── blog/           # Blog pages
│   │   ├── login/          # Authentication pages
│   │   ├── profile/        # User profile pages
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utility functions and configurations
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
└── package.json          # Project dependencies and scripts
```

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
