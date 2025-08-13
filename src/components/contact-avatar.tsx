import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ContactAvatarProps {
  name?: string | null;
  email: string;
  profileImageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ContactAvatar({ 
  name, 
  email, 
  profileImageUrl, 
  size = 'md',
  className = '' 
}: ContactAvatarProps) {
  // Generate initials from name or email
  const getInitials = () => {
    if (name) {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    
    // Use first two characters of email if no name
    return email.charAt(0).toUpperCase();
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {profileImageUrl && (
        <AvatarImage 
          src={profileImageUrl} 
          alt={name || email}
          className="object-cover"
        />
      )}
      <AvatarFallback className="bg-muted">
        {getInitials() || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}