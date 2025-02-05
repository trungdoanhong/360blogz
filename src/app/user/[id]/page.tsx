import UserProfileClient from '@/components/UserProfileClient'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function generateStaticParams() {
  try {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    return snapshot.docs.map(doc => ({
      id: doc.id
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export default function UserProfile() {
  return <UserProfileClient />
} 