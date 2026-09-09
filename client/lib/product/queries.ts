import { useQuery } from "@tanstack/react-query";
import { getPopularProducts } from "./api";
import { Product } from "../../types/shop";

export const useGetPopularProducts = (): {
  data: Product[] | undefined;
  isLoading: boolean;
} => {
  return useQuery({
    queryKey: ["popularProducts"],
    queryFn: () => getPopularProducts(),
  });
};
