'use client';

import Image from 'next/image';
import { useState } from 'react';

const placeholderImage = '/spinner.svg';

interface AvatarImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}

export function AvatarImage({
  src,
  alt,
  fill = false,
  sizes,
  className,
  priority,
  loading
}: AvatarImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (fill) {
    return (
      <>
        {/* Placeholder shown while loading or on error */}
        {(isLoading || hasError) && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-zinc-800"
            style={{ zIndex: 0 }}
          >
            <Image
              src={placeholderImage}
              alt="Loading avatar"
              width={48}
              height={48}
              priority
              className="h-10 w-10 animate-spin"
            />
          </div>
        )}
        {/* Actual image */}
        <Image
          src={hasError ? placeholderImage : src}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized
          priority={priority}
          loading={loading}
          className={`${className || ''} ${isLoading || hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          style={{ zIndex: 0 }}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </>
    );
  }

  // For non-fill images, you'd need width/height props
  return null;
}
