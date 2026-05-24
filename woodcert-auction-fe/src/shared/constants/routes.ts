/**
 * Route constants dung chung giua app shell va cac feature.
 */
export const SELLER_PATHS = {
  dashboard: "/seller/dashboard",
  profile: "/seller/profile",
  products: "/seller/products",
  newProduct: "/seller/products/new",
  editProduct: (id: string | number) => `/seller/products/${id}/edit`,
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
  editProduct: "seller/products/:productId/edit",
  auctions: "seller/auctions",
  newAuction: "seller/auctions/new",
  appraisals: "seller/appraisals",
  register: "seller/register",
} as const;
