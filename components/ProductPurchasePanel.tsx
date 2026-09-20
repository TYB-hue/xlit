'use client';

import { useState } from 'react';
import type { Product } from '../data/products';

type ProductPurchasePanelProps = {
  product: Product;
};

type CartItem = {
  slug: string;
  name: string;
  price: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
};

export default function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const addToCart = () => {
    const cartItem: CartItem = {
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: selectedColor,
      size: selectedSize,
      quantity,
    };
    const storedCart = window.localStorage.getItem('xlit-cart');
    let cart: CartItem[] = [];

    try {
      const parsedCart: unknown = storedCart ? JSON.parse(storedCart) : [];
      if (Array.isArray(parsedCart)) cart = parsedCart as CartItem[];
    } catch {
      window.localStorage.removeItem('xlit-cart');
    }

    const matchingItem = cart.findIndex((item) => item.slug === cartItem.slug && item.color === cartItem.color && item.size === cartItem.size);

    if (matchingItem >= 0) cart[matchingItem].quantity += quantity;
    else cart.push(cartItem);

    window.localStorage.setItem('xlit-cart', JSON.stringify(cart));
    setIsAdded(true);
  };

  const buyNow = () => {
    const item: CartItem = {
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: selectedColor,
      size: selectedSize,
      quantity,
    };
    window.localStorage.setItem('xlit-buy-now', JSON.stringify([item]));
    window.location.assign('/checkout?source=buy-now');
  };

  return (
    <>
      <div className="mt-8 border-y border-stroke py-7">
        <fieldset>
          <legend className="text-sm font-medium uppercase tracking-wide text-ink">Colorway</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => { setSelectedColor(color); setIsAdded(false); }}
                aria-pressed={selectedColor === color}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${selectedColor === color ? 'border-lime bg-lime text-bg' : 'border-stroke text-ink hover:border-inkdim'}`}
              >
                {color}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium uppercase tracking-wide text-ink">Size</legend>
          <div className="mt-3 flex gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => { setSelectedSize(size); setIsAdded(false); }}
                aria-pressed={selectedSize === size}
                className={`h-11 w-12 border text-sm transition-colors ${selectedSize === size ? 'border-lime bg-lime text-bg' : 'border-stroke text-ink hover:border-inkdim'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-ink">Quantity</p>
            <div className="mt-3 flex h-11 items-center border border-stroke">
              <button type="button" onClick={() => { setQuantity((current) => Math.max(1, current - 1)); setIsAdded(false); }} disabled={quantity === 1} className="h-full w-11 text-lg hover:text-lime disabled:cursor-not-allowed disabled:opacity-40" aria-label="Decrease quantity">−</button>
              <span className="w-8 text-center" aria-live="polite">{quantity}</span>
              <button type="button" onClick={() => { setQuantity((current) => current + 1); setIsAdded(false); }} className="h-full w-11 text-lg hover:text-lime" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <p className="text-sm text-lime">{product.stockMessage}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={addToCart} className="hero-cta hero-cta--add-to-cart justify-center rounded-lg border border-ink bg-transparent px-6 py-3 text-sm font-medium uppercase tracking-wide text-ink"><span className="text-container"><span className="text">{isAdded ? 'Added to cart' : 'Add to cart'}</span></span></button>
        <button type="button" onClick={buyNow} className="hero-cta justify-center rounded-lg bg-lime px-6 py-3 text-sm font-medium uppercase tracking-wide text-bg"><span className="text-container"><span className="text">Buy it now</span></span></button>
      </div>
      {isAdded && <p className="mt-3 text-sm text-lime" role="status">Added {quantity} × {product.name} ({selectedColor}, {selectedSize}) to cart. <a href="/cart" className="underline underline-offset-4">View cart</a></p>}

      <div className="mt-8 divide-y divide-stroke border-y border-stroke">
        {product.details.map(({ title, content }) => (
          <details key={title} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium uppercase tracking-wide text-ink"><span>{title}</span><span className="text-xl text-lime transition-transform group-open:rotate-45">+</span></summary>
            <p className="pt-4 text-sm leading-relaxed text-inkdim">{content}</p>
          </details>
        ))}
      </div>
    </>
  );
}
