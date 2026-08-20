import { queryOptions } from "@tanstack/react-query";
import { getMyAccess } from "@/lib/access.functions";
import {
  adminAnalytics,
  adminFinance,
  adminGetSettings,
  adminListCaravans,
  adminListDisputes,
  adminListOrganizers,
  adminListReviews,
  adminListUsers,
  adminOverview,
} from "@/lib/admin.functions";
import {
  organizerHistory,
  organizerListBookings,
  organizerListCaravans,
  organizerOverview,
  organizerPayments,
  organizerReputation,
  organizerSettings,
  organizerTeam,
} from "@/lib/organizer.functions";

export const accessQuery = () =>
  queryOptions({ queryKey: ["access"], queryFn: () => getMyAccess() });

export const adminOverviewQuery = () =>
  queryOptions({ queryKey: ["admin", "overview"], queryFn: () => adminOverview() });
export const adminOrganizersQuery = () =>
  queryOptions({ queryKey: ["admin", "organizers"], queryFn: () => adminListOrganizers() });
export const adminUsersQuery = () =>
  queryOptions({ queryKey: ["admin", "users"], queryFn: () => adminListUsers() });
export const adminCaravansQuery = () =>
  queryOptions({ queryKey: ["admin", "caravans"], queryFn: () => adminListCaravans() });
export const adminFinanceQuery = () =>
  queryOptions({ queryKey: ["admin", "finance"], queryFn: () => adminFinance() });
export const adminReviewsQuery = () =>
  queryOptions({ queryKey: ["admin", "reviews"], queryFn: () => adminListReviews() });
export const adminDisputesQuery = () =>
  queryOptions({ queryKey: ["admin", "disputes"], queryFn: () => adminListDisputes() });
export const adminSettingsQuery = () =>
  queryOptions({ queryKey: ["admin", "settings"], queryFn: () => adminGetSettings() });
export const adminAnalyticsQuery = () =>
  queryOptions({ queryKey: ["admin", "analytics"], queryFn: () => adminAnalytics() });

export const orgOverviewQuery = () =>
  queryOptions({ queryKey: ["organizer", "overview"], queryFn: () => organizerOverview() });
export const orgCaravansQuery = () =>
  queryOptions({ queryKey: ["organizer", "caravans"], queryFn: () => organizerListCaravans() });
export const orgBookingsQuery = () =>
  queryOptions({ queryKey: ["organizer", "bookings"], queryFn: () => organizerListBookings() });
export const orgPaymentsQuery = () =>
  queryOptions({ queryKey: ["organizer", "payments"], queryFn: () => organizerPayments() });
export const orgReputationQuery = () =>
  queryOptions({ queryKey: ["organizer", "reputation"], queryFn: () => organizerReputation() });
export const orgHistoryQuery = () =>
  queryOptions({ queryKey: ["organizer", "history"], queryFn: () => organizerHistory() });
export const orgTeamQuery = () =>
  queryOptions({ queryKey: ["organizer", "team"], queryFn: () => organizerTeam() });
export const orgSettingsQuery = () =>
  queryOptions({ queryKey: ["organizer", "settings"], queryFn: () => organizerSettings() });
