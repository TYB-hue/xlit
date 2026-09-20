import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/supabase-admin';

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
