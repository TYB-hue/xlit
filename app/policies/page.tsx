import Footer from '../../components/Footer';
import Nav from '../../components/Nav';

const policies = [
  { title: 'Orders', content: 'Orders are prepared within 2–4 business days. You will receive confirmation once your order has been placed.' },
  { title: 'Shipping', content: 'Delivery timing depends on your location and the carrier. Shipping costs and available delivery options are shown during checkout.' },
  { title: 'Returns & exchanges', content: 'Please contact us as soon as possible if there is an issue with your order. Items must be unused and in their original condition to be eligible for review.' },
  { title: 'Custom items', content: 'Because custom pieces are made specifically for you, they cannot be returned or exchanged unless they arrive damaged or incorrect.' },
  { title: 'Privacy', content: 'We use your order information only to process purchases, provide support, and improve the XLIT experience. We do not sell your personal information.' },
];

export default function PoliciesPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg">
        <section className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-lime">XLIT</p>
          <h1 className="font-display mt-5 text-5xl font-light tracking-[-0.05em] text-ink sm:text-6xl">Policies</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-inkdim sm:text-lg">Everything you need to know before placing an order.</p>
          <div className="mt-12 divide-y divide-stroke border-y border-stroke">
            {policies.map((policy) => (
              <article key={policy.title} className="py-7 sm:py-8">
                <h2 className="text-base font-medium uppercase tracking-wide text-ink">{policy.title}</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-inkdim">{policy.content}</p>
              </article>
            ))}
          </div>
          <p className="mt-10 text-inkdim">Questions? <a href="/contact" className="text-lime underline underline-offset-4">Email us</a>.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
