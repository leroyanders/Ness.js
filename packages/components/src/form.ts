import { createElement, useEffect, useRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Form as RouterForm, useActionData, useNavigation } from 'react-router';

export interface FormState<Data = unknown> {
  pending: boolean;
  data?: Data | undefined;
  error?: unknown;
  state: 'idle' | 'loading' | 'submitting';
}

export type FormProps<Data = unknown> = Omit<
  ComponentProps<typeof RouterForm>,
  'children'
> & {
  children: ReactNode | ((state: FormState<Data>) => ReactNode);
  /** Reset the fields when the action returns without an error. */
  resetOnSuccess?: boolean;
};

/**
 * A `<Form>` that hands its state to its children.
 *
 * The state a form needs — is it submitting, what did the action return, did it
 * fail — is spread across hooks that each have to be called in the right place.
 * This gathers them:
 *
 *   <Form method="post">
 *     {({ pending, error }) => (
 *       <>
 *         <input name="email" aria-invalid={Boolean(error)} />
 *         <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
 *       </>
 *     )}
 *   </Form>
 *
 * `resetOnSuccess` clears the fields once the action returns without an error —
 * what a comment box or a create form almost always wants, and what is easy to
 * get wrong: resetting on every render wipes what the user is typing.
 *
 * It remains a real form. Submitting works before hydration, and `children` may
 * be ordinary elements instead of a function.
 */
function Form<Data = unknown>({
  children,
  resetOnSuccess = false,
  ...props
}: FormProps<Data>): ReactNode {
  const navigation = useNavigation();
  const data = useActionData() as (Data & { error?: unknown }) | undefined;
  const reference = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const pending = navigation.state !== 'idle';
  const error = data?.error;

  useEffect(() => {
    if (!resetOnSuccess) return;
    // Reset on the transition out of pending, not on every render, and only
    // when the action did not report a problem.
    if (wasPending.current && !pending && data && !error) {
      reference.current?.reset();
    }
    wasPending.current = pending;
  }, [data, error, pending, resetOnSuccess]);

  return createElement(
    RouterForm,
    // `data-*` passes through to the underlying <form>, but a component's prop
    // type cannot express that the way an intrinsic element's can.
    {
      ...props,
      ref: reference,
      'data-ness-pending': pending || undefined,
    } as ComponentProps<typeof RouterForm>,
    typeof children === 'function'
      ? children({ pending, data, error, state: navigation.state })
      : children,
  );
}

export { Form };
