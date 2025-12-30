// Icon utility - loads icons from public/icons folder with emoji fallback
// Usage: <Icon name="play" emoji="🎮" />

import React from 'react';

interface IconProps {
  name: string;
  emoji: string;
  className?: string;
  alt?: string;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  emoji, 
  className = '', 
  alt = '', 
  size = 24 
}) => {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Try to load icon, fallback to emoji
  const iconPath = `/icons/${name}.png`;

  React.useEffect(() => {
    // Reset state when name changes
    setHasError(false);
    setIsLoading(true);

    // Preload image
    const img = new Image();
    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
    };
    img.src = iconPath;
  }, [iconPath]);

  if (hasError || isLoading) {
    return (
      <span 
        className={className} 
        style={{ fontSize: size }}
        role="img" 
        aria-label={alt || name}
      >
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={iconPath}
      alt={alt || name}
      className={className}
      width={size}
      height={size}
      onError={() => setHasError(true)}
    />
  );
};

export default Icon;
