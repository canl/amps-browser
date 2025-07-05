import { useState, useCallback } from 'react';
import { APP_CONSTANTS } from '../utils/constants';

export interface GridState {
  showSidebar: boolean;
  enableGrouping: boolean;
  enableFiltering: boolean;
  enableCharting: boolean;
  pageSize: number;
}

export interface GridActions {
  toggleSidebar: () => void;
  toggleGrouping: () => void;
  toggleFiltering: () => void;
  toggleCharting: () => void;
  setPageSize: (size: number) => void;
  resetState: () => void;
}

const DEFAULT_GRID_STATE: GridState = {
  showSidebar: false,
  enableGrouping: false,
  enableFiltering: true,
  enableCharting: false,
  pageSize: APP_CONSTANTS.DEFAULT_GRID_PAGE_SIZE
};

export const useGridState = (initialState?: Partial<GridState>) => {
  const [gridState, setGridState] = useState<GridState>({
    ...DEFAULT_GRID_STATE,
    ...initialState
  });

  const toggleSidebar = useCallback(() => {
    setGridState(prev => ({ ...prev, showSidebar: !prev.showSidebar }));
  }, []);

  const toggleGrouping = useCallback(() => {
    setGridState(prev => ({ ...prev, enableGrouping: !prev.enableGrouping }));
  }, []);

  const toggleFiltering = useCallback(() => {
    setGridState(prev => ({ ...prev, enableFiltering: !prev.enableFiltering }));
  }, []);

  const toggleCharting = useCallback(() => {
    setGridState(prev => ({ ...prev, enableCharting: !prev.enableCharting }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setGridState(prev => ({ ...prev, pageSize: size }));
  }, []);

  const resetState = useCallback(() => {
    setGridState(DEFAULT_GRID_STATE);
  }, []);

  const actions: GridActions = {
    toggleSidebar,
    toggleGrouping,
    toggleFiltering,
    toggleCharting,
    setPageSize,
    resetState
  };

  return { gridState, actions };
};
