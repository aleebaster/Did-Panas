import type { Metadata } from "next";

import { LoginForm } from "@/components/admin/login-form";
import { adminCredentials, isSignedIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export const instant = false;

export const metadata: Metadata = {
  title: "Вхід",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isSignedIn()) {
    redirect("/admin");
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="card-paper w-full max-w-sm p-6 sm:p-8">
        <LoginForm defaultLogin={adminCredentials()?.login ?? ""} />
      </div>
    </div>
  );
}
