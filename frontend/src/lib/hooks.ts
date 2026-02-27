'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from './api-client';
import type { ApiResponse } from './types';

interface UseListReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useList<T>(endpoint: string): UseListReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<ApiResponse<T[]>>(endpoint);
      setData(res.data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Network error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

interface MutationState {
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

interface UseMutationReturn {
  state: MutationState;
  create: (endpoint: string, body: unknown) => Promise<boolean>;
  update: (endpoint: string, body: unknown) => Promise<boolean>;
  remove: (endpoint: string) => Promise<boolean>;
  resetError: () => void;
}

export function useMutation(): UseMutationReturn {
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
    fieldErrors: {},
  });

  function resetError(): void {
    setState({ loading: false, error: null, fieldErrors: {} });
  }

  function extractErrors(err: unknown): { message: string; fieldErrors: Record<string, string> } {
    const fieldErrors: Record<string, string> = {};
    let message = 'Something went wrong';

    if (err && typeof err === 'object') {
      const obj = err as Record<string, unknown>;
      if (typeof obj.message === 'string') message = obj.message;
      if (Array.isArray(obj.errors)) {
        for (const e of obj.errors as Array<{ field?: string; message?: string; path?: string[] }>) {
          const key = e.field || e.path?.[0];
          if (key) fieldErrors[key] = e.message || 'Invalid';
        }
      }
    }
    return { message, fieldErrors };
  }

  async function create(endpoint: string, body: unknown): Promise<boolean> {
    setState({ loading: true, error: null, fieldErrors: {} });
    try {
      await api.post(endpoint, body);
      setState({ loading: false, error: null, fieldErrors: {} });
      return true;
    } catch (err: unknown) {
      const { message, fieldErrors } = extractErrors(err);
      setState({ loading: false, error: message, fieldErrors });
      return false;
    }
  }

  async function update(endpoint: string, body: unknown): Promise<boolean> {
    setState({ loading: true, error: null, fieldErrors: {} });
    try {
      await api.put(endpoint, body);
      setState({ loading: false, error: null, fieldErrors: {} });
      return true;
    } catch (err: unknown) {
      const { message, fieldErrors } = extractErrors(err);
      setState({ loading: false, error: message, fieldErrors });
      return false;
    }
  }

  async function remove(endpoint: string): Promise<boolean> {
    setState({ loading: true, error: null, fieldErrors: {} });
    try {
      await api.delete(endpoint);
      setState({ loading: false, error: null, fieldErrors: {} });
      return true;
    } catch (err: unknown) {
      const { message, fieldErrors } = extractErrors(err);
      setState({ loading: false, error: message, fieldErrors });
      return false;
    }
  }

  return { state, create, update, remove, resetError };
}
