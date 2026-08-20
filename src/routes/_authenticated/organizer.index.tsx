import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/organizer/")({
  beforeLoad: () => {
    throw redirect({ to: "/organizer/dashboard" });
  },
});
