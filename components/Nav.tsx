'use client';

import { useEffect, useRef, useState } from 'react';
import CartDrawer from './CartDrawer';

const links = [
  { label: 'Accessories', href: '/products' },
  { label: 'Contact us', href: '/contact' },
  { label: 'About us', href: '/about' },
  { label: 'Policies', href: '/policies' },
];

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cartTriggerRef = useRef<HTMLButtonElement | null>(null);
  const wasCartOpenRef = useRef(false);
  const openCart = (trigger: HTMLButtonElement) => {
    cartTriggerRef.current = trigger;
    setIsMenuOpen(false);
    setIsCartOpen(true);
  };

  useEffect(() => {
    if (wasCartOpenRef.current && !isCartOpen) cartTriggerRef.current?.focus();
    wasCartOpenRef.current = isCartOpen;
  }, [isCartOpen]);

  useEffect(() => {
    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', closeMenuOnOutsideClick);
    document.addEventListener('keydown', closeMenuOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenuOnOutsideClick);
      document.removeEventListener('keydown', closeMenuOnEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-none items-center px-4 py-3 sm:px-6 sm:py-5 lg:px-10">
        <a href="/#top" className="flex items-center" aria-label="XLIT home">
          <img
            src="/products/xlit-horizontal-logo.png"
            alt="XLIT — From the nano to the world"
            className="h-10 w-[108px] object-contain object-left sm:h-12 sm:w-[132px] lg:h-14 lg:w-[154px]"
          />
        </a>

        <nav className="ml-auto hidden items-center gap-10 lg:flex xl:mr-12" aria-label="Primary navigation">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-[15px] text-ink/85 transition-colors duration-300 hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 lg:flex">
          <button type="button" onClick={(event) => openCart(event.currentTarget)} className="rounded-lg border border-stroke px-2.5 py-2 text-[14px] font-medium text-ink transition-colors hover:border-inkdim hover:text-lime" aria-haspopup="dialog" aria-expanded={isCartOpen}>Cart</button>
          <a href="/products" className="rounded-lg bg-white px-2.5 py-2 text-[14px] font-medium text-bg transition-transform duration-300 hover:-translate-y-0.5">
            Products
          </a>
          <a href="/customize" className="rounded-lg bg-lime px-2.5 py-2 text-[14px] font-medium text-bg transition-transform duration-300 hover:-translate-y-0.5">
            Customize
          </a>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden" ref={menuRef}>
          <a href="/customize" className="rounded-md bg-lime px-3 py-2 text-xs font-medium text-bg transition-transform hover:-translate-y-0.5 sm:px-4 sm:text-sm">
            Customize
          </a>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-md border border-stroke px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-inkdim hover:bg-card sm:px-4 sm:text-sm"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation-menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            Menu
          </button>

          {isMenuOpen && (
            <div id="mobile-navigation-menu" role="menu" className="absolute right-4 top-[calc(100%+0.5rem)] w-52 overflow-hidden rounded-lg border border-stroke bg-card p-1 shadow-2xl sm:right-6">
              <button type="button" role="menuitem" onClick={(event) => openCart(event.currentTarget)} className="block w-full rounded-md px-4 py-3 text-left text-sm font-medium text-ink transition-colors hover:bg-bg hover:text-lime" aria-haspopup="dialog" aria-expanded={isCartOpen}>Cart</button>
              <a href="/products" role="menuitem" onClick={() => setIsMenuOpen(false)} className="block rounded-md px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-bg hover:text-lime">
                Products
              </a>
              <div className="my-1 border-t border-stroke" />
              {links.map((link) => (
                <a key={link.label} href={link.href} role="menuitem" onClick={() => setIsMenuOpen(false)} className="block rounded-md px-4 py-3 text-sm text-inkdim transition-colors hover:bg-bg hover:text-lime">
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
        <CartDrawer isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
      </div>
    </header>
  );
}
