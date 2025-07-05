import { useState, useCallback } from 'react';

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
}

export interface FormState<T extends Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isDirty: boolean;
}

export interface FormActions<T extends Record<string, any>> {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  clearError: <K extends keyof T>(field: K) => void;
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  reset: () => void;
  validate: () => boolean;
}

type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K]) => string | undefined;
};

export const useFormState = <T extends Record<string, any>>(
  initialValues: T,
  validationRules?: ValidationRules<T>
) => {
  const createInitialState = (): FormState<T> => {
    const fields = {} as { [K in keyof T]: FormField<T[K]> };
    
    for (const key in initialValues) {
      fields[key] = {
        value: initialValues[key],
        error: undefined,
        touched: false
      };
    }

    return {
      fields,
      isValid: true,
      isDirty: false
    };
  };

  const [formState, setFormState] = useState<FormState<T>>(createInitialState());

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormState(prev => {
      const newFields = { ...prev.fields };
      newFields[field] = { ...newFields[field], value, touched: true };

      // Validate the field if validation rules exist
      if (validationRules?.[field]) {
        const error = validationRules[field]!(value);
        newFields[field].error = error;
      }

      const isValid = Object.values(newFields).every(field => !field.error);
      const isDirty = Object.values(newFields).some(field => field.touched);

      return {
        fields: newFields,
        isValid,
        isDirty
      };
    });
  }, [validationRules]);

  const setError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: { ...prev.fields[field], error }
      },
      isValid: false
    }));
  }, []);

  const clearError = useCallback(<K extends keyof T>(field: K) => {
    setFormState(prev => {
      const newFields = { ...prev.fields };
      newFields[field] = { ...newFields[field], error: undefined };
      
      const isValid = Object.values(newFields).every(field => !field.error);

      return {
        ...prev,
        fields: newFields,
        isValid
      };
    });
  }, []);

  const setTouched = useCallback(<K extends keyof T>(field: K, touched = true) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: { ...prev.fields[field], touched }
      },
      isDirty: touched || Object.values(prev.fields).some(f => f.touched)
    }));
  }, []);

  const reset = useCallback(() => {
    setFormState(createInitialState());
  }, []);

  const validate = useCallback(() => {
    if (!validationRules) return true;

    let isValid = true;
    const newFields = { ...formState.fields };

    for (const field in validationRules) {
      const rule = validationRules[field];
      if (rule) {
        const error = rule(newFields[field].value);
        newFields[field] = { ...newFields[field], error, touched: true };
        if (error) isValid = false;
      }
    }

    setFormState(prev => ({
      ...prev,
      fields: newFields,
      isValid,
      isDirty: true
    }));

    return isValid;
  }, [formState.fields, validationRules]);

  const actions: FormActions<T> = {
    setValue,
    setError,
    clearError,
    setTouched,
    reset,
    validate
  };

  return { formState, actions };
};
