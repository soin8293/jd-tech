
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInputSanitization } from '@/hooks/useInputSanitization';
import { z } from 'zod';

interface ValidatedTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  schema: z.ZodSchema;
  placeholder?: string;
  rows?: number;
  allowHtml?: boolean;
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  name,
  value,
  onChange,
  schema,
  placeholder,
  rows = 3,
  allowHtml = false
}) => {
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const { sanitizeString, sanitizeHtml } = useInputSanitization();

  const validateInput = (inputValue: string) => {
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Sanitize input
    const processedValue = allowHtml 
      ? sanitizeHtml(newValue, name)
      : sanitizeString(newValue, name);

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
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
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
