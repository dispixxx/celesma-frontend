interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: 'small' | 'medium' | 'large';
}

export default function UserAvatar({ username, avatarUrl, size = 'small' }: UserAvatarProps) {
  const initials = username ? username.slice(0, 2).toUpperCase() : '?';
  const className = size === 'large' ? 'profile-avatar' : size === 'medium' ? 'user-avatar' : 'user-avatar-small';

  return (
    <div className={className}>
      {avatarUrl
        ? <img src={avatarUrl} alt={username} />
        : <span>{initials}</span>
      }
    </div>
  );
}
