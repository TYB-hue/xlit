'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { supabaseBrowser } from '../lib/supabase-browser';
import ReviewModeration, { type PendingReview } from './ReviewModeration';

const detailDefaults = [
  { title: 'Product details', content: '' },
  { title: 'Size chart', content: '' },
  { title: 'Washing instructions', content: '' },
  { title: 'Delivery', content: '' },
];

type ProductSummary = { id: string; name: string; slug: string; price_egp: number; display_order: number; is_active: boolean };

export default function AdminDashboard() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState('frank.wilson.incall@gmail.com');
  const [notice, setNotice] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [displayOrder, setDisplayOrder] = useState('');
  const [hasEditedDisplayOrder, setHasEditedDisplayOrder] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [moderatingReviewId, setModeratingReviewId] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  useEffect(() => {
    void supabaseBrowser?.auth.getSession().then(({ data }) => setAccessToken(data.session?.access_token ?? null));
    const { data: listener } = supabaseBrowser?.auth.onAuthStateChange((_event, session) => setAccessToken(session?.access_token ?? null)) ?? { data: { subscription: { unsubscribe() {} } } };
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    void fetch('/api/admin/products', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setNotice('This account is not authorised as the XLIT admin.'));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    void fetch('/api/admin/reviews', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setPendingReviews(data.reviews ?? []))
      .catch(() => setReviewNotice('Unable to load pending reviews.'));
  }, [accessToken]);

  useEffect(() => {
    if (!hasEditedDisplayOrder) {
      setDisplayOrder(String(Math.max(0, ...products.map((product) => product.display_order)) + 1));
    }
  }, [hasEditedDisplayOrder, products]);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabaseBrowser) { setNotice('Supabase is not configured yet.'); return; }
    setIsSendingLink(true);
    const { error } = await supabaseBrowser.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setIsSendingLink(false);
    setNotice(error ? error.message : 'Check your email for the secure XLIT admin sign-in link.');
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    const productForm = event.currentTarget;
    const form = new FormData(productForm);
    const splitLines = (field: string) => String(form.get(field) ?? '').split('\n').map((value) => value.trim()).filter(Boolean);
    let uploadedImages: string[] = [];
    if (imageFiles.length) {
      const uploadData = new FormData();
      uploadData.set('slug', String(form.get('slug') ?? '').trim().toLowerCase());
      imageFiles.forEach((file) => uploadData.append('images', file));
      setIsSaving(true);
      const uploadResponse = await fetch('/api/admin/images', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: uploadData });
      const uploadResult = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok) { setIsSaving(false); setNotice(uploadResult?.error ?? 'Unable to upload images.'); return; }
      uploadedImages = uploadResult.urls ?? [];
    }
    const payload = {
      slug: form.get('slug'), name: form.get('name'), priceEgp: Number(form.get('priceEgp')),
      collection: form.get('collection'), stockMessage: form.get('stockMessage'), displayOrder: Number(form.get('displayOrder')),
      images: [...uploadedImages, ...splitLines('images')], colors: splitLines('colors'), sizes: splitLines('sizes'),
      details: detailDefaults.map((detail, index) => ({ title: detail.title, content: form.get(`detail-${index}`) })),
    };
    setIsSaving(true); setNotice(null);
    const response = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => null);
    setIsSaving(false);
    if (!response.ok) { setNotice(result?.error ?? 'Unable to create product.'); return; }
    productForm.reset();
    setImageFiles([]);
    // Avoid briefly restoring the order just used while the catalog refreshes.
    setHasEditedDisplayOrder(true);
    setNotice('Product created. It is now available in the XLIT catalog.');
    const catalogResponse = await fetch('/api/admin/products', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (catalogResponse.ok) {
      const refreshedProducts = (await catalogResponse.json()).products ?? [];
      setProducts(refreshedProducts);
      setDisplayOrder(String(Math.max(0, ...refreshedProducts.map((product: ProductSummary) => product.display_order)) + 1));
      setHasEditedDisplayOrder(false);
    }
  }

  async function deleteProduct(product: ProductSummary) {
    if (!accessToken || !window.confirm(`Delete ${product.name} (${product.slug})? This cannot be undone.`)) return;
    setNotice(null);
    const response = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
    const result = await response.json().catch(() => null);
    if (!response.ok) { setNotice(result?.error ?? 'Unable to delete product.'); return; }
    setProducts((current) => current.filter((item) => item.id !== product.id));
    setNotice('Product deleted.');
  }

  async function moderateReview(review: PendingReview, action: 'approve' | 'reject') {
    if (!accessToken) return;
    if (action === 'reject' && !window.confirm(`Reject this review from ${review.reviewer_name}?`)) return;
    setModeratingReviewId(review.id);
    setReviewNotice(null);
    const response = await fetch(`/api/admin/reviews/${review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action }),
    });
    const result = await response.json().catch(() => null);
    setModeratingReviewId(null);
    if (!response.ok) { setReviewNotice(result?.error ?? 'Unable to update this review.'); return; }
    setPendingReviews((current) => current.filter((item) => item.id !== review.id));
    setReviewNotice(result?.message ?? 'Review updated.');
  }

  function selectImages(event: ChangeEvent<HTMLInputElement>) {
    setImageFiles(Array.from(event.target.files ?? []).slice(0, 8));
  }

  if (!accessToken) return <main className="min-h-screen bg-bg px-6 py-16 text-ink"><section className="mx-auto max-w-md rounded-2xl border border-stroke bg-card p-7"><p className="text-sm font-medium uppercase tracking-[0.2em] text-lime">XLIT secure area</p><h1 className="font-display mt-4 text-4xl font-light">Admin sign in</h1><p className="mt-3 text-sm leading-relaxed text-inkdim">We will email a one-time secure sign-in link.</p><form className="mt-7" onSubmit={sendMagicLink}><label className="text-sm">Admin email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3 outline-none focus:border-lime" /></label><button disabled={isSendingLink} className="mt-5 w-full rounded-lg bg-lime px-5 py-3 text-sm font-medium text-bg disabled:opacity-60">{isSendingLink ? 'Sending…' : 'Send sign-in link'}</button></form>{notice && <p className="mt-4 text-sm text-inkdim">{notice}</p>}</section></main>;

  return <main className="min-h-screen bg-bg px-6 py-10 text-ink sm:py-16"><section className="mx-auto max-w-4xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-[0.2em] text-lime">XLIT secure area</p><h1 className="font-display mt-3 text-4xl font-light sm:text-5xl">Catalog admin</h1></div><a href="/products" className="rounded-lg border border-stroke px-4 py-2 text-sm hover:border-lime">View storefront</a></div><section className="mt-10 rounded-2xl border border-stroke bg-card p-5 sm:p-7"><h2 className="text-xl font-medium">Add product</h2><p className="mt-2 text-sm text-inkdim">Every field follows the established XLIT product structure.</p><form className="mt-7 grid gap-5" onSubmit={addProduct}><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm">Product name<input name="name" required className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label><label className="text-sm">Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="tshirt-5" className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label><label className="text-sm">Price (EGP)<input name="priceEgp" required min="0" type="number" className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label><label className="text-sm">Display order <span className="text-inkdim">(unique)</span><input name="displayOrder" required min="1" type="number" value={displayOrder} onChange={(event) => { setHasEditedDisplayOrder(true); setDisplayOrder(event.target.value); }} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label><label className="text-sm">Collection<input name="collection" required defaultValue="XLIT original" className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label><label className="text-sm">Stock message<input name="stockMessage" required defaultValue="Low stock · selling fast" className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label></div><label className="text-sm">Upload product images <span className="text-inkdim">(JPG, PNG, or WebP; up to 8 images, 5 MB each)</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectImages} className="mt-2 block w-full text-sm text-inkdim file:mr-4 file:rounded-lg file:border-0 file:bg-lime file:px-4 file:py-2 file:text-sm file:font-medium file:text-bg" />{imageFiles.length > 0 && <span className="mt-2 block text-xs text-lime">{imageFiles.length} image{imageFiles.length === 1 ? '' : 's'} selected</span>}</label><label className="text-sm">Additional image paths or URLs <span className="text-inkdim">(optional, one per line)</span><textarea name="images" rows={3} placeholder="/products/new-shirt.png" className="mt-2 w-full rounded-lg border border-stroke bg-bg px-3 py-2" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm">Colors <span className="text-inkdim">(one per line)</span><textarea name="colors" required rows={4} placeholder="Black\nCharcoal" className="mt-2 w-full rounded-lg border border-stroke bg-bg px-3 py-2" /></label><label className="text-sm">Sizes <span className="text-inkdim">(one per line)</span><textarea name="sizes" required rows={4} defaultValue={'S\nM\nL\nXL'} className="mt-2 w-full rounded-lg border border-stroke bg-bg px-3 py-2" /></label></div>{detailDefaults.map((detail, index) => <label key={detail.title} className="text-sm">{detail.title}<textarea name={`detail-${index}`} required rows={3} className="mt-2 w-full rounded-lg border border-stroke bg-bg px-3 py-2" /></label>)}<button disabled={isSaving} className="justify-self-start rounded-lg bg-lime px-6 py-3 text-sm font-medium text-bg disabled:opacity-60">{isSaving ? 'Saving…' : 'Create product'}</button></form>{notice && <p className="mt-5 text-sm text-lime">{notice}</p>}</section><section className="mt-8"><h2 className="text-xl font-medium">Current catalog</h2><div className="mt-4 divide-y divide-stroke rounded-2xl border border-stroke bg-card">{products.map((product) => <div key={product.id} className="flex items-center justify-between gap-4 p-4 text-sm"><span>{product.display_order}. {product.name} <span className="text-inkdim">/ {product.slug}</span></span><span className="flex items-center gap-3"><span>{product.price_egp} LE</span><button type="button" onClick={() => void deleteProduct(product)} className="rounded border border-red-400/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400 hover:text-bg">Delete</button></span></div>)}</div></section><ReviewModeration reviews={pendingReviews} notice={reviewNotice} moderatingReviewId={moderatingReviewId} onModerate={(review, action) => void moderateReview(review, action)} /></section></main>;
}
