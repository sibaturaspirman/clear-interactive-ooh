"use client";

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";

type PersonalInfoStepProps = {
  form: {
    fullName: string;
    gender: "male" | "female" | "";
    termsAccepted: boolean;
  };
  onChange: (patch: Partial<PersonalInfoStepProps["form"]>) => void;
  onContinue: () => void;
};

function normalizeName(raw: string) {
  return raw.replace(/\u200B/g, "").trim();
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="microsite-label block text-base leading-6">{children}</div>
  );
}

function TextField({
  value,
  placeholder,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  name,
  inputRef,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: "text";
  inputMode?: "text";
  autoComplete?: string;
  name: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  function syncFromInput(element: HTMLInputElement) {
    onChange(element.value);
  }

  return (
    <input
      ref={inputRef}
      name={name}
      className="microsite-input w-full bg-transparent outline-none placeholder:text-white/40"
      type={type}
      inputMode={inputMode}
      autoComplete={autoComplete}
      value={value}
      placeholder={placeholder}
      onChange={(event) => syncFromInput(event.currentTarget)}
      /** Safari/iOS: autofill / IME can skip `change` — sync on every input + composition end + blur. */
      onInput={(event) => syncFromInput(event.currentTarget)}
      onBlur={(event) => syncFromInput(event.currentTarget)}
      onCompositionEnd={(event) => syncFromInput(event.currentTarget)}
    />
  );
}

function readFormFromDom(form: HTMLFormElement) {
  const byName = form.elements.namedItem("fullName") as
    | HTMLInputElement
    | RadioNodeList
    | null;
  const fullNameFromNamed =
    byName && "value" in byName ? byName.value : "";
  const fullNameFromQuery =
    (form.querySelector('input[name="fullName"]') as HTMLInputElement | null)
      ?.value ?? "";
  const fullName = fullNameFromNamed || fullNameFromQuery;

  const genderEl = form.querySelector(
    'input[name="microsite-gender"]:checked',
  ) as HTMLInputElement | null;
  const gender =
    genderEl?.value === "male" || genderEl?.value === "female"
      ? genderEl.value
      : "";
  const termsEl = form.querySelector(
    'input[name="termsAccepted"]',
  ) as HTMLInputElement | null;
  const termsAccepted = termsEl?.checked ?? false;
  return {
    fullName,
    gender: gender as "male" | "female" | "",
    termsAccepted,
  };
}

/**
 * iOS Safari can leave `form.elements` / submit snapshot empty while the visible
 * input still holds text and React state is in sync — merge DOM read with props.
 */
function mergePersonalInfo(
  dom: ReturnType<typeof readFormFromDom>,
  react: PersonalInfoStepProps["form"],
  fullNameFromRef: string,
) {
  const nameFromDom = normalizeName(dom.fullName).length > 0 ? dom.fullName : "";
  const nameFromRef = normalizeName(fullNameFromRef).length > 0 ? fullNameFromRef : "";
  const nameFromReact = normalizeName(react.fullName).length > 0 ? react.fullName : "";
  const fullName = nameFromDom || nameFromRef || nameFromReact;

  const genderFromDom =
    dom.gender === "male" || dom.gender === "female" ? dom.gender : "";
  const gender = genderFromDom || react.gender;

  const termsAccepted = dom.termsAccepted || react.termsAccepted;

  return {
    fullName,
    gender: gender as "male" | "female" | "",
    termsAccepted,
  };
}

export function PersonalInfoStep({
  form,
  onChange,
  onContinue,
}: PersonalInfoStepProps) {
  const [submitError, setSubmitError] = useState(false);
  const fullNameInputRef = useRef<HTMLInputElement>(null);

  function setGender(value: "male" | "female") {
    onChange({ gender: value });
  }

  const ready = useMemo(() => {
    const nameOk = normalizeName(form.fullName).length > 0;
    const genderOk = form.gender === "male" || form.gender === "female";
    return nameOk && genderOk && form.termsAccepted;
  }, [form.fullName, form.gender, form.termsAccepted]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    /** iOS: combine DOM, direct ref, and React state so submit is not falsely blocked. */
    const dom = readFormFromDom(event.currentTarget);
    const refName = fullNameInputRef.current?.value ?? "";
    const merged = mergePersonalInfo(dom, form, refName);
    onChange(merged);

    const nameOk = normalizeName(merged.fullName).length > 0;
    const genderOk = merged.gender === "male" || merged.gender === "female";
    const ok = nameOk && genderOk && merged.termsAccepted;
    if (ok) {
      setSubmitError(false);
      onContinue();
      return;
    }
    setSubmitError(true);
  }

  return (
    <form
      className="relative z-10 flex flex-col gap-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="space-y-2">
        <FieldLabel>Full Name</FieldLabel>
        <div className="microsite-field">
          <TextField
            inputRef={fullNameInputRef}
            name="fullName"
            value={form.fullName}
            placeholder="Enter your full name"
            autoComplete="name"
            onChange={(fullName) => {
              setSubmitError(false);
              onChange({ fullName });
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel>Gender</FieldLabel>
        <div
          className="grid grid-cols-2 gap-3"
          role="radiogroup"
          aria-label="Gender"
        >
          {(
            [
              ["male", "Male"],
              ["female", "Female"],
            ] as const
          ).map(([value, label]) => {
            const selected = form.gender === value;
            const inputId = `microsite-gender-${value}`;
            return (
              <label
                key={value}
                htmlFor={inputId}
                className="microsite-field microsite-field--choice flex w-full items-center gap-3 text-left text-base leading-6 text-white active:opacity-95"
                onPointerDown={() => {
                  setSubmitError(false);
                  setGender(value);
                }}
              >
                <span className="flex size-6 shrink-0 items-center justify-center self-center">
                  <input
                    id={inputId}
                    type="radio"
                    name="microsite-gender"
                    value={value}
                    checked={selected}
                    className="microsite-gender-radio"
                    onChange={(event) => {
                      setSubmitError(false);
                      const v = event.currentTarget.value;
                      if (v === "male" || v === "female") {
                        setGender(v);
                      }
                    }}
                  />
                </span>
                <span className="min-w-0 flex-1 leading-6">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm leading-[21px] text-white/80">
        <input
          type="checkbox"
          name="termsAccepted"
          className="mt-0.5 size-5 shrink-0 accent-white"
          checked={form.termsAccepted}
          onChange={(event) => {
            setSubmitError(false);
            onChange({ termsAccepted: event.target.checked });
          }}
          onInput={(event) => {
            setSubmitError(false);
            onChange({
              termsAccepted: (event.currentTarget as HTMLInputElement).checked,
            });
          }}
        />
        <span>
          Saya setuju foto saya diolah menggunakan AI dan ditampilkan bersama nama saya di billboard
        </span>
      </label>

      {submitError ? (
        <p className="text-center text-xs text-amber-100/90" role="alert">
          Cek lagi: nama, gender, dan centang persetujuan. Lalu ketuk continue
          sekali lagi.
        </p>
      ) : null}

      <div className="relative z-20 mt-4">
        {/**
         * Do not use disabled={!ready}: iOS Safari can show a filled form while
         * React state is still empty — submit handler reads DOM instead.
         */}
        <button
          type="submit"
          className={`microsite-button uppercase ${ready ? "microsite-button-active" : "microsite-button-disabled"}`}
        >
          continue
        </button>
      </div>
    </form>
  );
}
