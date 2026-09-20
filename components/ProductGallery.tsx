'use client';

import { useState } from 'react';
import { productImageSrc } from '../lib/product-image';

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [activeImage, setActiveImage] = useState(0);
  const showPrevious = () => setActiveImage((current) => (current - 1 + images.length) % images.length);
  const showNext = () => setActiveImage((current) => (current + 1) % images.length);

  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-4">
      <div className="flex flex-col gap-3">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setActiveImage(index)}
            aria-label={`Show ${name} photo ${index + 1}`}
            aria-pressed={activeImage === index}
            className={`flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden bg-[#0F0F0F] p-1 ${activeImage === index ? 'ring-1 ring-lime' : ''}`}
          >
            <img src={productImageSrc(image)} alt="" className="h-full w-full object-contain" />
          </button>
        ))}
      </div>
      <div className="relative flex aspect-square min-w-0 items-center justify-center overflow-hidden bg-[#0F0F0F] p-3 sm:p-5">
        <img src={productImageSrc(images[activeImage])} alt={`XLIT ${name}, photo ${activeImage + 1}`} className="h-full w-full object-contain" />
        <div className="absolute bottom-3 right-3 flex flex-col gap-2 sm:bottom-5 sm:right-5">
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Previous product photo"
            className="flex h-10 w-10 items-center justify-center bg-[#141414]/95 text-lime transition-colors hover:bg-lime hover:text-bg"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className="h-4 w-4">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Next product photo"
            className="flex h-10 w-10 items-center justify-center bg-[#141414]/95 text-lime transition-colors hover:bg-lime hover:text-bg"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className="h-4 w-4">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
