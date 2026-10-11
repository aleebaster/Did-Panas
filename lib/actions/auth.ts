"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/lib/auth";

export interface LoginState {
  error: string | null;
}

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!login || !password) {
    return { error: "Введіть логін та пароль." };
  }

  const ok = await signIn(login, password);
  if (!ok) {
    return { error: "Невірний логін або пароль." };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
