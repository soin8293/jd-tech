
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Removed useInputSanitization dependency
import { z } from 'zod';

interface ValidatedInputProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (name: string, value: string | number) => void;
  schema: z.ZodSchema;
  type?: 'text' | 'number' | 'email';
  placeholder?: string;
  required?: boolean;
  sanitize?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  name,
  value,
  onChange,
  schema,
  type = 'text',
  placeholder,
  required = false,
  sanitize = true
}) => {
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);
  // Simplified validation without sanitization

  const validateInput = (inputValue: string | number) => {
    try {
      schema.parse(inputValue);
      setError('');
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message || 'Invalid input');
      }
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    
    // Basic cleaning without complex sanitization
    const processedValue = sanitize && typeof newValue === 'string' 
      ? newValue.trim()
      : newValue;

    onChange(name, processedValue);
    
    if (touched) {
      validateInput(processedValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateInput(value);
  };

  useEffect(() => {
    if (touched) {
      validateInput(value);
    }
  }, [value, touched]);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={error ? 'border-red-500' : ''}
      />
      {error && touched && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
