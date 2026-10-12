import { useEffect, useRef, useState } from "react";

/** Shared loading/error state. Discards UI callbacks when a screen is left. */
export function useAsyncAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const busy = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function run<T>(
    task: () => Promise<T>,
    onSuccess?: (result: T) => void,
  ) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");

    try {
      const result = await task();
      if (mounted.current) onSuccess?.(result);
    } catch (cause) {
      if (mounted.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Something went wrong. Please try again.",
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return { pending, error, run };
}
