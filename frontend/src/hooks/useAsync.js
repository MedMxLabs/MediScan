import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs `fn` on mount and whenever `deps` change. Results from a superseded run
 * (dep change, reload, unmount) are dropped. `reload()` keeps the previous `data`
 * while loading and resolves once the new run settles.
 */
export default function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  const runId = useRef(0);

  useEffect(() => {
    fnRef.current = fn;
  });

  const reload = useCallback(async () => {
    const id = ++runId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (id === runId.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === runId.current) setState((s) => ({ ...s, loading: false, error }));
    }
  }, []);

  useEffect(() => {
    reload();
    return () => {
      runId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload };
}

export function errorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}
