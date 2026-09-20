import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

export const runtime = 'nodejs';

const MAX_PROOF_SIZE = 5 * 1024 * 1024;
const DEFAULT_RECIPIENT = 'frank.wilson.incall@gmail.com';
const attempts = new Map<string, number[]>();

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
})[character] ?? character);

function rateLimited(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((time) => now - time < 15 * 60 * 1000);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > 5;
}

type RequestedItem = { slug: string; color: string; size: string; quantity: number };
type EmailAttachment = { filename: string; content: Buffer };

function parseItems(value: FormDataEntryValue | null): RequestedItem[] | null {
  if (typeof value !== 'string') return null;
  try {
    const items: unknown = JSON.parse(value);
    if (!Array.isArray(items) || items.length === 0 || items.length > 20) return null;
    const valid = items.every((item) => item && typeof item === 'object'
      && typeof (item as RequestedItem).slug === 'string'
      && typeof (item as RequestedItem).color === 'string'
      && typeof (item as RequestedItem).size === 'string'
      && Number.isInteger((item as RequestedItem).quantity)
      && (item as RequestedItem).quantity >= 1 && (item as RequestedItem).quantity <= 10);
    return valid ? items as RequestedItem[] : null;
  } catch {
    return null;
  }
}

async function getProductImageAttachment(imagePath: string | undefined, request: Request, slug: string): Promise<EmailAttachment | null> {
  if (!imagePath) return null;
  try {
    const requestUrl = new URL(request.url);
    const imageUrl = new URL(imagePath, requestUrl);
    const isOwnPublicImage = imageUrl.origin === requestUrl.origin && imageUrl.pathname.startsWith('/products/');
    const isSupabaseStorageImage = imageUrl.protocol === 'https:' && imageUrl.hostname.endsWith('.supabase.co') && imageUrl.pathname.includes('/storage/v1/object/public/');
    if (!isOwnPublicImage && !isSupabaseStorageImage) return null;

    const response = await fetch(imageUrl, { cache: 'no-store' });
    const contentType = response.headers.get('content-type')?.split(';')[0] ?? '';
    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (!response.ok || !['image/jpeg', 'image/png', 'image/webp'].includes(contentType) || contentLength > 5 * 1024 * 1024) return null;
    const content = Buffer.from(await response.arrayBuffer());
    if (content.length > 5 * 1024 * 1024) return null;
    const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    return { filename: `${slug}-product.${extension}`, content };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (rateLimited(request)) return NextResponse.json({ error: 'Please wait before sending another order request.' }, { status: 429 });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const catalog = getSupabaseAdmin();
  if (!apiKey || !from || !catalog) return NextResponse.json({ error: 'Order requests are not configured yet.' }, { status: 503 });

  try {
    const formData = await request.formData();
    const method = String(formData.get('method') ?? '');
    const name = String(formData.get('name') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const address = String(formData.get('address') ?? '').trim();
    const items = parseItems(formData.get('items'));
    const proof = formData.get('proof');
    const isTransfer = method === 'vodafone_cash' || method === 'instapay';

    if (!['vodafone_cash', 'instapay', 'cash_on_delivery'].includes(method)
      || name.length < 2 || name.length > 80
      || phone.length < 6 || phone.length > 30
      || address.length < 8 || address.length > 500
      || (email && !/^\S+@\S+\.\S+$/.test(email))
      || !items) {
      return NextResponse.json({ error: 'Please complete the order details correctly.' }, { status: 400 });
    }

    if ((method === 'instapay' && !process.env.NEXT_PUBLIC_INSTAPAY_ACCOUNT)
      || (method === 'vodafone_cash' && !process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER)) {
      return NextResponse.json({ error: 'This payment method is not available at the moment.' }, { status: 400 });
    }

    if (isTransfer && (!(proof instanceof File) || proof.size === 0)) {
      return NextResponse.json({ error: 'Upload a screenshot proving the transfer before submitting your order.' }, { status: 400 });
    }
    if (proof instanceof File && proof.size > 0 && (!['image/jpeg', 'image/png', 'image/webp'].includes(proof.type) || proof.size > MAX_PROOF_SIZE)) {
      return NextResponse.json({ error: 'Payment proof must be a JPG, PNG, or WebP image under 5 MB.' }, { status: 400 });
    }

    const slugs = Array.from(new Set(items.map((item) => item.slug)));
    const { data: products, error: productsError } = await catalog
      .from('products')
      .select('slug, name, price_egp, product_colors(name), product_sizes(name), product_images(image_path, display_order)')
      .in('slug', slugs)
      .eq('is_active', true);
    if (productsError || !products || products.length !== slugs.length) {
      return NextResponse.json({ error: 'One or more selected products are no longer available.' }, { status: 400 });
    }

    const productsBySlug = new Map(products.map((product) => [product.slug, product]));
    const orderLines = items.map((item) => {
      const product = productsBySlug.get(item.slug);
      if (!product || !product.product_colors.some((color) => color.name === item.color) || !product.product_sizes.some((size) => size.name === item.size)) return null;
      const firstImage = [...(product.product_images ?? [])].sort((a, b) => a.display_order - b.display_order)[0]?.image_path;
      return { ...item, name: product.name, unitPrice: product.price_egp, total: product.price_egp * item.quantity, imagePath: firstImage };
    });
    if (orderLines.some((line) => !line)) return NextResponse.json({ error: 'A selected color or size is no longer available.' }, { status: 400 });

    const lines = orderLines as NonNullable<(typeof orderLines)[number]>[];
    const total = lines.reduce((sum, line) => sum + line.total, 0);
    const methodLabel = method === 'vodafone_cash' ? 'Vodafone Cash' : method === 'instapay' ? 'InstaPay' : 'Cash on Delivery';
    const recipients = (process.env.RESEND_TO_EMAIL ?? DEFAULT_RECIPIENT).split(',').map((address) => address.trim()).filter((address) => address.includes('@'));
    if (!recipients.length) return NextResponse.json({ error: 'Order requests are not configured yet.' }, { status: 503 });

    const orderText = lines.map((line) => `${line.quantity} × ${line.name} (${line.color}, ${line.size}) — ${line.total.toLocaleString()} EGP`).join('\n');
    const orderHtml = lines.map((line) => `<li>${line.quantity} × ${escapeHtml(line.name)} (${escapeHtml(line.color)}, ${escapeHtml(line.size)}) — ${line.total.toLocaleString()} EGP</li>`).join('');
    const productImages = await Promise.all(lines.map((line) => getProductImageAttachment(line.imagePath, request, line.slug)));
    const attachments: EmailAttachment[] = [
      ...(proof instanceof File && proof.size > 0 ? [{ filename: proof.name || 'payment-proof', content: Buffer.from(await proof.arrayBuffer()) }] : []),
      ...productImages.filter((attachment): attachment is EmailAttachment => attachment !== null),
    ];

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: recipients,
      replyTo: email || undefined,
      subject: `New XLIT ${methodLabel} order request from ${name}`,
      text: `New XLIT order request\n\nPayment method: ${methodLabel}\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email || 'Not provided'}\nAddress: ${address}\n\nItems:\n${orderText}\n\nSubtotal: ${total.toLocaleString()} EGP${proof instanceof File && proof.size > 0 ? '\n\nPayment proof: attached' : ''}${productImages.some(Boolean) ? '\nProduct image(s): attached' : ''}`,
      html: `<h1>New XLIT order request</h1><p><strong>Payment method:</strong> ${methodLabel}</p><p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Phone:</strong> ${escapeHtml(phone)}<br><strong>Email:</strong> ${escapeHtml(email || 'Not provided')}<br><strong>Address:</strong> ${escapeHtml(address)}</p><h2>Items</h2><ul>${orderHtml}</ul><p><strong>Subtotal:</strong> ${total.toLocaleString()} EGP</p>${proof instanceof File && proof.size > 0 ? '<p><strong>Payment proof:</strong> attached</p>' : ''}${productImages.some(Boolean) ? '<p><strong>Product image(s):</strong> attached</p>' : ''}`,
      attachments: attachments.length ? attachments : undefined,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    return NextResponse.json({ success: true, message: 'Your order is pending. The market will contact you as soon as possible.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'The order could not be submitted. Please try again.' }, { status: 500 });
  }
}
