const sideModules = [
  {
    group: 'Integrations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d7f24e" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9z" />
      </svg>
    ),
    title: 'Tools',
    detail: 'HubSpot · QBO · UltraTax · Google · Power BI',
  },
  {
    group: 'Work',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d7f24e" strokeWidth="1.6">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 4v-1M16 4v-1" />
      </svg>
    ),
    title: 'Workspace',
    detail: 'Tax · Accounting · 1099s · Payroll',
  },
  {
    group: 'Platform',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d7f24e" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
    title: 'Time & Billing',
    detail: null,
  },
  {
    group: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d7f24e" strokeWidth="1.6">
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7" />
      </svg>
    ),
    title: 'Client Records',
    detail: null,
  },
  {
    group: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d7f24e" strokeWidth="1.6">
        <path d="M4 19V5M4 19h16M8 15l3-4 3 3 4-6" />
      </svg>
    ),
    title: 'Analytics',
    detail: null,
  },
];

export default function DashboardMock() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:mx-0">
      {/* ambient glow behind the whole cluster — warmth, not spectacle */}
      <div className="pointer-events-none absolute -inset-16 -z-10 animate-glow rounded-full bg-lime/10 blur-3xl" />

      <div className="grid grid-cols-[1fr_auto_1.15fr] items-center gap-2">
        {/* left column: stacked module cards */}
        <div className="flex flex-col gap-4">
          {sideModules.map((m, i) => (
            <div key={m.title}>
              {m.group && (
                <p className="mb-2 text-[13px] text-inkdim">{m.group}</p>
              )}
              <div
                className="animate-floatSlow rounded-2xl border border-stroke bg-card px-4 py-3.5 shadow-card"
                style={{ animationDelay: `${i * 0.4}s` }}
              >
                <div className="flex items-center gap-2.5">
                  {m.icon}
                  <span className="text-[14px] font-medium text-ink">{m.title}</span>
                </div>
                {m.detail && (
                  <p className="mt-1.5 text-[12.5px] leading-snug text-inkdim">{m.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* connector column */}
        <div className="flex h-full flex-col items-center justify-center px-1">
          <svg width="40" height="220" viewBox="0 0 40 220" className="hidden sm:block">
            <path className="dashed-link" d="M0 20 C20 20 20 110 40 110" />
            <path className="dashed-link" d="M0 110 C20 110 20 110 40 110" />
            <path className="dashed-link" d="M0 200 C20 200 20 110 40 110" />
          </svg>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime shadow-soft">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 0L14 4V10L7 14L0 10V4L7 0Z" fill="#0a0a0c" />
            </svg>
          </span>
        </div>

        {/* right column: the "live" record + stat grid */}
        <div className="relative">
          <div className="absolute -right-3 -top-3 h-full w-full rounded-2xl border border-stroke bg-cardmuted" />
          <div className="relative animate-float rounded-2xl border border-stroke bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-lime/15 px-2.5 py-1 text-[12px] font-medium text-lime">
                90 &nbsp;Compliance Risk
              </span>
              <span className="text-[12px] text-inkdim">Tue, Sep 1</span>
            </div>

            <h4 className="text-[17px] font-semibold text-ink">Payment</h4>
            <p className="text-[13px] text-inkdim">Blueridge Hospitality LLC</p>

            <div className="mt-3 rounded-lg border border-stroke px-3 py-2 text-[12.5px] text-inkdim">
              ACH payment failed — Invoice @2025-004
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-cardmuted px-2.5 py-1 text-[11.5px] text-inkdim">
                Payment Failed
              </span>
              <span className="text-[12.5px] text-lime">Review</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Work', top: '20', topSub: 'Past Due', bottom: '8', bottomSub: 'At Risk' },
              { label: 'Conversations', top: '8', topSub: 'Urgent', bottom: '3', bottomSub: 'Action Req.' },
              { label: 'Notifications', top: '3', topSub: 'Urgent', bottom: '12', bottomSub: 'Action Req.' },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-stroke bg-card p-3.5">
                <p className="text-[12px] text-inkdim">{c.label}</p>
                <p className="mt-2 text-xl font-semibold text-ink">{c.top}</p>
                <p className="text-[11.5px] text-inkdim">{c.topSub}</p>
                <p className="mt-2 text-xl font-semibold text-ink">{c.bottom}</p>
                <p className="text-[11.5px] text-inkdim">{c.bottomSub}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-stroke bg-card p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#d7f24e">
                <path d="M12 2l1.8 5.7L20 9l-6.2 1.3L12 16l-1.8-5.7L4 9l6.2-1.3L12 2z" />
              </svg>
              <span className="text-[13.5px] font-medium text-ink">Insight Analysis</span>
            </div>
            <ul className="space-y-1.5 text-[12.5px] text-inkdim">
              <li>◇ 1099-NEC income up 40% YoY</li>
              <li>◇ Q3 estimated payment missed</li>
              <li>◇ Potential underpayment penalty risk</li>
            </ul>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { top: '367:55', sub: 'Time Logged' },
              { top: '89', sub: 'Tasks Due Today' },
              { top: '83%', sub: 'Utilization' },
            ].map((c) => (
              <div key={c.sub} className="rounded-2xl border border-stroke bg-cardmuted p-3.5">
                <p className="text-[15px] font-semibold text-ink">{c.top}</p>
                <p className="text-[11.5px] text-inkdim">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
