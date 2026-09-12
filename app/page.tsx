import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Nav from '../components/Nav';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';


export default function Home() {
  return (
    <>
      <Nav />

      <main>
        <Hero />
        <section id="products" className="border-t border-stroke bg-bg">
          <div className="mx-auto max-w-[92rem] px-6 py-14 sm:py-20 lg:px-10 lg:py-24">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-lime">XLIT essentials</p>
            <h2 className="font-display mt-4 text-4xl font-light tracking-[-0.04em] text-ink sm:text-5xl lg:text-6xl">
              Products
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-inkdim sm:text-lg">
              Choose a piece that speaks for you.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => <ProductCard key={product.slug} product={product} index={index} />)}
            </div>
          </div>
        </section>
      </main>
    
      <Footer />
    </>
  );
}
