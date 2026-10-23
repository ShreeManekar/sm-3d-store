// src/hooks/useAdmin.ts
import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export const useAdminUsers = () => {
  const { data, error, mutate } = useSWR('/api/users', fetcher);
  const admins = data ? data.filter((u: any) => u.role === 'admin') : [];
  return {
    admins,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
};
