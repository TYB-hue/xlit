'use client';

import { useState } from 'react';

export default function CopyEmailButton({ email }: { email: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const copyEmail = async () => {
    await navigator.clipboard.writeText(email);
    setIsCopied(true);
  };

  return (
    <button type="button" onClick={copyEmail} className="rounded-lg bg-lime px-5 py-3 text-sm font-medium text-bg transition-transform hover:-translate-y-0.5">
      {isCopied ? 'Email copied' : 'Copy email address'}
    </button>
  );
}
