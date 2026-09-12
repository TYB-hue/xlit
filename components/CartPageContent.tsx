'use client';

import { useEffect, useMemo, useState } from 'react';

type CartItem = {
  slug: string;
  name: string;
  price: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
};

const CART_KEY = 'xlit-cart';

function formatPrice(value: number) {
  return `${value.toLocaleString()} le`;
}

function priceValue(price: string) {
  return Number(price.replace(/[^0-9.-]/g, '')) || 0;
}

function getStoredCart(): CartItem[] {
  try {
    const storedCart: unknown = JSON.parse(window.localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(storedCart)) return [];
    return storedCart.filter((item): item is CartItem => (
      typeof item === 'object' && item !== null && 'slug' in item && 'name' in item && 'price' in item && 'image' in item && 'color' in item && 'size' in item && 'quantity' in item && typeof item.quantity === 'number'
    ));
  } catch {
    return [];
  }
}

export default function CartPageContent() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCart(getStoredCart());
    setIsLoaded(true);
  }, []);

  const saveCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    window.localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    saveCart(cart.map((item, itemIndex) => itemIndex === index ? { ...item, quantity } : item));
  };

  const removeItem = (index: number) => saveCart(cart.filter((_, itemIndex) => itemIndex !== index));

  const subtotal = useMemo(() => cart.reduce((total, item) => total + priceValue(item.price) * item.quantity, 0), [cart]);
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  if (!isLoaded) return <div className="min-h-[50vh]" aria-hidden="true" />;

  if (cart.length === 0) {
    return (
      <section className="mx-auto flex min-h-[58vh] max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-lime">Your cart</p>
        <h1 className="font-display mt-5 text-5xl font-light tracking-[-0.05em] text-ink sm:text-6xl">Nothing here yet.</h1>
        <p className="mt-5 max-w-md leading-relaxed text-inkdim">Find a piece that speaks for you, then add it to your cart.</p>
        <a href="/products" className="hero-cta mt-9 rounded-lg bg-lime px-6 py-3 text-sm font-medium uppercase tracking-wide text-bg"><span className="text-container"><span className="text">Browse products</span></span></a>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[92rem] px-6 py-14 sm:py-20 lg:px-10 lg:py-24">
      <p className="text-sm font-medium uppercase tracking-[0.22em] text-lime">Your selection</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-light tracking-[-0.04em] text-ink sm:text-5xl lg:text-6xl">Cart</h1>
        <p className="text-sm text-inkdim">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start xl:gap-16">
        <div className="divide-y divide-stroke border-y border-stroke">
          {cart.map((item, index) => (
            <article key={`${item.slug}-${item.color}-${item.size}`} className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6 sm:py-6">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-card p-2">
                <img src={`/products/${item.image}`} alt={`XLIT ${item.name}`} className="h-full w-full object-contain" />
              </div>
              <div className="flex min-w-0 flex-col sm:py-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium text-ink sm:text-xl">{item.name}</h2>
                    <p className="mt-1 text-sm text-inkdim">{item.color} · {item.size}</p>
                  </div>
                  <button type="button" onClick={() => removeItem(index)} className="shrink-0 text-sm text-inkdim underline underline-offset-4 transition-colors hover:text-lime" aria-label={`Remove ${item.name} from cart`}>Remove</button>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-inkdim">Quantity</p>
                    <div className="flex h-10 items-center border border-stroke">
                      <button type="button" onClick={() => updateQuantity(index, item.quantity - 1)} disabled={item.quantity === 1} className="h-full w-10 text-lg transition-colors hover:text-lime disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Decrease ${item.name} quantity`}>−</button>
                      <span className="w-8 text-center text-sm" aria-live="polite">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(index, item.quantity + 1)} className="h-full w-10 text-lg transition-colors hover:text-lime" aria-label={`Increase ${item.name} quantity`}>+</button>
                    </div>
                  </div>
                  <p className="text-base font-medium text-ink sm:text-lg">{formatPrice(priceValue(item.price) * item.quantity)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-2xl border border-stroke bg-card p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="text-lg font-medium text-ink">Order summary</h2>
          <dl className="mt-7 space-y-4 text-sm text-inkdim">
            <div className="flex items-center justify-between gap-4"><dt>Subtotal</dt><dd className="text-ink">{formatPrice(subtotal)}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt>Delivery</dt><dd>Calculated at checkout</dd></div>
          </dl>
          <div className="mt-6 flex items-center justify-between border-t border-stroke pt-6">
            <span className="font-medium text-ink">Total</span>
            <span className="text-xl font-medium text-ink">{formatPrice(subtotal)}</span>
          </div>
          <button type="button" disabled className="mt-7 w-full cursor-not-allowed rounded-lg bg-lime px-5 py-3 text-sm font-medium uppercase tracking-wide text-bg opacity-60">Checkout coming soon</button>
          <a href="/products" className="mt-5 block text-center text-sm text-inkdim underline underline-offset-4 transition-colors hover:text-lime">Continue shopping</a>
        </aside>
      </div>
    </section>
  );
}
