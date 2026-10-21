import { useCallback, useState } from 'react';
import { useAction } from '../state/DataContext.jsx';

// Form state + submission. `validate` is one of the shared domain validators,
// so the UI reports exactly the errors the API would; any field errors the
// API still returns (e.g. stock changed meanwhile) are shown the same way.
export function useForm(initial, { validate, submit, success, onDone }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const { run, busy } = useAction();

  const set = useCallback(
    (field) => (eventOrValue) => {
      const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    },
    [],
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    // After errors render, move focus to the first invalid field so keyboard
    // and screen-reader users land on the problem.
    const focusFirstError = () => setTimeout(() => form.querySelector('[aria-invalid="true"]')?.focus(), 0);
    const check = validate(values);
    if (!check.ok) {
      setErrors(check.errors);
      focusFirstError();
      return;
    }
    const res = await run(() => submit(check.value), { success });
    if (res.ok) onDone?.(res.result);
    else if (res.error?.fields && Object.keys(res.error.fields).length) {
      setErrors(res.error.fields);
      focusFirstError();
    }
  };

  return { values, setValues, set, errors, busy, onSubmit };
}
