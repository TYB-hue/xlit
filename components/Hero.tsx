import Reveal from './Reveal';
import HeroVideo from './HeroVideo';

export default function Hero() {
  return (
    <section
      id="top"
      className="isolate relative flex min-h-[calc(100svh-88px)] items-center justify-center overflow-hidden px-6 py-24 lg:px-10"
    >
      <HeroVideo />

      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/80 via-bg/60 to-bg/20"
        aria-hidden="true"
      />

      <Reveal className="relative z-10 mx-auto w-full max-w-7xl">
      <div className="flex flex-col items-start text-left text-white">
        <h1 className="font-display max-w-3xl text-4xl font-light leading-[1.02] tracking-[-0.045em] drop-shadow-2xl sm:text-5xl lg:text-6xl">
          From the Nano to the world
        </h1>
        
        <p className="mt-8 max-w-2xl text-base font-light leading-relaxed text-white/85 sm:text-lg lg:text-xl">
          Born from the unknown and inspired by Jahseh Dwayne, XLIT is made for
          the version of you still ahead. Every piece is art for an intentional,
          unapologetic mindset—from the nano to the world.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <a
            href="/products"
            // className="hero-cta hero-cta--lime-sweep rounded-xl bg-white px-5 py-4 text-base font-medium text-neutral-900"
            className="hero-cta hero-cta--lime-sweep rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-neutral-900"
          >
            <span className="text-container">
              <span className="text">Products</span>
            </span>
          </a>
          <a
            href="/customize"
          //   className="hero-cta rounded-xl bg-lime px-9 py-4 text-base font-medium text-neutral-900"
          className="hero-cta rounded-lg bg-lime px-6 py-2.5 text-sm font-medium text-neutral-900"
           >
          
            <span className="text-container">
              <span className="text">Customize</span>
            </span>
          </a>
        </div>
      </div>
      </Reveal>
    </section>
  );
}
