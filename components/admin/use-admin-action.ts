"use client";

import { useActionState } from "react";

export interface AdminActionResult {
  ok: boolean;
  error: string | null;
  productId?: string;
}

const initialState: AdminActionResult = { ok: false, error: null };

/**
 * Обгортає сервер-екшн з сигнатурою `(formData)` під `useActionState`,
 * який вимагає `(state, payload)`.
 */
export function useAdminAction(
  action: (formData: FormData) => Promise<AdminActionResult>,
) {
  return useActionState(
    (_state: AdminActionResult, payload: unknown) =>
      action(payload as FormData),
    initialState,
  );
}
