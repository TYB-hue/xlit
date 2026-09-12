'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type CartItem = {
  slug: string;
  name: string;
  price: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
};

type CartDrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const CART_KEY = 'xlit-cart';

function priceValue(price: string) {
  return Number(price.replace(/[^0-9.-]/g, '')) || 0;
}

function formatPrice(value: number) {
  return `${value.toLocaleString()} le`;
}

function getCart(): CartItem[] {
  try {
    const savedCart: unknown = JSON.parse(window.localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(savedCart) ? savedCart as CartItem[] : [];
  } catch {
    return [];
  }
}

export default function CartDrawer({ isOpen, onOpenChange }: CartDrawerProps) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const loadCart = () => setCart(getCart());
  const subtotal = useMemo(() => cart.reduce((total, item) => total + priceValue(item.price) * item.quantity, 0), [cart]);
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    if (!isOpen) return;
    loadCart();
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onOpenChange(false);
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onOpenChange]);

  const saveCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    window.localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    saveCart(cart.map((item, itemIndex) => itemIndex === index ? { ...item, quantity } : item));
  };

  if (!isOpen) return null;

  return createPortal(
        <div className="fixed inset-0 z-[70]">
          <button type="button" className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-md" onClick={() => onOpenChange(false)} aria-label="Close cart" />
          <aside role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title" className="cart-drawer-panel absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-[1.75rem] border border-stroke bg-[#151515] shadow-2xl sm:left-auto sm:top-0 sm:max-h-none sm:w-full sm:max-w-[520px] sm:rounded-none sm:border-y-0 sm:border-r-0">
            <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-inkdim sm:hidden" aria-hidden="true" />
            <header className="relative flex items-center justify-between border-b border-stroke px-6 py-6 sm:px-8 sm:py-8">
              <span className="absolute left-0 top-0 h-1 w-24 bg-lime" aria-hidden="true" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-lime">XLIT essentials</p>
                <h2 id="cart-drawer-title" className="font-display mt-2 text-4xl font-light tracking-[-0.04em] text-ink">Your cart <span className="font-sans text-sm font-normal tracking-normal text-inkdim">{itemCount} {itemCount === 1 ? 'piece' : 'pieces'}</span></h2>
              </div>
              <button type="button" onClick={() => onOpenChange(false)} className="flex h-10 w-10 items-center justify-center border border-stroke text-xl text-ink transition-colors hover:border-lime hover:bg-lime hover:text-bg" aria-label="Close cart">×</button>
            </header>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
                <p className="font-display text-3xl font-light text-ink">Your cart is empty.</p>
                <p className="mt-2 text-sm leading-relaxed text-inkdim">Choose a piece and it will appear here.</p>
                <a href="/products" onClick={() => onOpenChange(false)} className="mt-7 bg-lime px-6 py-3 text-sm font-medium uppercase tracking-wide text-bg">Browse products</a>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 sm:px-8">
                  <div className="divide-y divide-stroke">
                    {cart.map((item, index) => (
                      <article key={`${item.slug}-${item.color}-${item.size}`} className="grid grid-cols-[92px_minmax(0,1fr)] gap-5 py-6">
                        <div className="flex aspect-square items-center justify-center border border-stroke bg-[#0d0d0d] p-1">
                          <img src={`/products/${item.image}`} alt={`XLIT ${item.name}`} className="h-full w-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex justify-between gap-3">
                            <div><h3 className="text-base font-medium text-ink">{item.name}</h3><p className="mt-1 text-xs uppercase tracking-[0.12em] text-inkdim">{item.color} · {item.size}</p></div>
                            <button type="button" onClick={() => saveCart(cart.filter((_, itemIndex) => itemIndex !== index))} className="text-[11px] font-medium uppercase tracking-wide text-inkdim underline underline-offset-4 hover:text-lime">Remove</button>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex h-9 items-center border border-stroke bg-bg">
                              <button type="button" onClick={() => updateQuantity(index, item.quantity - 1)} disabled={item.quantity === 1} className="h-full w-8 disabled:opacity-40" aria-label={`Decrease ${item.name} quantity`}>−</button>
                              <span className="w-7 text-center text-sm">{item.quantity}</span>
                              <button type="button" onClick={() => updateQuantity(index, item.quantity + 1)} className="h-full w-8" aria-label={`Increase ${item.name} quantity`}>+</button>
                            </div>
                            <p className="text-sm font-medium text-ink">{formatPrice(priceValue(item.price) * item.quantity)}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
                <footer className="border-t border-stroke bg-[#101010] p-6 sm:p-8">
                  <div className="flex items-center justify-between text-sm text-inkdim"><span>Subtotal</span><span className="text-ink">{formatPrice(subtotal)}</span></div>
                  <p className="mt-2 text-xs text-inkdim">Delivery will be calculated at checkout.</p>
                  <div className="mt-5 flex items-center justify-between border-t border-stroke pt-5 text-xl font-medium text-ink"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
                  <button type="button" disabled className="mt-6 w-full bg-lime px-5 py-3.5 text-sm font-medium uppercase tracking-wide text-bg opacity-60">Checkout coming soon</button>
                  <a href="/cart" onClick={() => onOpenChange(false)} className="mt-5 block text-center text-sm text-inkdim underline underline-offset-4 hover:text-lime">View full cart</a>
                </footer>
              </>
            )}
          </aside>
        </div>
  , document.body);
}
