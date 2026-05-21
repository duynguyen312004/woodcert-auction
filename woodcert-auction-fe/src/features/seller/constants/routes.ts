/**
 * Hằng số route của khu seller.
 *
 * SELLER_PATHS dùng cho link điều hướng tuyệt đối. SELLER_ROUTE_PATHS dùng trong
 * khai báo route của React Router.
 */
export const SELLER_PATHS = {
  dashboard: "/seller/dashboard",
  profile: "/seller/profile",
  products: "/seller/products",
  newProduct: "/seller/products/new",
  auctions: "/seller/auctions",
  newAuction: "/seller/auctions/new",
  appraisals: "/seller/appraisals",
  register: "/seller/register",
} as const;

export const SELLER_ROUTE_PATHS = {
  dashboard: "seller/dashboard",
  profile: "seller/profile",
  products: "seller/products",
  newProduct: "seller/products/new",
  auctions: "seller/auctions",
  newAuction: "seller/auctions/new",
  appraisals: "seller/appraisals",
  register: "seller/register",
} as const;
