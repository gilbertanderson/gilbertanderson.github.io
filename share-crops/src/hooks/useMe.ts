import { useQuery } from '@tanstack/react-query';
import { API } from '@/lib/api';

/** Current authenticated user. Cached under the ['me'] key. */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => API.getMe().then((r) => r.user),
    staleTime: 60_000,
  });
}
