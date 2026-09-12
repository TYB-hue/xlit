import Reveal from './Reveal';

const collections = [
  { name: 'Blanks', detail: 'A clean foundation for your next idea.', position: 'object-center' },
  { name: 'Tops', detail: 'Everyday pieces, made to be worn loud.', position: 'object-[52%_center]' },
  { name: 'Bottoms', detail: 'Built for the full look, from the ground up.', position: 'object-[48%_center]' },
];

export default function CollectionSection() {
  return (
    <section id="products" className="border-t border-stroke bg-bg py-20 sm:py-28">
      <Reveal className="px-6 text-center lg:px-10">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-lime">XLIT essentials</p>
        <h2 className="font-display mt-4 text-4xl font-light tracking-[-0.04em] text-ink sm:text-6xl">
          Collections
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-1 bg-stroke sm:grid-cols-3">
        {collections.map((collection, index) => (
          <Reveal key={collection.name} className={index === 0 ? 'delay-100' : index === 1 ? 'delay-200' : 'delay-300'}>
            <article className="group relative flex min-h-[490px] overflow-hidden bg-card p-7 sm:min-h-[560px] lg:min-h-[650px]">
              <div className="absolute inset-0 bg-gradient-to-b from-card via-cardmuted to-bg" aria-hidden="true" />
              <img
                src="/products/custom-shirt.png"
                alt=""
                className={`absolute inset-x-0 top-10 h-[62%] w-full ${collection.position} object-contain opacity-80 grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0`}
              />
              <div className="relative z-10 mt-auto">
                <p className="text-sm uppercase tracking-[0.18em] text-lime">{collection.name}</p>
                <p className="mt-3 max-w-xs text-base text-inkdim">{collection.detail}</p>
                <a
                  href="/products"
                  className="hero-cta hero-cta--lime-sweep mt-6 rounded-none bg-white px-7 py-3 text-sm font-medium uppercase tracking-wide text-bg"
                >
                  <span className="text-container"><span className="text">Shop now</span></span>
                </a>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
