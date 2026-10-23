// src/hooks/useProducts.ts
import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export const useProducts = () => {
  const { data, error, mutate } = useSWR('/api/products', fetcher);
  return {
    products: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
};
