import { useQuery } from "@tanstack/react-query";
import { getPublicAuctionMaterials } from "../api/auctions";

export function usePublicAuctionMaterials() {
  return useQuery({
    queryKey: ["auctions", "materials"],
    queryFn: getPublicAuctionMaterials,
    staleTime: 1000 * 60 * 5, // Cache trong 5 phút
  });
}
