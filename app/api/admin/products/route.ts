import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/supabase-admin';

type DetailInput = { title: string; content: string };

const DETAIL_KEYS = ['product_details', 'size_chart', 'washing_instructions', 'delivery'] as const;

function strings(value: unknown, maximum: number) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximum) return null;
  const output = value.map((item) => typeof item === 'string' ? item.trim() : '');
  return output.every(Boolean) ? output : null;
}

export async function GET(request: Request) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, price_egp, collection, stock_message, stock_quantity, rating, review_count, display_order, is_active, product_images(image_path, display_order), product_colors(name, display_order), product_sizes(name, display_order), product_details(title, content, display_order)')
    .order('display_order');

  if (error) return NextResponse.json({ error: 'Unable to load products.' }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(request: Request) {
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

  const validDetails = details.length === 4 && details.every((detail) =>
    detail && typeof detail.title === 'string' && detail.title.trim().length > 0
    && typeof detail.content === 'string' && detail.content.trim().length > 0,
  );

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !name || !collection || !stockMessage
    || !Number.isInteger(priceEgp) || priceEgp < 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0
    || !Number.isInteger(displayOrder) || displayOrder < 1
    || !images || !colors || !sizes || !validDetails) {
    return NextResponse.json({ error: 'Complete every product field using the XLIT product structure.' }, { status: 400 });
  }

  const { data: matchingProducts, error: matchingProductsError } = await supabase
    .from('products')
    .select('slug, display_order')
    .or(`slug.eq.${slug},display_order.eq.${displayOrder}`);

  if (matchingProductsError) return NextResponse.json({ error: 'Unable to validate the new product.' }, { status: 500 });

  if (matchingProducts?.some((product) => product.slug === slug)) {
    return NextResponse.json({ error: `The slug “${slug}” is already in use. Choose a unique slug, for example “tshirt-5”.` }, { status: 400 });
  }

  if (matchingProducts?.some((product) => product.display_order === displayOrder)) {
    return NextResponse.json({ error: `Display order ${displayOrder} is already in use. Choose the next available number.` }, { status: 400 });
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({ slug, name, price_egp: priceEgp, collection, stock_message: stockMessage, stock_quantity: stockQuantity, display_order: displayOrder, rating: 0, review_count: 0 })
    .select('id')
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: productError?.code === '23505' ? 'This slug or display order was just used by another product. Choose a different value and try again.' : 'Unable to create product.' }, { status: 400 });
  }

  const { error: imageError } = await supabase.from('product_images').insert(images.map((image_path, index) => ({ product_id: product.id, image_path, display_order: index + 1 })));
  const { error: colorError } = imageError ? { error: null } : await supabase.from('product_colors').insert(colors.map((colorName, index) => ({ product_id: product.id, name: colorName, display_order: index + 1 })));
  const { error: sizeError } = imageError || colorError ? { error: null } : await supabase.from('product_sizes').insert(sizes.map((sizeName, index) => ({ product_id: product.id, name: sizeName, display_order: index + 1 })));
  const { error: detailsError } = imageError || colorError || sizeError ? { error: null } : await supabase.from('product_details').insert(details.map((detail, index) => ({ product_id: product.id, detail_key: DETAIL_KEYS[index], title: detail.title.trim(), content: detail.content.trim(), display_order: index + 1 })));

  if (imageError || colorError || sizeError || detailsError) {
    await supabase.from('products').delete().eq('id', product.id);
    return NextResponse.json({ error: 'Unable to save all product information. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ id: product.id, message: 'Product created.' }, { status: 201 });
}
