import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

const MAX_IMAGES = 8;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: Request) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const slug = formData?.get('slug');
  const files = formData?.getAll('images').filter((entry): entry is File => entry instanceof File) ?? [];

  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    || files.length === 0 || files.length > MAX_IMAGES
    || files.some((file) => !ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_SIZE)) {
    return NextResponse.json({ error: 'Upload 1–8 JPG, PNG, or WebP images, each up to 5 MB.' }, { status: 400 });
  }

  const uploadedPaths: string[] = [];
  try {
    for (const file of files) {
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${slug}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from('product-images').upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      uploadedPaths.push(path);
    }
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from('product-images').remove(uploadedPaths);
    console.error('Unable to upload product images:', error);
    return NextResponse.json({ error: 'Unable to upload product images. Please try again.' }, { status: 500 });
  }

  const urls = uploadedPaths.map((path) => supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);
  return NextResponse.json({ urls }, { status: 201 });
}
