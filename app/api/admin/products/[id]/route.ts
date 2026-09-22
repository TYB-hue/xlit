import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/supabase-admin';

type DetailInput = { title: string; content: string };

const DETAIL_KEYS = ['product_details', 'size_chart', 'washing_instructions', 'delivery'] as const;

function strings(value: unknown, maximum: number) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximum) return null;
  const output = value.map((item) => typeof item === 'string' ? item.trim() : '');
  return output.every(Boolean) ? output : null;
}

function storagePathFromPublicUrl(value: string) {
  try {
    const url = new URL(value);
    const marker = '/storage/v1/object/public/product-images/';
    const index = url.pathname.indexOf(marker);
    return index >= 0 ? decodeURIComponent(url.pathname.slice(index + marker.length)) : null;
  } catch {
    return null;
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, product_images(image_path)')
    .eq('id', params.id)
    .maybeSingle();

  if (productError || !product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id);
  if (deleteError) return NextResponse.json({ error: 'Unable to delete product.' }, { status: 500 });

  const storagePaths = (product.product_images ?? [])
    .map(({ image_path }) => storagePathFromPublicUrl(image_path))
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length) {
    const { error: storageError } = await supabase.storage.from('product-images').remove(storagePaths);
    if (storageError) console.error('Unable to remove deleted product images:', storageError.message);
  }

  return NextResponse.json({ message: 'Product deleted.' });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const stockQuantity = Number((body as { stockQuantity?: unknown } | null)?.stockQuantity);

  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return NextResponse.json({ error: 'Stock quantity must be a whole number of zero or more.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('products')
    .update({ stock_quantity: stockQuantity, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('id, stock_quantity')
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Unable to update stock.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  return NextResponse.json({ product: data, message: 'Stock updated.' });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid product.' }, { status: 400 });

  const input = body as Record<string, unknown>;
  const slug = typeof input.slug === 'string' ? input.slug.trim().toLowerCase() : '';
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const collection = typeof input.collection === 'string' ? input.collection.trim() : '';
  const stockMessage = typeof input.stockMessage === 'string' ? input.stockMessage.trim() : '';
  const stockQuantity = Number(input.stockQuantity);
  const priceEgp = Number(input.priceEgp);
  const displayOrder = Number(input.displayOrder);
  const images = strings(input.images, 8);
  const colors = strings(input.colors, 12);
  const sizes = strings(input.sizes, 12);
  const details = Array.isArray(input.details) ? input.details as DetailInput[] : [];
  const validDetails = details.length === 4 && details.every((detail) => detail
    && typeof detail.title === 'string' && detail.title.trim().length > 0
    && typeof detail.content === 'string' && detail.content.trim().length > 0);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !name || !collection || !stockMessage
    || !Number.isInteger(priceEgp) || priceEgp < 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0
    || !Number.isInteger(displayOrder) || displayOrder < 1 || !images || !colors || !sizes || !validDetails) {
    return NextResponse.json({ error: 'Complete every product field using the XLIT product structure.' }, { status: 400 });
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', params.id)
    .maybeSingle();
  if (productError || !product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  const { data: duplicates, error: duplicateError } = await supabase
    .from('products')
    .select('slug, display_order')
    .neq('id', params.id)
    .or(`slug.eq.${slug},display_order.eq.${displayOrder}`);
  if (duplicateError) return NextResponse.json({ error: 'Unable to validate the product changes.' }, { status: 500 });
  if (duplicates?.some((item) => item.slug === slug)) return NextResponse.json({ error: 'That slug is already in use.' }, { status: 400 });
  if (duplicates?.some((item) => item.display_order === displayOrder)) return NextResponse.json({ error: `Display order ${displayOrder} is already in use.` }, { status: 400 });

  const { error: updateError } = await supabase
    .from('products')
    .update({ slug, name, price_egp: priceEgp, collection, stock_message: stockMessage, stock_quantity: stockQuantity, display_order: displayOrder, updated_at: new Date().toISOString() })
    .eq('id', params.id);
  if (updateError) return NextResponse.json({ error: 'Unable to update product information.' }, { status: 500 });

  const { error: deleteChildrenError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', params.id);
  if (deleteChildrenError) return NextResponse.json({ error: 'Unable to update product images.' }, { status: 500 });

  const { error: imageError } = await supabase.from('product_images').insert(images.map((image_path, index) => ({ product_id: params.id, image_path, display_order: index + 1 })));
  const { error: colorDeleteError } = imageError ? { error: null } : await supabase.from('product_colors').delete().eq('product_id', params.id);
  const { error: colorError } = imageError || colorDeleteError ? { error: null } : await supabase.from('product_colors').insert(colors.map((colorName, index) => ({ product_id: params.id, name: colorName, display_order: index + 1 })));
  const { error: sizeDeleteError } = imageError || colorDeleteError || colorError ? { error: null } : await supabase.from('product_sizes').delete().eq('product_id', params.id);
  const { error: sizeError } = imageError || colorDeleteError || colorError || sizeDeleteError ? { error: null } : await supabase.from('product_sizes').insert(sizes.map((sizeName, index) => ({ product_id: params.id, name: sizeName, display_order: index + 1 })));
  const { error: detailsDeleteError } = imageError || colorDeleteError || colorError || sizeDeleteError || sizeError ? { error: null } : await supabase.from('product_details').delete().eq('product_id', params.id);
  const { error: detailsError } = imageError || colorDeleteError || colorError || sizeDeleteError || sizeError || detailsDeleteError ? { error: null } : await supabase.from('product_details').insert(details.map((detail, index) => ({ product_id: params.id, detail_key: DETAIL_KEYS[index], title: detail.title.trim(), content: detail.content.trim(), display_order: index + 1 })));

  if (imageError || colorDeleteError || colorError || sizeDeleteError || sizeError || detailsDeleteError || detailsError) {
    return NextResponse.json({ error: 'The basic product information saved, but related product details could not be updated. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Product updated.' });
}
