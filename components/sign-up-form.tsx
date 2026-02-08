"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-kodrix-purple/20 dark:border-amber-500/20 shadow-xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-orange-500" />
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Kayıt Ol</CardTitle>
          <CardDescription>Yeni bir hesap oluşturun</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@kodrix.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus-visible:ring-kodrix-purple dark:focus-visible:ring-amber-500"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Şifre</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus-visible:ring-kodrix-purple dark:focus-visible:ring-amber-500"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Şifre Tekrar</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="focus-visible:ring-kodrix-purple dark:focus-visible:ring-amber-500"
                />
              </div>
              {error && <p className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded">{error}</p>}
              <Button type="submit" className="w-full bg-kodrix-purple hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-gray-900 font-bold transition-all" disabled={isLoading}>
                {isLoading ? "Hesap Oluşturuluyor..." : "Kayıt Ol"}
              </Button>
            </div>
            <div className="mt-6 text-center text-sm">
              Zaten hesabınız var mı?{" "}
              <Link href="/login" className="font-semibold text-kodrix-purple hover:text-purple-700 dark:text-amber-500 dark:hover:text-amber-400 underline underline-offset-4 transition">
                Giriş Yap
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
