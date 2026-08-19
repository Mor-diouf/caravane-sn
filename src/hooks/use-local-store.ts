import { useCallback, useEffect, useState } from "react";

const EVENT = "caravane-store-change";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Hydration-safe localStorage state shared across components. */
export function useLocalStore<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    setValue(read(key, fallback));
    const sync = () => setValue(read(key, fallback));
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
          window.dispatchEvent(new Event(EVENT));
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}

export type Booking = {
  id: string;
  caravaneId: string;
  reference: string;
  seats: number;
  method: string;
  createdAt: string;
};

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStore<string[]>("caravane:favorites", []);
  const toggle = useCallback(
    (id: string) =>
      setFavorites((prev) =>
        prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
      ),
    [setFavorites],
  );
  return { favorites, toggle };
}

export function useBookings() {
  const [bookings, setBookings] = useLocalStore<Booking[]>("caravane:bookings", []);
  const add = useCallback(
    (booking: Booking) => setBookings((prev) => [booking, ...prev]),
    [setBookings],
  );
  return { bookings, add };
}
