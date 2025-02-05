import EditBlogClient from '@/components/EditBlogClient'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function generateStaticParams() {
  try {
    const blogsRef = collection(db, 'blogs')
    const snapshot = await getDocs(blogsRef)
    return snapshot.docs.map(doc => ({
      id: doc.id
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export default function EditBlog() {
  return <EditBlogClient />
} 