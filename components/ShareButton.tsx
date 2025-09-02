'use client';

import React, { useState } from 'react';
import { ShareNetwork } from '@phosphor-icons/react';
import { trackShare } from '../lib/analytics';

interface ShareButtonProps {
  movieId: string;
  url?: string; // relative or absolute URL
}

export function ShareButton({ movieId, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => {
    if (typeof window === 'undefined') return url ?? '';
    const absolute = url ? new URL(url, window.location.origin).toString() : window.location.href;
    return absolute;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getUrl();
    try {
      if (navigator.share) {
        await navigator.share({ url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      trackShare(movieId);
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
      title="Share"
    >
      <ShareNetwork size={14} />
      <span>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}
