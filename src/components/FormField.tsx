import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { Icon, type IconName } from './Icon'

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string; icon: IconName; error?: string; trailing?: ReactNode; inputRef?: Ref<HTMLInputElement>
}
export function FormField({ label, icon, error, trailing, inputRef, id, ...props }: FormFieldProps) {
  return <div className="form-field">
    <label htmlFor={id}>{label}</label>
    <div className="field-control">
      <Icon name={icon} />
      <input {...props} id={id} ref={inputRef} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : props['aria-describedby']} className={trailing ? 'has-trailing' : undefined} />
      {trailing}
    </div>
    {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
  </div>
}
