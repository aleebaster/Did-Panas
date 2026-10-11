"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/brand/logo";
import { FormError } from "@/components/admin/controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = { error: null };

export function LoginForm({ defaultLogin }: { defaultLogin: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-3">
        <BrandMark className="size-10 text-ink" />
        <div>
          <p className="font-display text-lg font-semibold tracking-[0.16em] uppercase">
            DID PANAS
          </p>
          <p className="text-xs text-muted-foreground">Вхід до панелі</p>
        </div>
      </div>

      <FormError error={state.error} />

      <div className="space-y-2">
        <Label htmlFor="login">Логін</Label>
        <Input
          id="login"
          name="login"
          autoComplete="username"
          defaultValue={defaultLogin}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="btn-vintage h-10 w-full gap-2"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        Увійти
      </Button>

      <div className="border-t border-border pt-4 text-xs text-muted-foreground">
        {showHint ? (
          <p>
            Логін і пароль задаються змінними середовища{" "}
            <code>ADMIN_LOGIN</code> та <code>ADMIN_PASSWORD</code>: локально у
            файлі <code>.env.local</code>, на Vercel — у Settings → Environment
            Variables.
          </p>
        ) : (
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => setShowHint(true)}
          >
            Забули дані для входу?
          </button>
        )}
        <p className="mt-3">
          <Link href="/" className="underline underline-offset-2 hover:text-foreground">
            Перейти на сайт
          </Link>
        </p>
      </div>
    </form>
  );
}
