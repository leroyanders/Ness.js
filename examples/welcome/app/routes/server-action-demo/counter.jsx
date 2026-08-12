'use client';

import { useState, useTransition } from 'react';
import { recordClick } from './actions.js';

export default function Counter() {
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="rsc-demo-counter">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setResult(await recordClick(1));
          });
        }}
      >
        {pending ? 'Calling server action…' : 'Call server action directly'}
      </button>
      {result ? (
        <p data-testid="rsc-demo-result">
          Server hits: {result.hits} (recorded {result.receivedAt})
        </p>
      ) : null}
    </div>
  );
}
