import Footer from '../../components/Footer';
import Nav from '../../components/Nav';

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg">
        <section className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-lime">About XLIT</p>
          <h1 className="font-display mt-5 text-5xl font-light tracking-[-0.05em] text-ink sm:text-6xl">From the nano to the world.</h1>
          <div className="mt-10 space-y-6 text-base leading-relaxed text-inkdim sm:text-lg">
            <p>XLIT is made for the version of you that refuses to settle for less. Every piece starts with an idea, an intention, and a point of view worth wearing.</p>
            <p>Born from the unknown and inspired by Jahseh Dwayne, XLIT creates expressive everyday pieces with a focus on individuality, quality, and culture.</p>
            <p>We believe clothing should feel personal. Whether you choose an XLIT original or make something entirely your own, it should say something before you do.</p>
          </div>
          <a href="/products" className="hero-cta mt-10 inline-flex rounded-lg bg-lime px-6 py-3 text-sm font-medium uppercase tracking-wide text-bg"><span className="text-container"><span className="text">Explore products</span></span></a>
        </section>
      </main>
      <Footer />
    </>
  );
}
