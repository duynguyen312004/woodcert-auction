/**
 * Route constants dung chung giua app shell va cac feature.
 */
export const ADMIN_PATHS = {
  dashboard: "/admin",
  revenue: "/admin/revenue",
} as const;

export const BUYER_PATHS = {
  auctions: "/my-auctions",
  auctionDetail: (id: string | number) => `/my-auctions/${id}`,
  orders: "/orders",
} as const;

export const SELLER_PATHS = {
  dashboard: "/seller/dashboard",
  profile: "/seller/profile",
  products: "/seller/products",
  newProduct: "/seller/products/new",
  editProduct: (id: string | number) => `/seller/products/${id}/edit`,
  auctions: "/seller/auctions",
  auctionDetail: (id: string | number) => `/seller/auctions/${id}`,
  newAuction: "/seller/auctions/new",
  orders: "/seller/orders",
  register: "/seller/register",
} as const;

export const APPRAISER_PATHS = {
  products: "/appraiser/products",
  productDetail: (id: string | number) => `/appraiser/products/${id}`,
  reviewed: "/appraiser/reviewed",
} as const;

export const SELLER_ROUTE_PATHS = {
  dashboard: "seller/dashboard",
  profile: "seller/profile",
  products: "seller/products",
  newProduct: "seller/products/new",
  editProduct: "seller/products/:productId/edit",
  auctions: "seller/auctions",
  auctionDetail: "seller/auctions/:auctionId",
  newAuction: "seller/auctions/new",
  orders: "seller/orders",
  register: "seller/register",
} as const;

export const APPRAISER_ROUTE_PATHS = {
  products: "appraiser/products",
  productDetail: "appraiser/products/:productId",
  reviewed: "appraiser/reviewed",
} as const;
