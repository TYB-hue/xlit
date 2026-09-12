import type { Product } from '../data/products';

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#2b2b2b] bg-[#0F0F0F] p-4 sm:p-5">
      <div className="w-full overflow-hidden rounded-xl bg-[#0F0F0F]">
        <img
          src={`/products/${product.images[0]}`}
          alt={`XLIT ${product.name} ${index + 1}`}
          className="block h-auto w-full object-contain"
        />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-ink sm:text-lg">{product.name}</h2>
          <p className="mt-1 text-sm text-inkdim sm:text-base">{product.price}</p>
        </div>
        <a
          href={`/products/${product.slug}`}
          className="hero-cta shrink-0 rounded-lg bg-lime px-4 py-2 text-xs font-medium uppercase tracking-wide text-neutral-900 sm:px-6 sm:py-2.5 sm:text-sm"
        >
          <span className="text-container"><span className="text">View</span></span>
        </a>
      </div>
    </article>
  );
}
