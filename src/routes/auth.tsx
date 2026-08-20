import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion étudiante — Caravane Étudiants" },
      {
        name: "description",
        content:
          "Connectez-vous ou créez votre compte étudiant pour réserver vos caravanes universitaires et retrouver vos billets QR.",
      },
      { property: "og:title", content: "Connexion — Caravane Étudiants" },
      {
        property: "og:description",
        content: "Accédez à vos réservations, favoris et billets électroniques.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/billets" });
  }, [loading, user, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        toast.success("Compte créé", {
          description: "Vérifiez votre boîte mail si une confirmation est demandée.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connexion réussie");
      }
    } catch (error) {
      toast.error("Échec de l'authentification", {
        description: error instanceof Error ? error.message : "Réessayez plus tard.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden bg-gradient-primary px-5 pb-16 pt-6 text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <div className="relative mx-auto max-w-lg">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary-foreground/15 px-3 py-2 text-xs font-semibold backdrop-blur"
          >
            <ArrowLeft className="size-4" /> Retour à l'accueil
          </Link>
          <h1 className="mt-6 text-[24px] font-extrabold leading-tight tracking-tight">
            Espace étudiant
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/80">
            Réservez, payez et retrouvez vos billets sur tous vos appareils.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-lg px-5 pb-16">
        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-lifted">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-accent p-1">
            {(["signin", "signup"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                  mode === value
                    ? "bg-card text-primary shadow-ambient"
                    : "text-muted-foreground",
                )}
              >
                {value === "signin" ? "Connexion" : "Créer un compte"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === "signup" && (
              <>
                <Field label="Nom complet">
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="field"
                    placeholder="Mamadou Diop"
                  />
                </Field>
                <Field label="Téléphone">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="field"
                    placeholder="+221 77 000 00 00"
                  />
                </Field>
              </>
            )}
            <Field label="Adresse e-mail">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                placeholder="etudiant@univ.sn"
                autoComplete="email"
              />
            </Field>
            <Field label="Mot de passe">
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </Field>

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lifted transition-transform active:scale-[0.99] disabled:opacity-70"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "signin" ? (
                <LogIn className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {mode === "signin" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5 [&_input]:w-full [&_input]:rounded-2xl [&_input]:border [&_input]:border-border [&_input]:bg-background [&_input]:px-4 [&_input]:py-3 [&_input]:text-sm [&_input]:font-medium [&_input]:outline-none [&_input]:transition-colors [&_input:focus]:border-primary-accent">
        {children}
      </div>
    </label>
  );
}
