import { useStore } from "@tanstack/react-form";
import { useId } from "react";
import { useFieldContext } from "@/hooks/app.form-context";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea as ShadcnTextarea } from "./ui/textarea";

function ErrorMessages({
  errors,
}: {
  errors: Array<string | { message: string }>;
}) {
  return (
    <>
      {errors.map((error) => (
        <div
          key={typeof error === "string" ? error : error.message}
          className="text-sm text-red-500 mt-1"
        >
          {typeof error === "string" ? error : error.message}
        </div>
      ))}
    </>
  );
}

export function TextField({
  label,
  placeholder,
}: {
  label: string;
  placeholder?: string;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  const id = useId();

  return (
    <div>
      <Label className="mb-2" htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />

      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}

export function TextArea({
  label,
  rows = 3,
}: {
  label: string;
  rows?: number;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  const id = useId();

  return (
    <div>
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      <ShadcnTextarea
        id={id}
        value={field.state.value}
        onBlur={field.handleBlur}
        rows={rows}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
