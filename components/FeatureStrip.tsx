import Reveal from './Reveal';

const features = [
  {
    title: 'Predict risk earlier',
    body: 'Surface compliance and payment risk before it becomes a client conversation you didn\u2019t plan for.',
  },
  {
    title: 'One connected view',
    body: 'Work, conversations, time & billing, and analytics — read from a single, calm workspace.',
  },
  {
    title: 'Built to sit quietly',
    body: 'No noisy dashboards. Insights only surface when they need your attention.',
  },
];

export default function FeatureStrip() {
  return (
    <section id="features" className="border-t border-stroke">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <Reveal>
          <p className="text-[14px] text-inkdim">Why firms switch</p>
          <h2 className="mt-3 max-w-md text-[34px] font-semibold leading-tight text-ink">
            Everything in one place, nothing shouting for attention
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} className={`delay-[${i * 120}ms]`}>
              <div className="h-full rounded-2xl border border-stroke bg-card p-7">
                <h3 className="text-[17px] font-medium text-ink">{f.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-inkdim">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
