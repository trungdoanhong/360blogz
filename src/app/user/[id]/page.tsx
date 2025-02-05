import UserProfileClient from '@/components/UserProfileClient'

export const generateStaticParams = async () => {
  return []
}

export default function UserProfile() {
  return <UserProfileClient />
} 