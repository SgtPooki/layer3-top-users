'use client';

import Image from 'next/image';
import { useState } from 'react';

const placeholderSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.97498 12H7.89998" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path> <path d="M11.8 5V8" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path> <path d="M18.625 12H15.7" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path> <path d="M11.8 19V16" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path> <path d="M6.97374 16.95L9.04203 14.8287" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path> <path d="M6.97374 7.05001L9.04203 9.17133" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path> <path d="M16.6262 7.05001L14.5579 9.17133" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path> <path d="M16.6262 16.95L14.5579 14.8287" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path> </g></svg>`;

// Encode SVG as data URL for browser (use URI encoding for better compatibility)
const placeholderDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(placeholderSvg)}`;

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
            dangerouslySetInnerHTML={{ __html: placeholderSvg }}
          />
        )}
        {/* Actual image */}
        <Image
          src={hasError ? placeholderDataUrl : src}
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

