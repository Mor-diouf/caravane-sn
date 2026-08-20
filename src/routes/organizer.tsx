import { createFileRoute, Outlet } from "@tanstack/react-router";
import { OrgShell } from "@/components/organizer/OrgShell";

export const Route = createFileRoute("/organizer")({
  component: () => (
    <OrgShell>
      <Outlet />
    </OrgShell>
  ),
});
