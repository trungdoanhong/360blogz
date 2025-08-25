// Default avatar as SVG data URI - simple user icon
export const DEFAULT_AVATAR = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#e5e7eb"/>
  <circle cx="50" cy="35" r="15" fill="#9ca3af"/>
  <path d="M50 55c-15 0-25 10-25 20v25h50V75c0-10-10-20-25-20z" fill="#9ca3af"/>
</svg>
`)}`;

// Generate initials avatar
export const generateInitialsAvatar = (name: string): string => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  
  // Generate a consistent color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  const bgColor = `hsl(${hue}, 50%, 60%)`;
  
  return `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="${bgColor}"/>
      <text x="50" y="50" text-anchor="middle" dy="0.35em" font-family="Arial, sans-serif" font-size="35" font-weight="bold" fill="white">
        ${initials}
      </text>
    </svg>
  `)}`;
};

// Avatar component with proper fallback handling
export const getAvatarSrc = (profilePic?: string | null, name?: string): string => {
  if (profilePic && profilePic.trim()) {
    return profilePic;
  }
  
  if (name && name.trim()) {
    return generateInitialsAvatar(name);
  }
  
  return DEFAULT_AVATAR;
};
