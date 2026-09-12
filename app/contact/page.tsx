import CopyEmailButton from '../../components/CopyEmailButton';
import Footer from '../../components/Footer';
import Nav from '../../components/Nav';

const email = 'frank.wilson.incall@gmail.com';

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg">
        <section className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-lime">Contact XLIT</p>
          <h1 className="font-display mt-5 text-5xl font-light tracking-[-0.05em] text-ink sm:text-6xl">Let&apos;s talk.</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-inkdim sm:text-lg">For product questions, order support, or anything else, please contact us by email.</p>

          <div className="mt-12 rounded-2xl border border-stroke bg-card p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-lime">Email us</p>
            <p className="mt-4 break-words text-xl text-ink sm:text-2xl">{email}</p>
            <div className="mt-7"><CopyEmailButton email={email} /></div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
