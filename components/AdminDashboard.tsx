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

type OrderedName = { name: string; display_order: number };
type ProductImage = { image_path: string; display_order: number };
type ProductDetail = { title: string; content: string; display_order: number };
type ProductSummary = {
  id: string; name: string; slug: string; price_egp: number; collection: string;
  stock_message: string; stock_quantity: number; display_order: number; is_active: boolean;
  product_images: ProductImage[]; product_colors: OrderedName[]; product_sizes: OrderedName[]; product_details: ProductDetail[];
};

type ProductFieldsProps = {
  product?: ProductSummary;
  displayOrder: string;
  onDisplayOrderChange: (value: string) => void;
  imageFiles: File[];
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function orderedValues(items: OrderedName[]) {
  return [...items].sort((a, b) => a.display_order - b.display_order).map((item) => item.name).join('\n');
}

function ProductFields({ product, displayOrder, onDisplayOrderChange, imageFiles, onImageChange }: ProductFieldsProps) {
  const images = product ? [...product.product_images].sort((a, b) => a.display_order - b.display_order).map((image) => image.image_path).join('\n') : '';
  const details = product ? [...product.product_details].sort((a, b) => a.display_order - b.display_order) : [];
  return <>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm">Product name<input name="name" required defaultValue={product?.name} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label>
      <label className="text-sm">Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={product?.slug} placeholder="tshirt-5" className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label>
      <label className="text-sm">Price (EGP)<input name="priceEgp" required min="0" type="number" defaultValue={product?.price_egp} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label>
      <label className="text-sm">Stock quantity<input name="stockQuantity" required min="0" type="number" defaultValue={product?.stock_quantity ?? 0} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label>
      <label className="text-sm">Display order <span className="text-inkdim">(unique)</span><input name="displayOrder" required min="1" type="number" value={displayOrder} onChange={(event) => onDisplayOrderChange(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label>
      <label className="text-sm">Collection<input name="collection" required defaultValue={product?.collection ?? 'XLIT original'} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label>
      <label className="text-sm">Stock message<input name="stockMessage" required defaultValue={product?.stock_message ?? 'Low stock · selling fast'} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3" /></label>
    </div>
    <label className="text-sm">Upload product images <span className="text-inkdim">(JPG, PNG, or WebP; up to 8 images, 5 MB each)</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onImageChange} className="mt-2 block w-full text-sm text-inkdim file:mr-4 file:rounded-lg file:border-0 file:bg-lime file:px-4 file:py-2 file:text-sm file:font-medium file:text-bg" />{imageFiles.length > 0 && <span className="mt-2 block text-xs text-lime">{imageFiles.length} new image{imageFiles.length === 1 ? '' : 's'} selected</span>}</label>
    <label className="text-sm">Image paths or URLs <span className="text-inkdim">(one per line; remove a line to remove that image)</span><textarea name="images" rows={3} defaultValue={images} placeholder="/products/new-shirt.png" className="mt-2 w-full rounded-lg border border-stroke bg-bg px-3 py-2" /></label>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm">Colors <span className="text-inkdim">(one per line)</span><textarea name="colors" required rows={4} defaultValue={product ? orderedValues(product.product_colors) : ''} placeholder={'Black\nCharcoal'} className="mt-2 w-full rounded-lg border border-stroke bg-bg px-3 py-2" /></label>
      <label className="text-sm">Sizes <span className="text-inkdim">(one per line)</span><textarea name="sizes" required rows={4} defaultValue={product ? orderedValues(product.product_sizes) : 'S\nM\nL\nXL'} className="mt-2 w-full rounded-lg border border-stroke bg-bg px-3 py-2" /></label>
    </div>
    {detailDefaults.map((detail, index) => <label key={detail.title} className="text-sm">{detail.title}<textarea name={`detail-${index}`} required rows={3} defaultValue={details[index]?.content ?? ''} className="mt-2 w-full rounded-lg border border-stroke bg-bg px-3 py-2" /></label>)}
  </>;
}

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
  const [editingProduct, setEditingProduct] = useState<ProductSummary | null>(null);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [editDisplayOrder, setEditDisplayOrder] = useState('');
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [moderatingReviewId, setModeratingReviewId] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  async function loadProducts() {
    if (!accessToken) return;
    const response = await fetch('/api/admin/products', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) { setNotice('This account is not authorised as the XLIT admin.'); return; }
    const data = await response.json();
    setProducts(data.products ?? []);
  }

  useEffect(() => {
    void supabaseBrowser?.auth.getSession().then(({ data }) => setAccessToken(data.session?.access_token ?? null));
    const { data: listener } = supabaseBrowser?.auth.onAuthStateChange((_event, session) => setAccessToken(session?.access_token ?? null)) ?? { data: { subscription: { unsubscribe() {} } } };
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => { void loadProducts(); }, [accessToken]);
  useEffect(() => {
    if (!accessToken) return;
    void fetch('/api/admin/reviews', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setPendingReviews(data.reviews ?? []))
      .catch(() => setReviewNotice('Unable to load pending reviews.'));
  }, [accessToken]);
  useEffect(() => {
    if (!hasEditedDisplayOrder) setDisplayOrder(String(Math.max(0, ...products.map((product) => product.display_order)) + 1));
  }, [hasEditedDisplayOrder, products]);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabaseBrowser) { setNotice('Supabase is not configured yet.'); return; }
    setIsSendingLink(true);
    const { error } = await supabaseBrowser.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setIsSendingLink(false);
    setNotice(error ? error.message : 'Check your email for the secure XLIT admin sign-in link.');
  }

  function selectImages(setter: (files: File[]) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => setter(Array.from(event.target.files ?? []).slice(0, 8));
  }
  async function uploadImages(slug: string, files: File[]) {
    if (!files.length) return [];
    const uploadData = new FormData();
    uploadData.set('slug', slug.trim().toLowerCase());
    files.forEach((file) => uploadData.append('images', file));
    const response = await fetch('/api/admin/images', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: uploadData });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error ?? 'Unable to upload images.');
    return result.urls as string[];
  }
  function payloadFromForm(form: FormData, uploadedImages: string[]) {
    const splitLines = (field: string) => String(form.get(field) ?? '').split('\n').map((value) => value.trim()).filter(Boolean);
    return { slug: form.get('slug'), name: form.get('name'), priceEgp: Number(form.get('priceEgp')), collection: form.get('collection'), stockMessage: form.get('stockMessage'), stockQuantity: Number(form.get('stockQuantity')), displayOrder: Number(form.get('displayOrder')), images: [...splitLines('images'), ...uploadedImages], colors: splitLines('colors'), sizes: splitLines('sizes'), details: detailDefaults.map((detail, index) => ({ title: detail.title, content: form.get(`detail-${index}`) })) };
  }
  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!accessToken) return;
    const productForm = event.currentTarget; const form = new FormData(productForm);
    setIsSaving(true); setNotice(null);
    try {
      const uploadedImages = await uploadImages(String(form.get('slug') ?? ''), imageFiles);
      const response = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payloadFromForm(form, uploadedImages)) });
      const result = await response.json().catch(() => null); if (!response.ok) throw new Error(result?.error ?? 'Unable to create product.');
      productForm.reset(); setImageFiles([]); setHasEditedDisplayOrder(true); await loadProducts(); setHasEditedDisplayOrder(false); setNotice('Product created. It is now available in the XLIT catalog.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to create product.'); } finally { setIsSaving(false); }
  }
  function startEditing(product: ProductSummary) {
    setEditingProduct(product); setEditImageFiles([]); setEditDisplayOrder(String(product.display_order)); setNotice(null);
    window.setTimeout(() => document.getElementById('edit-product')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }
  async function editProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!accessToken || !editingProduct) return;
    const form = new FormData(event.currentTarget); setIsSaving(true); setNotice(null);
    try {
      const uploadedImages = await uploadImages(String(form.get('slug') ?? ''), editImageFiles);
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payloadFromForm(form, uploadedImages)) });
      const result = await response.json().catch(() => null); if (!response.ok) throw new Error(result?.error ?? 'Unable to update product.');
      setEditingProduct(null); setEditImageFiles([]); await loadProducts(); setNotice('Product updated. The catalog now shows the new information.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to update product.'); } finally { setIsSaving(false); }
  }
  async function deleteProduct(product: ProductSummary) {
    if (!accessToken || !window.confirm(`Delete ${product.name} (${product.slug})? This cannot be undone.`)) return;
    setNotice(null); const response = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }); const result = await response.json().catch(() => null);
    if (!response.ok) { setNotice(result?.error ?? 'Unable to delete product.'); return; }
    setProducts((current) => current.filter((item) => item.id !== product.id)); if (editingProduct?.id === product.id) setEditingProduct(null); setNotice('Product deleted.');
  }
  async function updateStock(product: ProductSummary) {
    if (!accessToken) return; const stockQuantity = Number(stockDrafts[product.id] ?? product.stock_quantity);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) { setNotice('Stock quantity must be a whole number of zero or more.'); return; }
    setUpdatingStockId(product.id); setNotice(null);
    const response = await fetch(`/api/admin/products/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ stockQuantity }) }); const result = await response.json().catch(() => null); setUpdatingStockId(null);
    if (!response.ok) { setNotice(result?.error ?? 'Unable to update stock.'); return; }
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock_quantity: result.product.stock_quantity } : item)); setStockDrafts((current) => ({ ...current, [product.id]: String(result.product.stock_quantity) })); setNotice('Stock updated.');
  }
  async function moderateReview(review: PendingReview, action: 'approve' | 'reject') {
    if (!accessToken) return; if (action === 'reject' && !window.confirm(`Reject this review from ${review.reviewer_name}?`)) return;
    setModeratingReviewId(review.id); setReviewNotice(null);
    const response = await fetch(`/api/admin/reviews/${review.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ action }) }); const result = await response.json().catch(() => null); setModeratingReviewId(null);
    if (!response.ok) { setReviewNotice(result?.error ?? 'Unable to update this review.'); return; }
    setPendingReviews((current) => current.filter((item) => item.id !== review.id)); setReviewNotice(result?.message ?? 'Review updated.');
  }

  if (!accessToken) return <main className="min-h-screen bg-bg px-6 py-16 text-ink"><section className="mx-auto max-w-md rounded-2xl border border-stroke bg-card p-7"><p className="text-sm font-medium uppercase tracking-[0.2em] text-lime">XLIT secure area</p><h1 className="font-display mt-4 text-4xl font-light">Admin sign in</h1><p className="mt-3 text-sm leading-relaxed text-inkdim">We will email a one-time secure sign-in link.</p><form className="mt-7" onSubmit={sendMagicLink}><label className="text-sm">Admin email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-2 h-11 w-full rounded-lg border border-stroke bg-bg px-3 outline-none focus:border-lime" /></label><button disabled={isSendingLink} className="mt-5 w-full rounded-lg bg-lime px-5 py-3 text-sm font-medium text-bg disabled:opacity-60">{isSendingLink ? 'Sending…' : 'Send sign-in link'}</button></form>{notice && <p className="mt-4 text-sm text-inkdim">{notice}</p>}</section></main>;
  return <main className="min-h-screen bg-bg px-6 py-10 text-ink sm:py-16"><section className="mx-auto max-w-4xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-[0.2em] text-lime">XLIT secure area</p><h1 className="font-display mt-3 text-4xl font-light sm:text-5xl">Catalog admin</h1></div><a href="/products" className="rounded-lg border border-stroke px-4 py-2 text-sm hover:border-lime">View storefront</a></div><section className="mt-10 rounded-2xl border border-stroke bg-card p-5 sm:p-7"><h2 className="text-xl font-medium">Add product</h2><p className="mt-2 text-sm text-inkdim">Every field follows the established XLIT product structure.</p><form className="mt-7 grid gap-5" onSubmit={addProduct}><ProductFields displayOrder={displayOrder} onDisplayOrderChange={(value) => { setHasEditedDisplayOrder(true); setDisplayOrder(value); }} imageFiles={imageFiles} onImageChange={selectImages(setImageFiles)} /><button disabled={isSaving} className="justify-self-start rounded-lg bg-lime px-6 py-3 text-sm font-medium text-bg disabled:opacity-60">{isSaving ? 'Saving…' : 'Create product'}</button></form>{notice && <p className="mt-5 text-sm text-lime">{notice}</p>}</section>{editingProduct && <section id="edit-product" className="mt-8 rounded-2xl border border-lime/50 bg-card p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-medium">Edit product</h2><p className="mt-2 text-sm text-inkdim">Editing {editingProduct.name} / {editingProduct.slug}</p></div><button type="button" onClick={() => setEditingProduct(null)} className="rounded-lg border border-stroke px-4 py-2 text-sm hover:border-lime">Cancel</button></div><form key={editingProduct.id} className="mt-7 grid gap-5" onSubmit={editProduct}><ProductFields product={editingProduct} displayOrder={editDisplayOrder} onDisplayOrderChange={setEditDisplayOrder} imageFiles={editImageFiles} onImageChange={selectImages(setEditImageFiles)} /><button disabled={isSaving} className="justify-self-start rounded-lg bg-lime px-6 py-3 text-sm font-medium text-bg disabled:opacity-60">{isSaving ? 'Saving…' : 'Save changes'}</button></form></section>}<section className="mt-8"><h2 className="text-xl font-medium">Current catalog</h2><p className="mt-2 text-sm text-inkdim">Edit all product information, or update exact available units directly. Stock is not reduced until payment confirmation is added.</p><div className="mt-4 divide-y divide-stroke rounded-2xl border border-stroke bg-card">{products.map((product) => <div key={product.id} className="flex flex-col justify-between gap-3 p-4 text-sm sm:flex-row sm:items-center"><span>{product.display_order}. {product.name} <span className="text-inkdim">/ {product.slug}</span></span><span className="flex flex-wrap items-center gap-3"><span>{product.price_egp} LE</span><label className="flex items-center gap-2">Stock<input aria-label={`Stock for ${product.name}`} type="number" min="0" value={stockDrafts[product.id] ?? String(product.stock_quantity)} onChange={(event) => setStockDrafts((current) => ({ ...current, [product.id]: event.target.value }))} className="h-9 w-20 rounded border border-stroke bg-bg px-2" /></label><button type="button" disabled={updatingStockId === product.id} onClick={() => void updateStock(product)} className="rounded border border-lime/60 px-3 py-1.5 text-xs text-lime hover:bg-lime hover:text-bg disabled:opacity-60">{updatingStockId === product.id ? 'Saving…' : 'Save stock'}</button><button type="button" onClick={() => startEditing(product)} className="rounded border border-stroke px-3 py-1.5 text-xs hover:border-lime hover:text-lime">Edit</button><button type="button" onClick={() => void deleteProduct(product)} className="rounded border border-red-400/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400 hover:text-bg">Delete</button></span></div>)}</div></section><ReviewModeration reviews={pendingReviews} notice={reviewNotice} moderatingReviewId={moderatingReviewId} onModerate={(review, action) => void moderateReview(review, action)} /></section></main>;
}
