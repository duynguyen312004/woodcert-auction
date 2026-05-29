import { useState } from "react";
import { formatCurrencyVND } from "@/shared/lib/format";

interface DepositAmountSelectorProps {
  onAmountChange: (amount: number) => void;
  error?: string;
}

const PRESET_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

export function DepositAmountSelector({ onAmountChange, error }: DepositAmountSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(500000);
  const [customValue, setCustomValue] = useState<string>("");

  const handlePresetSelect = (amount: number) => {
    setSelectedPreset(amount);
    setCustomValue("");
    onAmountChange(amount);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Chỉ lấy số
    setCustomValue(value);
    setSelectedPreset(null);

    const numericValue = Number(value);
    onAmountChange(numericValue);
  };

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
          Chọn nhanh số tiền nạp
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handlePresetSelect(amount)}
              className={`rounded-xl border py-3 px-4 text-center font-bold transition-all text-xs ${
                selectedPreset === amount
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-white/10 bg-white/3 hover:bg-white/5 hover:border-white/20 text-foreground"
              }`}
            >
              {formatCurrencyVND(amount)}
            </button>
          ))}
        </div>
      </div>

      {/* Or Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="flex-shrink mx-4 text-2xs text-muted-foreground uppercase tracking-widest">
          Hoặc nhập số tiền tùy ý
        </span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>

      {/* Custom Input */}
      <div>
        <div className="relative rounded-xl border border-white/10 bg-white/3 px-4 py-3 focus-within:border-primary/50 focus-within:bg-card transition-all">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm text-muted-foreground">
            ₫
          </span>
          <input
            type="text"
            pattern="[0-9]*"
            inputMode="numeric"
            value={customValue}
            onChange={handleCustomChange}
            placeholder={
              selectedPreset
                ? formatCurrencyVND(selectedPreset).replace("₫", "").trim()
                : "Nhập số tiền nạp..."
            }
            className="w-full bg-transparent pl-5 pr-4 text-base font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
          />
        </div>

        {/* Live format display */}
        {!selectedPreset && customValue && (
          <p className="mt-2 text-xs font-semibold text-primary">
            Số tiền nạp: {formatCurrencyVND(Number(customValue))}
          </p>
        )}

        {error && <p className="mt-2 text-xs font-medium text-rose-400">{error}</p>}
        <p className="mt-2 text-3xs text-muted-foreground">
          * Số tiền nạp tối thiểu là 10,000 VND và tối đa là 1,000,000,000 VND mỗi giao dịch.
        </p>
      </div>
    </div>
  );
}
