import { unstable_noStore as noStore } from 'next/cache';
import { products as fallbackProducts, type Product } from '../data/products';
import { createClient } from '@supabase/supabase-js';

type CatalogRow = {
  slug: string;
  name: string;
  price_egp: number;
  collection: string;
  stock_message: string;
  stock_quantity: number;
  rating: number;
  review_count: number;
  display_order: number;
  product_images: { image_path: string; display_order: number }[];
  product_colors: { name: string; display_order: number }[];
  product_sizes: { name: string; display_order: number }[];
  product_details: { title: string; content: string; display_order: number }[];
  product_reviews: { reviewer_name: string; content: string; stars: number; created_at: string }[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function getCatalogClient() {
  if (!supabaseUrl || !supabasePublishableKey) return null;

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toProduct(row: CatalogRow): Product {
  return {
    slug: row.slug,
    images: [...row.product_images]
      .sort((a, b) => a.display_order - b.display_order)
      .map(({ image_path }) => image_path.replace(/^\/products\//, '')),
    name: row.name,
    price: `${row.price_egp} le`,
    collection: row.collection,
    stockMessage: row.stock_message,
    colors: [...row.product_colors]
      .sort((a, b) => a.display_order - b.display_order)
      .map(({ name }) => name),
    sizes: [...row.product_sizes]
      .sort((a, b) => a.display_order - b.display_order)
      .map(({ name }) => name),
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews: [...row.product_reviews]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(({ reviewer_name, content, stars }) => ({ name: reviewer_name, text: content, stars })),
    details: [...row.product_details]
      .sort((a, b) => a.display_order - b.display_order)
      .map(({ title, content }) => ({ title, content })),
  };
}

export async function getProducts(): Promise<Product[]> {
  noStore();
  const client = getCatalogClient();
  if (!client) return fallbackProducts;

  const { data, error } = await client
    .from('products')
    .select('slug, name, price_egp, collection, stock_message, stock_quantity, rating, review_count, display_order, product_images(image_path, display_order), product_colors(name, display_order), product_sizes(name, display_order), product_details(title, content, display_order), product_reviews(reviewer_name, content, stars, created_at)')
    .eq('is_active', true)
    .order('display_order');

  if (error || !data) {
    console.error('Unable to load XLIT catalog from Supabase:', error?.message);
    return fallbackProducts;
  }

  return (data as CatalogRow[]).map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const catalog = await getProducts();
  return catalog.find((product) => product.slug === slug);
}
