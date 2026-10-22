import { METHODS, METHOD_LABELS, type Method } from "@/lib/billing";

// Medio de pago en un toque: cuatro opciones, una sola elegida.
export function MethodPicker({
  name = "method",
  defaultValue = "transfer",
}: {
  name?: string;
  defaultValue?: string;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Medio de pago</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METHODS.map((method: Method) => (
          <label
            key={method}
            className="bg-card has-[:checked]:border-primary has-[:checked]:bg-indigo-soft rounded-control flex min-h-11 cursor-pointer items-center justify-center border px-2 text-center text-sm has-[:checked]:font-medium"
          >
            <input
              type="radio"
              name={name}
              value={method}
              defaultChecked={defaultValue === method}
              className="sr-only"
            />
            {METHOD_LABELS[method]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
