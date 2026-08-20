import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Wallet } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { QrCode } from "@/components/QrCode";
import { formatPrice, getCaravane, student } from "@/lib/caravanes";
import { useBookings } from "@/hooks/use-local-store";

export const Route = createFileRoute("/billets")({
  head: () => ({
    meta: [
      { title: "Mes billets électroniques — Caravane Étudiants" },
      {
        name: "description",
        content:
          "Retrouvez vos billets électroniques de caravanes étudiantes avec QR code de validation à l'embarquement.",
      },
      { property: "og:title", content: "Mes billets — Caravane Étudiants" },
      {
        property: "og:description",
        content: "Vos billets QR de caravanes universitaires, prêts pour l'embarquement.",
      },
    ],
  }),
  component: Billets,
});

function Billets() {
  const { bookings } = useBookings();

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="bg-gradient-primary px-5 pb-12 pt-8 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-extrabold tracking-tight">Mes billets</h1>
          <p className="mt-1 text-sm text-primary-foreground/75">
            Présentez le QR code au responsable de l'amicale.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-3xl space-y-5 px-5">
        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-ambient">
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas encore de billet.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lifted"
            >
              Découvrir les caravanes
            </Link>
          </div>
        ) : (
          bookings.map((b) => {
            const c = getCaravane(b.caravaneId);
            if (!c) return null;
            return (
              <article
                key={b.id}
                className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-ambient"
              >
                <div className="flex items-center justify-between gap-3 bg-accent px-5 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-primary">
                    <CheckCircle2 className="size-4 text-success" /> Billet confirmé
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                    {b.reference}
                  </span>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-[auto_minmax(0,1fr)]">
                  <div className="mx-auto rounded-2xl border border-border/70 bg-background p-3 text-primary">
                    <QrCode value={b.reference} size={168} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <h2 className="text-lg font-extrabold tracking-tight">
                      {c.from} <span className="text-muted-foreground">→</span> {c.to}
                    </h2>
                    <p className="text-muted-foreground">
                      {c.date} • {c.time}
                    </p>
                    <p className="text-muted-foreground">{c.pickup}</p>
                    <dl className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Passager</dt>
                        <dd className="font-bold">{student.name}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Places</dt>
                        <dd className="font-bold">{b.seats}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Payé via</dt>
                        <dd className="font-bold">{b.method}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Montant</dt>
                        <dd className="font-bold text-primary-accent">
                          {formatPrice(c.price * b.seats)} FCFA
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center gap-2 rounded-2xl bg-gradient-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-ambient transition-transform active:scale-[0.98]"
                      >
                        <Download className="size-4" /> Télécharger en PDF
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Mon billet Caravane Étudiants ${b.reference} : ${c.from} → ${c.to}, ${c.date} à ${c.time} (${c.pickup}).`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-xs font-bold transition-colors hover:bg-accent"
                      >
                        <Share2 className="size-4" /> Partager sur WhatsApp
                      </a>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-xs font-bold transition-colors hover:bg-accent"
                      >
                        <Wallet className="size-4" /> Wallet
                      </button>
                    </div>

                  </div>
                </div>
              </article>
            );
          })
        )}
      </main>

      <BottomNav />
    </div>
  );
}
