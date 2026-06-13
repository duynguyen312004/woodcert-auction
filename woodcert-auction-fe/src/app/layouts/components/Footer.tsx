/**
 * Footer của phần trang công khai.
 *
 * PublicLayout dùng file này ở cuối các trang chính. Footer gom các link khám
 * phá, link đăng ký seller và điều hướng đấu giá để các trang không phải viết lại.
 */
import { Link } from "react-router";

import logoUrl from "@/assets/brand/logo.jpg";
import { SELLER_PATHS } from "@/shared/constants";

const EXPLORE_LINKS = [
  { label: "Đấu giá đang mở", to: "/auctions" },
  { label: "Sắp diễn ra", to: "/auctions" },
  { label: "Bộ sưu tập nổi bật", to: "/auctions" },
  { label: "Tác phẩm đã bán", to: "/auctions" },
];

const SERVICE_LINKS = [
  { label: "Đăng ký người bán", to: SELLER_PATHS.register },
  { label: "Quản lý tài khoản", to: "/account" },
  { label: "Tham gia đấu giá", to: "/auctions" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-card/20 py-16">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Cột 1: thương hiệu */}
          <div className="md:col-span-1">
            <Link to="/" className="group mb-6 inline-flex items-center gap-3">
              <div className="relative h-7 w-7 overflow-hidden rounded ring-1 ring-primary/30 transition-all group-hover:ring-primary/60">
                <img src={logoUrl} alt="WoodCert Logo" className="h-full w-full object-cover" />
              </div>
              <span className="font-serif text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                WoodCert
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Sàn đấu giá trực tuyến chuyên biệt cho gỗ mỹ nghệ được kiểm định bởi chuyên gia.
            </p>
          </div>

          {/* Cột 2: khám phá */}
          <div>
            <h5 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">
              Khám phá
            </h5>
            <ul className="space-y-4">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: dịch vụ */}
          <div>
            <h5 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">
              Dịch vụ
            </h5>
            <ul className="space-y-4">
              {SERVICE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 4: điều hướng */}
          <div>
            <h5 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">
              Đấu giá mới
            </h5>
            <p className="mb-4 text-sm text-muted-foreground">
              Theo dõi các phiên đang mở và chuẩn bị diễn ra trên WoodCert.
            </p>
            <Link
              to="/auctions"
              className="inline-flex rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Xem danh sách đấu giá
            </Link>
          </div>
        </div>

        {/* Thanh cuối footer */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2026 WoodCert Auction. Bản quyền thuộc về WoodCert Vietnam.
          </p>
        </div>
      </div>
    </footer>
  );
}
