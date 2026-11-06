"use client";

import type { ReactNode } from "react";

type PersonalInfoStepProps = {
  form: {
    fullName: string;
    gender: "male" | "female" | "";
    termsAccepted: boolean;
  };
  onChange: (patch: Partial<PersonalInfoStepProps["form"]>) => void;
  onContinue: () => void;
  canContinue: boolean;
};

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="microsite-label block text-base leading-6">{children}</label>
  );
}

function TextField({
  value,
  placeholder,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: "text";
  inputMode?: "text";
  autoComplete?: string;
}) {
  return (
    <input
      className="microsite-input w-full bg-transparent outline-none placeholder:text-white/40"
      type={type}
      inputMode={inputMode}
      autoComplete={autoComplete}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function PersonalInfoStep({
  form,
  onChange,
  onContinue,
  canContinue,
}: PersonalInfoStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <FieldLabel>Full Name</FieldLabel>
        <div className="microsite-field">
          <TextField
            value={form.fullName}
            placeholder="Enter your full name"
            autoComplete="name"
            onChange={(fullName) => onChange({ fullName })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel>Gender</FieldLabel>
        <div className="grid grid-cols-2 gap-4">
          {(
            [
              ["male", "Male"],
              ["female", "Female"],
            ] as const
          ).map(([value, label]) => {
            const selected = form.gender === value;
            return (
              <button
                key={value}
                type="button"
                className="microsite-field flex items-center gap-2 text-left text-sm"
                onClick={() => onChange({ gender: value })}
              >
                <span
                  className={`flex size-4 items-center justify-center rounded-full border border-white ${selected ? "bg-white" : ""}`}
                  aria-hidden
                >
                  {selected ? (
                    <span className="size-2 rounded-full bg-[#0a1038]" />
                  ) : null}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm leading-[21px] text-white/80">
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-white"
          checked={form.termsAccepted}
          onChange={(event) =>
            onChange({ termsAccepted: event.target.checked })
          }
        />
        <span>
          Saya setuju foto saya diolah menggunakan AI dan ditampilkan bersama nama saya di billboard
        </span>
      </label>

      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className={`microsite-button mt-4 uppercase ${canContinue ? "microsite-button-active" : "microsite-button-disabled"}`}
      >
        continue
      </button>
    </div>
  );
}
