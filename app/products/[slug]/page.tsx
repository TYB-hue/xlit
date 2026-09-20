import { notFound } from 'next/navigation';
import Footer from '../../../components/Footer';
import Nav from '../../../components/Nav';
import ProductCard from '../../../components/ProductCard';
import ProductGallery from '../../../components/ProductGallery';
import ProductPurchasePanel from '../../../components/ProductPurchasePanel';
import ReviewForm from '../../../components/ReviewForm';
import { getProductBySlug, getProducts } from '../../../lib/catalog';

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [product, products] = await Promise.all([getProductBySlug(params.slug), getProducts()]);
  if (!product) notFound();
  const recommendations = products.filter(({ slug }) => slug !== product.slug);
  // Four identical cycles keep the marquee filled on wide screens; translating
  // half the track still lands on the same review sequence for a seamless loop.
  const reviewTrack = Array.from({ length: 8 }, () => product.reviews).flat();

  return (
    <>
      <Nav />
      <main className="bg-bg">
        <section className="mx-auto max-w-[92rem] px-6 py-10 sm:py-16 lg:px-10 lg:py-20">
          <p className="text-sm text-inkdim"><a href="/products" className="transition-colors hover:text-lime">Products</a> <span className="mx-2">/</span> {product.name}</p>
          <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] lg:gap-16">
            <ProductGallery images={product.images} name={product.name} />

            <div className="lg:pt-4">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-lime">{product.collection}</p>
              <div className="mt-5 flex items-center gap-2 text-sm text-inkdim"><span className="text-lime">★★★★★</span><span>{product.rating} ({product.reviewCount} reviews)</span></div>
              <h1 className="font-display mt-5 text-4xl font-light tracking-[-0.04em] text-ink sm:text-5xl">{product.name}</h1>
              <p className="mt-5 text-2xl text-ink">{product.price}</p>

              <ProductPurchasePanel product={product} />
            </div>
          </div>
        </section>

        <section className="border-y border-stroke bg-[#141414] px-4 py-12 sm:px-6 sm:py-20">
          <h2 className="font-display text-center text-3xl font-light tracking-[-0.03em] text-ink sm:text-4xl">Customer reviews</h2>
          <div className="review-marquee mt-10 overflow-hidden">
            <div className="review-track flex w-max">
              {reviewTrack.map((review, index) => (
                <article key={`${review.name}-${index}`} className="w-[calc(100vw-2rem)] max-w-[320px] rounded-2xl border border-stroke bg-[#0F0F0F] p-5 sm:w-[360px] sm:max-w-none sm:p-6">
                  <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime font-medium text-bg">{review.name.charAt(0)}</span><span className="font-medium text-ink">{review.name}</span></div>
                  <p className="mt-5 tracking-[0.14em] text-lime">{'★'.repeat(review.stars)}</p>
                  <p className="mt-4 text-sm leading-relaxed text-inkdim">{review.text}</p>
                </article>
              ))}
            </div>
          </div>
          <ReviewForm productSlug={product.slug} />
        </section>

        <section className="mx-auto max-w-[92rem] px-6 py-16 sm:py-20 lg:px-10 lg:py-24">
          <div className="flex items-end justify-between gap-5"><div><p className="text-sm font-medium uppercase tracking-[0.22em] text-lime">More from XLIT</p><h2 className="font-display mt-3 text-3xl font-light tracking-[-0.03em] text-ink sm:text-4xl">You may also like</h2></div><a href="/products" className="text-sm text-inkdim transition-colors hover:text-lime">View all</a></div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {recommendations.map((item, index) => <ProductCard key={item.slug} product={item} index={index} />)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
