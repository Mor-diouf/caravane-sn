import { queryOptions } from "@tanstack/react-query";
import {
  getCaravan,
  getMyFavorites,
  getMyProfile,
  getMyTickets,
  listCaravans,
  listUniversities,
  getCaravanReviews,
  listOrganizers,
  getOrganizer,
} from "@/lib/student.functions";

export const universitiesQuery = queryOptions({
  queryKey: ["universities"],
  queryFn: () => listUniversities(),
  staleTime: 5 * 60 * 1000,
});

export const organizersQuery = queryOptions({
  queryKey: ["organizers"],
  queryFn: () => listOrganizers(),
  staleTime: 5 * 60 * 1000,
});

export const organizerQuery = (id: string) => queryOptions({
  queryKey: ["organizer", id],
  queryFn: () => getOrganizer({ data: { id } }),
});

export const caravansQuery = queryOptions({
  queryKey: ["caravans"],
  queryFn: () => listCaravans(),
});

export const caravanQuery = (id: string) =>
  queryOptions({
    queryKey: ["caravan", id],
    queryFn: () => getCaravan({ data: { id } }),
  });

export const caravanReviewsQuery = (caravanId: string) =>
  queryOptions({
    queryKey: ["caravan-reviews", caravanId],
    queryFn: () => getCaravanReviews({ data: { caravanId } }),
  });

export const favoritesQuery = queryOptions({
  queryKey: ["favorites"],
  queryFn: () => getMyFavorites(),
});

export const ticketsQuery = queryOptions({
  queryKey: ["tickets"],
  queryFn: () => getMyTickets(),
});

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: () => getMyProfile(),
});
