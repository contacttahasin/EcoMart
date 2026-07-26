import type { ShippingInfo } from "@/services/order.service";

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-secondary-container/40";

function Field({
  label,
  className,
  ...props
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label className="text-sm font-medium text-on-surface-variant">{label}</label>
      <input className={inputClass} {...props} />
    </div>
  );
}

type ShippingFormProps = {
  value: ShippingInfo;
  onChange: (value: ShippingInfo) => void;
};

export function ShippingForm({ value, onChange }: ShippingFormProps) {
  const setField = (field: keyof ShippingInfo) => (event: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: event.target.value });

  return (
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-outline-variant bg-white p-4 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] sm:p-6 md:grid-cols-2">
      <Field
        label="Full Name"
        type="text"
        placeholder="Jane Doe"
        className="md:col-span-2"
        required
        value={value.fullName}
        onChange={setField("fullName")}
      />
      <Field
        label="Email Address"
        type="email"
        placeholder="jane@example.com"
        required
        value={value.email}
        onChange={setField("email")}
      />
      <Field
        label="Phone Number"
        type="tel"
        placeholder="+880 1XXX-XXXXXX"
        required
        value={value.phone}
        onChange={setField("phone")}
      />
      <Field
        label="Street Address"
        type="text"
        placeholder="123 Eco Way"
        className="md:col-span-2"
        required
        value={value.street}
        onChange={setField("street")}
      />
      <Field label="City" type="text" placeholder="Portland" required value={value.city} onChange={setField("city")} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="State" type="text" placeholder="OR" required value={value.state} onChange={setField("state")} />
        <Field
          label="Zip Code"
          type="text"
          placeholder="97201"
          required
          value={value.zipCode}
          onChange={setField("zipCode")}
        />
      </div>
    </div>
  );
}
