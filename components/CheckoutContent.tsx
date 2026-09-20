'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { productImageSrc } from '../lib/product-image';

type CartItem = { slug: string; name: string; price: string; image: string; color: string; size: string; quantity: number };
type Method = 'vodafone_cash' | 'instapay' | 'cash_on_delivery';

const CART_KEY = 'xlit-cart';
const BUY_NOW_KEY = 'xlit-buy-now';
const VODAFONE_NUMBER = process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER ?? '';
const INSTAPAY_ACCOUNT = process.env.NEXT_PUBLIC_INSTAPAY_ACCOUNT ?? '';

function getItems(key: string): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is CartItem => item && typeof item === 'object' && typeof (item as CartItem).slug === 'string' && typeof (item as CartItem).quantity === 'number') : [];
  } catch { return []; }
}

function priceValue(price: string) { return Number(price.replace(/[^0-9.-]/g, '')) || 0; }
function formatPrice(value: number) { return `${value.toLocaleString()} EGP`; }

export default function CheckoutContent() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [method, setMethod] = useState<Method>('vodafone_cash');
  const [proof, setProof] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const subtotal = useMemo(() => items.reduce((total, item) => total + priceValue(item.price) * item.quantity, 0), [items]);
  const transfer = method !== 'cash_on_delivery';
  const paymentNumber = method === 'vodafone_cash' ? VODAFONE_NUMBER : INSTAPAY_ACCOUNT;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source');
    const buyNow = source === 'buy-now' ? getItems(BUY_NOW_KEY) : [];
    setItems(buyNow.length ? buyNow : getItems(CART_KEY));
    setLoaded(true);
  }, []);

  const copyNumber = async () => {
    if (!paymentNumber) return;
    try { await navigator.clipboard.writeText(paymentNumber); setMessage({ type: 'success', text: 'Payment account copied.' }); }
    catch { setMessage({ type: 'error', text: 'Unable to copy the account. Please copy it manually.' }); }
  };

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!items.length) return;
    const formData = new FormData(form);
    formData.set('method', method);
    formData.set('items', JSON.stringify(items.map(({ slug, color, size, quantity }) => ({ slug, color, size, quantity }))));
    if (proof) formData.set('proof', proof, proof.name);
    setIsSubmitting(true);
    setMessage(null);
    const response = await fetch('/api/orders', { method: 'POST', body: formData }).catch(() => null);
    const result = response ? await response.json().catch(() => null) : null;
    setIsSubmitting(false);
    if (!response?.ok) { setMessage({ type: 'error', text: result?.error ?? 'Unable to send the order. Please try again.' }); return; }
    if (new URLSearchParams(window.location.search).get('source') === 'buy-now') window.localStorage.removeItem(BUY_NOW_KEY);
    else window.localStorage.removeItem(CART_KEY);
    setItems([]);
    form.reset();
    setProof(null);
    setMessage({ type: 'success', text: result?.message ?? 'Your order is pending. The market will contact you as soon as possible.' });
  }

  if (!loaded) return <div className="min-h-[50vh]" aria-hidden="true" />;
  if (!items.length && !message) return <section className="mx-auto flex min-h-[58vh] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center"><p className="text-sm font-medium uppercase tracking-[0.22em] text-lime">Checkout</p><h1 className="font-display mt-5 text-4xl font-light text-ink sm:text-5xl">Your selection is empty.</h1><a href="/products" className="mt-8 rounded-lg bg-lime px-6 py-3 text-sm font-medium uppercase tracking-wide text-bg">Browse products</a></section>;
  if (!items.length && message?.type === 'success') return <section className="mx-auto flex min-h-[58vh] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center"><p className="text-sm font-medium uppercase tracking-[0.22em] text-lime">Order pending</p><h1 className="font-display mt-5 text-4xl font-light text-ink sm:text-5xl">Thank you.</h1><p className="mt-5 max-w-md leading-relaxed text-inkdim">{message.text}</p><a href="/products" className="mt-8 rounded-lg bg-lime px-6 py-3 text-sm font-medium uppercase tracking-wide text-bg">Continue shopping</a></section>;

  return <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-10"><p className="text-sm font-medium uppercase tracking-[0.22em] text-lime">Secure order request</p><h1 className="font-display mt-3 text-4xl font-light tracking-[-0.04em] text-ink sm:text-5xl">Choose how you&apos;ll pay.</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-inkdim">Transfer directly, upload proof, and XLIT will confirm the order. Cash on Delivery needs no transfer proof.</p><div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"><form onSubmit={submitOrder} className="rounded-2xl border border-stroke bg-card p-5 sm:p-7"><fieldset><legend className="text-base font-medium text-ink">Payment method</legend><div className="mt-5 grid gap-3 sm:grid-cols-3">{([{ id: 'vodafone_cash', label: 'Vodafone Cash', note: 'Transfer then upload proof' }, { id: 'instapay', label: 'InstaPay', note: 'Transfer then upload proof' }, { id: 'cash_on_delivery', label: 'Cash on Delivery', note: 'Pay when your order arrives' }] as const).map((option) => <label key={option.id} className={`cursor-pointer rounded-xl border p-4 transition-colors ${method === option.id ? 'border-lime bg-lime/10' : 'border-stroke hover:border-inkdim'}`}><input className="sr-only" type="radio" name="method-choice" checked={method === option.id} onChange={() => { setMethod(option.id); setProof(null); setMessage(null); }} /><span className="block font-medium text-ink">{option.label}</span><span className="mt-2 block text-xs leading-relaxed text-inkdim">{option.note}</span></label>)}</div></fieldset>{transfer && <section className="mt-7 rounded-xl border border-lime/30 bg-lime/5 p-4 sm:p-5"><p className="text-sm font-medium text-ink">{method === 'vodafone_cash' ? 'Send the exact subtotal to Vodafone Cash' : 'Send the exact subtotal to InstaPay'}</p>{paymentNumber ? <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><code className="min-w-0 flex-1 break-all rounded-lg border border-stroke bg-bg px-3 py-3 text-sm text-ink">{paymentNumber}</code><button type="button" onClick={() => void copyNumber()} className="rounded-lg border border-lime px-4 py-3 text-sm font-medium text-lime">Copy</button></div> : <p className="mt-3 text-sm text-red-300">This payment account is not configured yet. Please choose Cash on Delivery or contact XLIT.</p>}<p className="mt-3 text-xs leading-relaxed text-inkdim">After transferring, upload a clear screenshot of the completed payment below. Do not send bank-card details.</p></section>}<div className="mt-7 grid gap-4 sm:grid-cols-2"><label className="text-sm text-ink">Name<input required name="name" minLength={2} maxLength={80} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3 text-ink outline-none focus:border-lime" /></label><label className="text-sm text-ink">Phone number<input required name="phone" inputMode="tel" minLength={6} maxLength={30} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3 text-ink outline-none focus:border-lime" /></label></div><label className="mt-4 block text-sm text-ink">Email <span className="text-inkdim">(optional)</span><input name="email" type="email" maxLength={255} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3 text-ink outline-none focus:border-lime" /></label><label className="mt-4 block text-sm text-ink">Home address<textarea required name="address" minLength={8} maxLength={500} rows={4} className="mt-2 w-full rounded-lg border border-stroke bg-bg px-3 py-3 text-ink outline-none focus:border-lime" /></label>{transfer && <label className="mt-4 block text-sm text-ink">Payment proof <span className="text-inkdim">(JPG, PNG, or WebP; max 5 MB)</span><input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event: ChangeEvent<HTMLInputElement>) => setProof(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm text-inkdim file:mr-3 file:rounded-lg file:border-0 file:bg-lime file:px-4 file:py-2 file:text-sm file:font-medium file:text-bg" />{proof && <span className="mt-2 block text-xs text-lime">{proof.name}</span>}</label>}<button disabled={isSubmitting || (transfer && !paymentNumber)} className="mt-7 w-full rounded-lg bg-lime px-5 py-3 text-sm font-medium uppercase tracking-wide text-bg disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Sending order…' : 'Submit order request'}</button>{message && <p className={`mt-4 text-sm ${message.type === 'success' ? 'text-lime' : 'text-red-300'}`} role="status">{message.text}</p>}</form><aside className="rounded-2xl border border-stroke bg-card p-5 sm:p-7 lg:sticky lg:top-28"><h2 className="text-lg font-medium text-ink">Your order</h2><div className="mt-5 divide-y divide-stroke">{items.map((item) => <article key={`${item.slug}-${item.color}-${item.size}`} className="flex gap-3 py-4 first:pt-0"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-bg p-1"><img src={productImageSrc(item.image)} alt="" className="h-full w-full object-contain" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{item.name}</p><p className="mt-1 text-xs text-inkdim">{item.color} · {item.size} · ×{item.quantity}</p><p className="mt-2 text-sm text-ink">{formatPrice(priceValue(item.price) * item.quantity)}</p></div></article>)}</div><div className="mt-5 flex items-center justify-between border-t border-stroke pt-5"><span className="font-medium text-ink">Subtotal</span><span className="text-xl font-medium text-ink">{formatPrice(subtotal)}</span></div><p className="mt-3 text-xs leading-relaxed text-inkdim">Delivery cost and confirmation are arranged by XLIT after reviewing your request.</p></aside></div></section>;
}
