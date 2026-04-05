import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Form, Input } from 'antd';

interface FormInputProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  type?: 'text' | 'password' | 'datetime-local';
}

export function FormInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = 'text',
}: FormInputProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Form.Item
          label={label}
          validateStatus={fieldState.error ? 'error' : ''}
          help={fieldState.error?.message}
        >
          {type === 'password' ? (
            <Input.Password {...field} placeholder={placeholder} />
          ) : (
            <Input {...field} type={type} placeholder={placeholder} />
          )}
        </Form.Item>
      )}
    />
  );
}
