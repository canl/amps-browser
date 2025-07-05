export const APP_CONSTANTS = {
  DEFAULT_RECONNECT_DELAY: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  DEFAULT_GRID_PAGE_SIZE: 100,
  SUBSCRIPTION_ID_PREFIX: 'amps_sub_'
} as const;

export const GRID_THEMES = {
  QUARTZ: 'ag-theme-quartz',
  ALPINE: 'ag-theme-alpine',
  ALPINE_DARK: 'ag-theme-alpine-dark',
  BALHAM: 'ag-theme-balham',
  BALHAM_DARK: 'ag-theme-balham-dark'
} as const;
