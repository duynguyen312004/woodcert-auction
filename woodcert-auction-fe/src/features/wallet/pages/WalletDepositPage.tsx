import { useState } from "react";
import { Link } from "react-router";
import { ChevronRight, CreditCard, Home, Loader2 } from "lucide-react";
import { DepositAmountSelector } from "../components/DepositAmountSelector";
import { useCreateDeposit } from "../hooks/useCreateDeposit";

export function WalletDepositPage() {
  const [amount, setAmount] = useState<number>(500000);
  const [error, setError] = useState<string>("");

  const createDepositMutation = useCreateDeposit();

  const handleAmountChange = (val: number) => {
    setAmount(val);
    if (val < 10000) {
      setError("Số tiền nạp tối thiểu là 10,000 VND");
    } else if (val > 1000000000) {
      setError("Số tiền nạp tối đa là 1,000,000,000 VND");
    } else {
      setError("");
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 10000) {
      setError("Số tiền nạp tối thiểu là 10,000 VND");
      return;
    }
    if (amount > 1000000000) {
      setError("Số tiền nạp tối đa là 1,000,000,000 VND");
      return;
    }

    createDepositMutation.mutate(amount);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-[640px] px-6 space-y-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Link to="/" className="flex items-center gap-1 transition-colors hover:text-primary">
            <Home className="h-3 w-3" />
            <span>Trang chủ</span>
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/wallet" className="transition-colors hover:text-primary">
            Ví của tôi
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">Nạp tiền</span>
        </nav>

        {/* Form Container */}
        <form
          onSubmit={handleDepositSubmit}
          className="rounded-2xl border border-white/10 bg-card p-6 shadow-xl space-y-6"
        >
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Nạp Tiền Vào Ví</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Vui lòng chọn hoặc nhập số tiền bạn muốn nạp vào ví WoodCert.
            </p>
          </div>

          {/* Amount Selector */}
          <DepositAmountSelector onAmountChange={handleAmountChange} error={error} />

          {/* Action Button */}
          <button
            type="submit"
            disabled={!!error || amount < 10000 || createDepositMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {createDepositMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang kết nối cổng VNPay...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                <span>Thanh toán qua VNPay</span>
              </>
            )}
          </button>

          <p className="text-center text-3xs text-muted-foreground">
            Bằng việc nhấn Thanh toán, bạn đồng ý với các chính sách và điều khoản nạp tiền của
            WoodCert.
          </p>
        </form>
      </div>
    </div>
  );
}
