import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete,
  Box,
  SelectChangeEvent,
} from '@mui/material';

export interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export interface SelectFieldProps extends Omit<FormFieldProps, 'onChange'> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  onChange: (value: string) => void;
}

export interface AutocompleteFieldProps extends Omit<FormFieldProps, 'onChange'> {
  options: Array<{ value: string; label: string; description?: string }>;
  onChange: (value: string | null) => void;
  freeSolo?: boolean;
  filterOptions?: (options: any[], params: any) => any[];
  renderOption?: (props: any, option: any) => React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  error,
  disabled = false,
  placeholder,
  required = false,
  fullWidth = true,
  size = 'medium',
  startIcon,
  endIcon,
}) => {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error}
      disabled={disabled}
      placeholder={placeholder}
      required={required}
      fullWidth={fullWidth}
      size={size}
      InputProps={{
        startAdornment: startIcon,
        endAdornment: endIcon,
      }}
    />
  );
};

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  disabled = false,
  required = false,
  fullWidth = true,
  size = 'medium',
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth={fullWidth} error={!!error} disabled={disabled} size={size}>
      <InputLabel required={required}>{label}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        label={label}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  disabled = false,
  placeholder,
  required = false,
  fullWidth = true,
  size = 'medium',
  freeSolo = false,
  filterOptions,
  renderOption,
  startIcon,
}) => {
  const selectedOption = options.find(option => option.value === value) || null;

  return (
    <Autocomplete
      value={selectedOption}
      onChange={(_, newValue) => {
        if (typeof newValue === 'string') {
          onChange(newValue);
        } else {
          onChange(newValue?.value || null);
        }
      }}
      options={options}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option.label;
      }}
      isOptionEqualToValue={(option, value) => {
        if (typeof option === 'string' && typeof value === 'string') {
          return option === value;
        }
        return option.value === value.value;
      }}
      disabled={disabled}
      freeSolo={freeSolo}
      fullWidth={fullWidth}
      size={size}
      filterOptions={filterOptions}
      renderOption={renderOption}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={!!error}
          helperText={error}
          InputProps={{
            ...params.InputProps,
            startAdornment: startIcon ? (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                {startIcon}
                {params.InputProps.startAdornment}
              </Box>
            ) : params.InputProps.startAdornment,
          }}
        />
      )}
    />
  );
};
