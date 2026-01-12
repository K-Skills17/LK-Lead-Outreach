'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initFacebookPixel, fbPageView } from '@/lib/facebook-pixel';

export function FacebookPixel() {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Facebook Pixel on mount
    initFacebookPixel();
  }, []);

  useEffect(() => {
    // Track page view on route change
    fbPageView();
  }, [pathname]);

  return null;
}
