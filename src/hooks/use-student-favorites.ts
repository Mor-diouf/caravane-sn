import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { favoritesQuery } from "@/lib/student-queries";
import { toggleFavorite } from "@/lib/student.functions";
import { useAuth } from "@/hooks/use-auth";

/** Database-backed favorites for the signed-in student. */
export function useStudentFavorites() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [] } = useQuery({
    ...favoritesQuery,
    enabled: Boolean(user),
  });

  const mutation = useMutation({
    mutationFn: (input: { caravanId: string; favorite: boolean }) =>
      toggleFavorite({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
    onError: () => toast.error("Impossible de mettre à jour vos favoris"),
  });

  const toggle = (caravanId: string) => {
    if (!user) {
      toast.info("Connectez-vous pour enregistrer vos favoris");
      return;
    }
    mutation.mutate({ caravanId, favorite: !favorites.includes(caravanId) });
  };

  return { favorites, toggle, authLoading: loading, signedIn: Boolean(user) };
}
