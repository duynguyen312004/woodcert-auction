import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import {
  Search,
  Copy,
  Check,
  Award,
  ShieldCheck,
  FileText,
  Fingerprint,
  FileCheck,
} from "lucide-react";

import { formatDateTime, formatVND } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { certificateApi } from "../api/certificateApi";

export function CertificatePage() {
  const { certificateCode } = useParams();
  const [value, setValue] = useState(certificateCode ?? "");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSign, setCopiedSign] = useState(false);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["certificate", certificateCode],
    queryFn: () => certificateApi.verify(certificateCode as string),
    enabled: !!certificateCode,
  });

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopySign = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSign(true);
    setTimeout(() => setCopiedSign(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#12100d] px-4 py-12 text-[#f2eee5] sm:px-6 lg:px-12 selection:bg-primary/30 selection:text-white">
      <div className="mx-auto max-w-[1120px] space-y-8">
        <header className="border-b border-white/10 pb-8 grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
          <div className="space-y-4 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
              WoodCert Registry
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Cổng Tra Cứu Chứng Thư Thẩm Định
            </h1>
            <p className="text-sm text-[#8D877C] leading-relaxed max-w-xl">
              Nhập mã chứng thư được cấp kèm theo tác phẩm để xác minh tính chính danh, kết quả thẩm
              định chất lượng gỗ và chữ ký số bảo mật vĩnh viễn từ WoodCert.
            </p>
            <form
              className="mt-6 flex max-w-lg gap-2 mx-auto sm:mx-0"
              onSubmit={(event) => {
                event.preventDefault();
                if (value.trim()) navigate(`/certificates/${encodeURIComponent(value.trim())}`);
              }}
            >
              <Input
                className="border-white/10 bg-[#1c1a16] text-[#f2eee5] placeholder:text-[#6a6356] focus:bg-[#26231e] focus:ring-1 focus:ring-primary/50 h-11"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Nhập mã chứng thư (ví dụ: CERT-2026-00042)"
              />
              <Button type="submit" className="h-11 px-6 font-semibold shrink-0">
                <Search className="h-4 w-4 mr-2" />
                Tra cứu
              </Button>
            </form>
          </div>

          {/* Phần giới thiệu bổ sung bên phải header */}
          <div className="rounded-xl border border-white/5 bg-[#181612]/60 p-5 space-y-4 shadow-lg backdrop-blur-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary border-b border-white/5 pb-2 text-left">
              Hệ Thống Bảo Chứng WoodCert
            </h4>
            <div className="space-y-3">
              <HeaderFeatureItem
                icon={<Fingerprint className="h-4 w-4 text-primary" />}
                title="Chữ ký số mật mã"
                desc="Chữ ký số mã hóa bảo chứng vĩnh viễn, chống giả mạo hồ sơ sản phẩm."
              />
              <HeaderFeatureItem
                icon={<FileCheck className="h-4 w-4 text-primary" />}
                title="Thẩm định độc lập"
                desc="Giám định viên chuyên trách xác minh chất liệu, nguồn gốc và tuổi đời gỗ."
              />
              <HeaderFeatureItem
                icon={<ShieldCheck className="h-4 w-4 text-primary" />}
                title="Bảo hộ giá trị"
                desc="Cung cấp cơ sở pháp lý và định giá tin cậy phục vụ giao dịch đấu giá."
              />
            </div>
          </div>
        </header>

        {query.isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[#8D877C] text-sm font-medium">Đang tải và xác thực chứng nhận...</p>
          </div>
        )}

        {query.data &&
          (() => {
            const data = query.data;
            const imageUrls = data.imageUrls ?? [];

            // Dịch cấp độ tình trạng sang tiếng Việt sang trọng
            const gradeMap: Record<string, string> = {
              EXCELLENT: "Hoàn hảo (Excellent)",
              VERY_GOOD: "Rất tốt (Very Good)",
              GOOD: "Tốt (Good)",
              FAIR: "Khá (Fair)",
              POOR: "Kém (Poor)",
            };
            const displayGrade = gradeMap[data.conditionGrade ?? ""] ?? data.conditionGrade ?? "—";

            // Format độ tuổi ước tính
            const displayAge = data.ageEstimation
              ? isNaN(Number(data.ageEstimation))
                ? data.ageEstimation
                : `${data.ageEstimation} năm`
              : "—";

            return (
              <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] items-start">
                {/* Cột trái: Thư viện hình ảnh sản phẩm */}
                <div className="space-y-4 lg:sticky lg:top-6">
                  <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#161411] aspect-square flex items-center justify-center shadow-2xl">
                    <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider text-primary px-3 py-1.5 rounded-full border border-white/10">
                      Ảnh thực tế tác phẩm
                    </div>
                    <img
                      src={imageUrls[activeImageIndex] ?? "/assets/hero/woodcert-card-fallback.jpg"}
                      alt={data.productTitle ?? "Sản phẩm đã chứng nhận"}
                      className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                    />
                  </div>

                  {imageUrls.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {imageUrls.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`aspect-square overflow-hidden rounded-lg border transition-all ${
                            activeImageIndex === idx
                              ? "border-primary ring-2 ring-primary/30 scale-[0.98]"
                              : "border-white/10 opacity-70 hover:opacity-100 hover:border-primary/50"
                          }`}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {data.description && (
                    <div className="rounded-xl border border-white/10 bg-[#161411] p-6 shadow-lg">
                      <div className="flex items-center gap-2 mb-3 text-primary border-b border-white/5 pb-3">
                        <FileText className="h-4 w-4" />
                        <h3 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                          Mô tả tác phẩm
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-[#cbbfa8] font-serif font-light whitespace-pre-line">
                        {data.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Cột phải: Bản chứng thư giấy sang trọng */}
                <div className="space-y-6">
                  <section className="relative rounded-2xl border-4 border-double border-[#cfa853]/35 bg-[#ebdcb9] p-8 text-stone-900 shadow-[0_15px_45px_rgba(0,0,0,0.4)] overflow-hidden">
                    {/* Decorative background lines or seal effect */}
                    <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full border-8 border-stone-800/5 flex items-center justify-center select-none pointer-events-none transform rotate-12">
                      <span className="text-[9px] font-bold text-stone-800/10 tracking-[0.3em] uppercase">
                        WOODCERTIFIED
                      </span>
                    </div>

                    {/* Header của tờ chứng thư */}
                    <div className="text-center pb-6 border-b border-stone-800/20">
                      <div className="inline-flex items-center justify-center p-2.5 bg-[#2f7d68]/10 rounded-full mb-3 text-[#22604f]">
                        <ShieldCheck className="h-10 w-10" />
                      </div>
                      <h2 className="font-serif text-[10px] font-bold uppercase tracking-[0.3em] text-[#785b24] mb-1">
                        WoodCert Authentication Registry
                      </h2>
                      <h3 className="font-serif text-2xl font-bold tracking-tight text-stone-900 leading-tight">
                        CHỨNG THƯ GIÁM ĐỊNH GỖ MỸ NGHỆ
                      </h3>
                      <div className="mt-3 flex items-center justify-center gap-2 text-stone-600 font-mono text-xs">
                        <span>Mã Chứng Thư:</span>
                        <span className="font-bold text-stone-900">{data.certificateCode}</span>
                        <button
                          onClick={() => handleCopyCode(data.certificateCode)}
                          type="button"
                          className="p-1 hover:bg-stone-800/10 rounded text-stone-500 hover:text-stone-800 transition-colors"
                          title="Sao chép mã chứng thư"
                        >
                          {copiedCode ? (
                            <Check className="h-3 w-3 text-emerald-700 font-bold" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Phần thân chứng thư */}
                    <div className="mt-6 space-y-6">
                      {/* Phần tiêu đề tác phẩm thẩm định */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#785b24]/80">
                          Tác phẩm được bảo chứng
                        </span>
                        <h4 className="text-2xl font-bold font-serif text-stone-900 mt-1 leading-snug">
                          {data.productTitle ?? "Sản phẩm đã chứng nhận"}
                        </h4>
                      </div>

                      {/* Khối 1: Thuộc tính kỹ thuật */}
                      <div className="border-t border-dashed border-stone-800/25 pt-4">
                        <h5 className="text-[11px] font-bold uppercase tracking-widest text-[#785b24] mb-3">
                          Thông số kỹ thuật tác phẩm
                        </h5>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <CertificateInfoItem
                            label="Vật liệu đăng ký"
                            value={data.material ?? "—"}
                          />
                          <CertificateInfoItem
                            label="Kích thước (Dài x Rộng x Cao)"
                            value={data.dimensions ? `${data.dimensions} cm` : "—"}
                          />
                          <CertificateInfoItem
                            label="Khối lượng"
                            value={data.weight ? `${Number(data.weight).toFixed(2)} kg` : "—"}
                          />
                          <CertificateInfoItem
                            label="Danh mục sản phẩm"
                            value={data.category?.name ?? "—"}
                          />
                        </div>
                      </div>

                      {/* Khối 2: Kết quả giám định thực tế */}
                      <div className="border-t border-dashed border-stone-800/25 pt-4">
                        <h5 className="text-[11px] font-bold uppercase tracking-widest text-[#785b24] mb-3">
                          Kết quả giám định gỗ mỹ nghệ
                        </h5>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <CertificateInfoItem
                            label="Xác minh chính hãng"
                            value={data.authentic ? "Đã xác thực chính hãng" : "Không chính hãng"}
                            highlight={data.authentic}
                          />
                          <CertificateInfoItem
                            label="Vật liệu thực tế"
                            value={data.verifiedMaterial}
                            highlight
                          />
                          <CertificateInfoItem label="Cấp độ tình trạng" value={displayGrade} />
                          <CertificateInfoItem label="Độ tuổi ước tính" value={displayAge} />
                          <CertificateInfoItem label="Nguồn gốc gỗ" value={data.origin ?? "—"} />
                          <CertificateInfoItem
                            label="Giá trị ước tính"
                            value={formatVND(Number(data.estimatedValue))}
                            highlight
                          />
                        </div>
                      </div>

                      {/* Khối 3: Thông tin đơn vị liên quan & thời gian */}
                      <div className="border-t border-dashed border-stone-800/25 pt-4">
                        <h5 className="text-[11px] font-bold uppercase tracking-widest text-[#785b24] mb-3">
                          Trách nhiệm & Pháp lý
                        </h5>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <CertificateInfoItem
                            label="Chủ sở hữu / Xưởng gỗ"
                            value={data.sellerName ?? "—"}
                          />
                          <CertificateInfoItem
                            label="Giám định viên chuyên trách"
                            value={data.appraiserName ?? "—"}
                          />
                          <CertificateInfoItem
                            label="Ngày cấp chứng thư"
                            value={formatDateTime(data.appraisedAt)}
                          />
                        </div>
                      </div>

                      {/* Chân chứng thư: Bảo mật chữ ký số */}
                      <div className="border-t border-stone-800/20 pt-5 mt-4 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#dfcfab] p-4 rounded-xl border border-stone-800/10">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#785b24] flex items-center justify-center sm:justify-start gap-1">
                              <Award className="h-3 w-3 text-[#785b24]" />
                              Chữ ký số mật mã học
                            </span>
                            <p className="font-mono text-xs text-stone-800 break-all select-all leading-normal max-w-[420px]">
                              {data.digitalSignature}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopySign(data.digitalSignature)}
                            className="self-center sm:self-auto border-stone-800/20 hover:bg-stone-800/10 text-stone-800 hover:text-stone-900 h-9 font-semibold"
                          >
                            {copiedSign ? (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1 text-emerald-700 animate-pulse font-bold" />
                                Đã chép
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                Sao chép
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="mt-3 text-[10px] text-stone-600 italic">
                          * Chứng thư số này được mã hóa bảo mật chuỗi khối và có hiệu lực vĩnh viễn
                          đối với tác phẩm gỗ mỹ nghệ tương ứng.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            );
          })()}

        {certificateCode && query.isError && (
          <section className="rounded-xl border border-red-500/20 bg-red-950/20 p-6 text-red-200 text-center max-w-lg mx-auto">
            <h3 className="font-bold text-lg mb-1 text-white">Không tìm thấy dữ liệu</h3>
            <p className="text-sm text-red-300/80">
              Mã chứng nhận{" "}
              <span className="font-mono font-bold text-white bg-red-900/40 px-1.5 py-0.5 rounded">
                {certificateCode}
              </span>{" "}
              không tồn tại trong cơ sở dữ liệu WoodCert. Vui lòng kiểm tra lại.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

interface CertificateInfoItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function CertificateInfoItem({ label, value, highlight = false }: CertificateInfoItemProps) {
  return (
    <div className="space-y-1.5 min-w-0">
      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#785b24]/75 leading-none">
        {label}
      </span>
      <span
        className={`block text-[14px] font-sans break-words leading-tight ${
          highlight ? "font-bold text-[#1d5c4b]" : "font-semibold text-stone-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function HeaderFeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 text-left">
      <div className="mt-0.5 p-1.5 bg-[#1f1b15] rounded-md border border-white/5 shrink-0">
        {icon}
      </div>
      <div className="space-y-0.5">
        <h5 className="text-xs font-bold text-white tracking-wide">{title}</h5>
        <p className="text-[11px] text-[#8D877C] leading-normal font-light">{desc}</p>
      </div>
    </div>
  );
}
