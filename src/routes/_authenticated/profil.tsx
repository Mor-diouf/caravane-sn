import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bell,
  Camera,
  Check,
  ChevronRight,
  CreditCard,
  Heart,
  HelpCircle,
  Loader2,
  LogOut,
  Mail,
  Megaphone,
  Pencil,
  Phone,
  Route as RouteIcon,
  Settings,
  Shield,
  Sparkles,
  TicketCheck,
  Trash2,
  Wallet,
  X,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { PaymentMark } from "@/components/PaymentMark";
import { UniversityMark } from "@/components/UniversityMark";
import { formatPrice, type ProfileUpdate } from "@/lib/student-shared";
import {
  favoritesQuery,
  profileQuery,
  ticketsQuery,
  universitiesQuery,
} from "@/lib/student-queries";
import { accessQuery } from "@/lib/dash-queries";
import { updateMyProfile, requestOrganizerAccount } from "@/lib/student.functions";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Mon profil étudiant — Caravane Étudiants" },
      {
        name: "description",
        content:
          "Gérez votre profil étudiant, votre université, votre moyen de paiement mobile et vos préférences de notifications pour vos caravanes.",
      },
      { property: "og:title", content: "Profil étudiant — Caravane Étudiants" },
      {
        property: "og:description",
        content:
          "Carte étudiant numérique, historique de trajets, moyens de paiement Wave / Orange Money et préférences de voyage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profil,
});

const methods = [
  { id: "wave", label: "Wave" },
  { id: "orange", label: "Orange Money" },
  { id: "free", label: "Free Money" },
] as const;

type Method = (typeof methods)[number]["id"];

const links = [
  { icon: TicketCheck, label: "Historique des trajets", to: "/billets" as const },
  { icon: Heart, label: "Mes favoris", to: "/favoris" as const },
];


function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "É"
  );
}

async function compressAvatar(file: File, maxSize = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(ev.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Draft = {
  full_name: string;
  student_id: string;
  phone: string;
  email: string;
  university_id: string | null;
  avatar_url: string | null;
};

function Profil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useQuery(profileQuery);
  const { data: access } = useQuery(accessQuery());
  const { data: bookings = [] } = useQuery(ticketsQuery);
  const { data: favorites = [] } = useQuery(favoritesQuery);
  const { data: universities = [] } = useQuery(universitiesQuery);

  const dynamicActions = useMemo(() => {
    const base: Array<{ icon: any; label: string; hint: string; to?: any }> = [
      { icon: Shield, label: "Sécurité et confidentialité", hint: "Mot de passe, appareils" },
      { icon: Settings, label: "Paramètres du compte", hint: "Langue, données" },
      { icon: HelpCircle, label: "Aide et support", hint: "FAQ, WhatsApp support" },
    ];
    const top = [];
    if (access?.isAdmin) {
      top.push({ icon: Shield, label: "Espace Admin", hint: "Gérer la plateforme", to: "/admin" as const });
    }
    if (access?.organizerId) {
      top.push({ icon: Megaphone, label: "Espace Organisateur", hint: "Gérer vos caravanes", to: "/organizer" as const });
    }
    if (!access?.isAdmin && !access?.organizerId) {
      top.push({ icon: Megaphone, label: "Devenir organisateur", hint: "Publiez vos caravanes" });
    }
    return [...top, ...base];
  }, [access]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const modalAvatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    full_name: "",
    student_id: "",
    phone: "",
    email: "",
    university_id: null,
    avatar_url: null,
  });

  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: "", phone: "", studentCard: "", idCard: "" });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, isModal = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const compressed = await compressAvatar(file);
      if (isModal) {
        setDraft((d) => ({ ...d, avatar_url: compressed }));
      } else {
        await save.mutateAsync({ avatar_url: compressed });
        toast.success("Photo de profil mise à jour !");
      }
    } catch (err) {
      toast.error("Erreur lors du chargement de l'image");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  useEffect(() => {
    if (!profile) return;
    setDraft({
      full_name: profile.full_name ?? "",
      student_id: profile.student_id ?? "",
      phone: profile.phone ?? "",
      email: profile.email ?? "",
      university_id: profile.university_id ?? null,
      avatar_url: profile.avatar_url ?? null,
    });
    setOrgForm((f) => ({
      ...f,
      name: profile.full_name ?? "",
      phone: profile.phone ?? "",
    }));
  }, [profile]);

  const save = useMutation({
    mutationFn: (input: ProfileUpdate) => updateMyProfile({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
      toast.success("Profil mis à jour");
    },
    onError: (error) =>
      toast.error("Mise à jour impossible", {
        description: error instanceof Error ? error.message : undefined,
      }),
  });

  const orgMutation = useMutation({
    mutationFn: () =>
      requestOrganizerAccount({
        data: {
          name: orgForm.name,
          phone: orgForm.phone,
          studentCardBase64: orgForm.studentCard,
          idCardBase64: orgForm.idCard,
        },
      }),
    onSuccess: () => {
      setOrgModalOpen(false);
      toast.success("Demande envoyée !", {
        description: "Votre demande d'organisateur est en attente de validation.",
      });
    },
    onError: (error) =>
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : undefined,
      }),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, key: "studentCard" | "idCard") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setOrgForm((f) => ({ ...f, [key]: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const university = universities.find((u) => u.id === profile?.university_id);

  const { seats, spent, destinations } = useMemo(() => {
    let seats = 0;
    let spent = 0;
    const dest = new Set<string>();
    for (const b of bookings) {
      seats += b.seats;
      spent += b.amount;
      if (b.caravan) dest.add(b.caravan.to);
    }
    return { seats, spent, destinations: dest.size };
  }, [bookings]);

  const prefMethod = (profile?.preferred_payment ?? "wave") as Method;

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-5 animate-spin text-primary-accent" />
      </div>
    );
  }

  const abbr = university?.abbr ?? "CÉ";

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden bg-gradient-primary px-5 pb-20 pt-5 text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <div className="relative mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
              Mon profil
            </p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary-foreground/15 px-3 py-1.5 text-[12px] font-semibold backdrop-blur transition-colors hover:bg-primary-foreground/25"
            >
              <Pencil className="size-3.5" />
              Modifier
            </button>
          </div>

          <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
            <div className="relative shrink-0">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="group relative cursor-pointer overflow-hidden rounded-3xl"
                title="Changer la photo de profil"
              >
                {isUploadingAvatar ? (
                  <div className="grid size-16 place-items-center rounded-3xl bg-primary-foreground/20 backdrop-blur">
                    <Loader2 className="size-6 animate-spin text-primary-foreground" />
                  </div>
                ) : profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Avatar"}
                    className="size-16 rounded-3xl object-cover ring-2 ring-primary-foreground/30 shadow-md transition-opacity group-hover:opacity-85"
                  />
                ) : (
                  <span className="grid size-16 place-items-center rounded-3xl bg-primary-foreground/15 text-xl font-black backdrop-blur transition-colors group-hover:bg-primary-foreground/25">
                    {initials(profile?.full_name ?? "")}
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="size-5 text-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                title="Changer la photo de profil"
                aria-label="Changer la photo de profil"
                className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-primary-accent text-white shadow-lifted transition-transform hover:scale-110 active:scale-95"
              >
                <Camera className="size-3.5" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarUpload(e, false)}
              />
            </div>
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-[19px] font-extrabold leading-tight tracking-tight">
                <span className="truncate">{profile?.full_name || "Étudiant"}</span>
                <BadgeCheck className="size-4 shrink-0 text-secondary-accent" />
              </h1>
              <p className="truncate text-[13px] font-medium leading-relaxed text-primary-foreground/75">
                {university?.name ?? "Université non renseignée"}
              </p>
              <p className="truncate text-[11px] leading-relaxed text-primary-foreground/60">
                {profile?.student_id || "Numéro étudiant à compléter"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-10 max-w-3xl space-y-5 px-5">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-lifted">
          <div className="flex items-center gap-3 border-b border-border/70 p-4">
            <UniversityMark abbr={abbr} showAbbr={false} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Carte étudiant numérique
              </p>
              <p className="truncate text-sm font-bold">
                {profile?.student_id || "—"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-primary-accent">
              <Check className="size-3" /> Vérifié
            </span>
          </div>
          <dl className="divide-y divide-border">
            {[
              { icon: Phone, label: "Téléphone", value: profile?.phone || "—" },
              { icon: Mail, label: "Email", value: profile?.email || "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <Icon className="size-4 shrink-0 text-primary-accent" />
                <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                <dd className="ml-auto min-w-0 truncate text-xs font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: TicketCheck, label: "Billets", value: bookings.length },
            { icon: Wallet, label: "Places réservées", value: seats },
            { icon: RouteIcon, label: "Destinations", value: destinations },
            { icon: Heart, label: "Favoris", value: favorites.length },
          ].map(({ icon: Icon, label, value }) => (
            <article
              key={label}
              className="rounded-3xl border border-border/70 bg-card p-4 shadow-ambient"
            >
              <Icon className="size-4 text-primary-accent" />
              <p className="mt-2 text-2xl font-extrabold leading-none text-primary-accent">
                {value}
              </p>
              <p className="mt-1 text-[11px] font-medium leading-tight text-muted-foreground">
                {label}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-lifted">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-secondary-accent" />
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold">Total dépensé en caravanes</h2>
              <p className="mt-1 text-[26px] font-black leading-none">
                {formatPrice(spent)} <span className="text-sm font-bold">FCFA</span>
              </p>
              <p className="mt-1.5 text-xs text-primary-foreground/75">
                Cumul de vos réservations payées via mobile money.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-ambient">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary-accent" />
            <h2 className="text-sm font-bold tracking-tight">Moyen de paiement préféré</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {methods.map((m) => {
              const active = prefMethod === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => save.mutate({ preferred_payment: m.id })}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                      active
                        ? "border-primary-accent bg-accent shadow-ambient"
                        : "border-border/70 hover:border-primary-accent/50",
                    )}
                  >
                    <PaymentMark method={m.id} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {m.label}
                    </span>
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border-2",
                        active ? "border-primary-accent" : "border-border",
                      )}
                    >
                      {active && <span className="size-2.5 rounded-full bg-primary-accent" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-ambient">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary-accent" />
            <h2 className="text-sm font-bold tracking-tight">Notifications</h2>
          </div>
          <ul className="mt-2 divide-y divide-border">
            {(
              [
                {
                  key: "notify_departures",
                  label: "Rappels de départ",
                  hint: "2h avant le trajet",
                },
                {
                  key: "notify_promos",
                  label: "Bons plans et promos",
                  hint: "Réductions étudiantes",
                },
                {
                  key: "notify_whatsapp",
                  label: "Alertes WhatsApp",
                  hint: "Billet et changements",
                },
              ] as const
            ).map(({ key, label, hint }) => {
              const checked = Boolean(profile?.[key]);
              return (
                <li key={key} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-label={label}
                    onClick={() => save.mutate({ [key]: !checked })}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      checked ? "bg-primary-accent" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-card shadow-ambient transition-all",
                        checked ? "left-[22px]" : "left-0.5",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-ambient">
          <ul className="divide-y divide-border">
            {links.map(({ icon: Icon, label, to }) => (
              <li key={label}>
                <Link
                  to={to}
                  className="flex w-full items-center gap-3 px-5 py-4 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 shrink-0 text-primary-accent" />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
            {dynamicActions.map(({ icon: Icon, label, hint, to }) => (
              <li key={label}>
                {to ? (
                  <Link
                    to={to}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-accent"
                  >
                    <Icon className="size-4 shrink-0 text-primary-accent" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{hint}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (label === "Devenir organisateur") setOrgModalOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-accent"
                  >
                    <Icon className="size-4 shrink-0 text-primary-accent" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {hint}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                )}
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  queryClient.clear();
                  navigate({ to: "/" });
                }}
                className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-danger transition-colors hover:bg-accent"
              >
                <LogOut className="size-4 shrink-0" />
                Déconnexion
              </button>
            </li>
          </ul>
        </section>

        <p className="pb-2 text-center text-[11px] text-muted-foreground">
          Caravane Étudiants — version 2.0.0
        </p>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl border border-border/70 bg-card p-5 shadow-lifted sm:rounded-3xl no-scrollbar">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold tracking-tight">Modifier mon profil</h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Fermer"
                className="grid size-9 place-items-center rounded-xl border border-border/70 transition-colors hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col items-center justify-center gap-2 pb-2">
                <div className="relative shrink-0">
                  {draft.avatar_url ? (
                    <img
                      src={draft.avatar_url}
                      alt="Aperçu avatar"
                      className="size-20 rounded-3xl object-cover border border-border/70 shadow-ambient"
                    />
                  ) : (
                    <span className="grid size-20 place-items-center rounded-3xl bg-accent text-2xl font-black text-primary-accent border border-border/70">
                      {initials(draft.full_name || "")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => modalAvatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-primary-accent text-white shadow-lifted hover:scale-110"
                    title="Changer la photo"
                  >
                    <Camera className="size-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => modalAvatarInputRef.current?.click()}
                    className="text-xs font-semibold text-primary-accent hover:underline"
                  >
                    Changer la photo
                  </button>
                  {draft.avatar_url && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <button
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, avatar_url: null }))}
                        className="flex items-center gap-1 text-xs font-semibold text-danger hover:underline"
                      >
                        <Trash2 className="size-3" /> Supprimer
                      </button>
                    </>
                  )}
                </div>
                <input
                  ref={modalAvatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarUpload(e, true)}
                />
              </div>

              {(
                [
                  { key: "full_name", label: "Nom complet", type: "text" },
                  { key: "student_id", label: "Numéro étudiant", type: "text" },
                  { key: "phone", label: "Téléphone", type: "tel" },
                  { key: "email", label: "Email", type: "email" },
                ] as const
              ).map(({ key, label, type }) => (
                <label key={key} className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {label}
                  </span>
                  <input
                    type={type}
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-3 py-2.5 text-sm font-medium focus:border-primary-accent focus:outline-none"
                  />
                </label>
              ))}

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Université
                </span>
                <ul className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                  {universities.map((u) => {
                    const active = draft.university_id === u.id;
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          title={u.name}
                          onClick={() => setDraft({ ...draft, university_id: u.id })}
                          className={cn(
                            "flex w-[70px] flex-col items-center gap-1 rounded-2xl border p-2 transition-all",
                            active
                              ? "border-primary-accent bg-accent"
                              : "border-border/70 hover:border-primary-accent/50",
                          )}
                        >
                          <UniversityMark abbr={u.abbr} active={active} showAbbr={false} />
                          <span className="w-full truncate text-center text-[10px] font-semibold">
                            {u.abbr}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <button
              type="button"
              disabled={save.isPending}
              onClick={() =>
                save.mutate({
                  full_name: draft.full_name,
                  student_id: draft.student_id || null,
                  phone: draft.phone || null,
                  email: draft.email || null,
                  university_id: draft.university_id,
                  avatar_url: draft.avatar_url,
                })
              }
              className="mt-5 w-full rounded-2xl bg-gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-lifted disabled:opacity-70"
            >
              {save.isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      {orgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl border border-border/70 bg-card p-5 shadow-lifted sm:rounded-3xl no-scrollbar">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold tracking-tight">Devenir Organisateur</h2>
              <button
                type="button"
                onClick={() => setOrgModalOpen(false)}
                aria-label="Fermer"
                className="grid size-9 place-items-center rounded-xl border border-border/70 transition-colors hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <p className="mt-2 text-sm text-muted-foreground">
              Renseignez vos informations pour que l'administration valide votre profil d'organisateur.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Nom et Prénom</span>
                <input
                  type="text"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  placeholder="Ex: Amicale des Étudiants"
                  className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-3 py-2.5 text-sm font-medium focus:border-primary-accent focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Numéro de téléphone</span>
                <input
                  type="tel"
                  value={orgForm.phone}
                  onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                  placeholder="Ex: 77 123 45 67"
                  className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-3 py-2.5 text-sm font-medium focus:border-primary-accent focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1">
                  Carte Étudiant <Upload className="size-3" />
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFile(e, "studentCard")}
                  className="mt-1 block w-full text-sm text-muted-foreground
                    file:mr-4 file:rounded-xl file:border-0
                    file:bg-accent file:px-4 file:py-2
                    file:text-sm file:font-semibold file:text-primary-accent
                    hover:file:bg-accent/80"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1">
                  Carte d'Identité Nationale (CIN) <Upload className="size-3" />
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFile(e, "idCard")}
                  className="mt-1 block w-full text-sm text-muted-foreground
                    file:mr-4 file:rounded-xl file:border-0
                    file:bg-accent file:px-4 file:py-2
                    file:text-sm file:font-semibold file:text-primary-accent
                    hover:file:bg-accent/80"
                />
              </label>
            </div>

            <button
              type="button"
              disabled={
                orgMutation.isPending ||
                !orgForm.name ||
                !orgForm.phone ||
                !orgForm.studentCard ||
                !orgForm.idCard
              }
              onClick={() => orgMutation.mutate()}
              className="mt-5 w-full rounded-2xl bg-brand py-3 text-sm font-bold text-brand-foreground shadow-lifted disabled:opacity-50"
            >
              {orgMutation.isPending ? "Envoi en cours..." : "Soumettre la demande"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
