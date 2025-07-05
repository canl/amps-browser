import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  RowGroupingDisplayType,
  SideBarDef
} from 'ag-grid-community';

// Import AG Grid Enterprise modules
// import { LicenseManager } from 'ag-grid-enterprise';
import {
  AllEnterpriseModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
  MultiFilterModule,
  RowGroupingModule,
  TreeDataModule,
  RichSelectModule,
  ClipboardModule,
  ExcelExportModule,
  MasterDetailModule,
  StatusBarModule,
  ContextMenuModule
} from 'ag-grid-enterprise';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Collapse,
} from '@mui/material';
import {
  GetApp as ExportIcon,
  Clear as ClearIcon,
  ViewColumn as ColumnIcon,
  Fullscreen as FullscreenIcon,
  TableChart as TableIcon,
  FilterList as FilterIcon,
  GroupWork as GroupIcon,
  BarChart as ChartIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { GridData } from '../types/amps-types';
import { GRID_THEMES } from '../utils/constants';
import { useGridState } from '../hooks/useGridState';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Set AG Grid Enterprise license (you'll need to replace with your actual license)
// LicenseManager.setLicenseKey('YOUR_LICENSE_KEY_HERE');

// Register AG Grid Enterprise modules
ModuleRegistry.registerModules([
  AllEnterpriseModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
  MultiFilterModule,
  RowGroupingModule,
  TreeDataModule,
  RichSelectModule,
  ClipboardModule,
  ExcelExportModule,
  MasterDetailModule,
  StatusBarModule,
  ContextMenuModule
]);

interface DataGridProps {
  data: GridData[];
  isLoading?: boolean;
  theme?: string;
  onClearData?: () => void;
}



export const DataGrid: React.FC<DataGridProps> = ({
  data,
  isLoading = false,
  theme = GRID_THEMES.QUARTZ,
  onClearData
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const gridApiRef = useRef<GridApi | null>(null);

  // Debug data changes (development only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 DataGrid received data update:`, {
        recordCount: data.length,
        isLoading,
        sampleRecord: data.length > 0 ? data[0] : null
      });
    }
  }, [data, isLoading]);

  // Enhanced state for AG Grid Enterprise features
  const { gridState, actions: gridActions } = useGridState({
    enableFiltering: true
  });

  // Toolbar collapsed by default to optimize screen space
  const [toolbarExpanded, setToolbarExpanded] = useState(false);

  // Helper functions for AMPS-specific column formatting
  const formatHeaderName = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getColumnMinWidth = (key: string): number => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('id') || keyLower === 'symbol') return 120;
    if (keyLower.includes('price') || keyLower.includes('balance')) return 100;
    if (keyLower.includes('timestamp') || keyLower.includes('time')) return 180;
    if (keyLower.includes('status') || keyLower === 'side') return 80;
    return 100;
  };

  const getColumnMaxWidth = (key: string): number => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('timestamp') || keyLower.includes('time')) return 200;
    if (keyLower === 'symbol' || keyLower === 'side' || keyLower === 'status') return 120;
    return undefined as any; // No max width
  };

  // Generate column definitions dynamically based on AMPS data structure
  const columnDefs = useMemo<ColDef[]>(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Get all unique keys from the data
    const allKeys = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });

    // Define AMPS-specific column priorities and formatting
    const getColumnPriority = (key: string): number => {
      const priorityMap: { [key: string]: number } = {
        // Primary identifiers
        'symbol': 1, 'order_id': 1, 'trade_id': 1, 'account_id': 1, 'id': 1,
        // Financial data
        'price': 2, 'quantity': 2, 'volume': 2, 'balance': 2, 'notional': 2,
        'bid': 3, 'ask': 3, 'side': 3, 'status': 3,
        // Timestamps
        'timestamp': 4, 'last_update_time': 4, 'last_trade_time': 4,
        // Secondary data
        'venue': 5, 'currency': 5, 'trader_id': 5
      };
      return priorityMap[key.toLowerCase()] || 10;
    };

    // Create column definitions with AMPS-specific formatting
    return Array.from(allKeys)
      .sort((a, b) => getColumnPriority(a) - getColumnPriority(b))
      .map(key => {
        const sampleValue = data.find(row => row[key] !== undefined)?.[key];
        const valueType = typeof sampleValue;
        const keyLower = key.toLowerCase();

        const colDef: ColDef = {
          field: key,
          headerName: formatHeaderName(key),
          sortable: true,
          filter: true,
          resizable: true,
          minWidth: getColumnMinWidth(key),
          maxWidth: getColumnMaxWidth(key),
          enableRowGroup: true,
          enablePivot: true,
          enableValue: valueType === 'number',
          menuTabs: ['filterMenuTab', 'generalMenuTab', 'columnsMenuTab']
        };

        // Configure column based on data type and AMPS-specific formatting
        if (valueType === 'number') {
          colDef.type = 'numericColumn';
          colDef.filter = 'agNumberColumnFilter';
          colDef.cellClass = 'numeric-cell';
          colDef.enableValue = true;
          colDef.allowedAggFuncs = ['sum', 'avg', 'count', 'min', 'max'];

          // Financial formatting
          if (keyLower.includes('price') || keyLower.includes('balance') ||
              keyLower.includes('amount') || keyLower.includes('notional') ||
              keyLower.includes('pnl') || keyLower.includes('commission')) {
            colDef.cellRenderer = (params: any) => {
              if (typeof params.value === 'number') {
                const formatted = params.value.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
                // Color coding for PnL fields
                if (keyLower.includes('pnl')) {
                  const color = params.value >= 0 ? '#4caf50' : '#f44336';
                  return `<span style="color: ${color}; font-weight: 500;">${formatted}</span>`;
                }
                return formatted;
              }
              return params.value;
            };
          }
          // Volume/Quantity formatting
          else if (keyLower.includes('volume') || keyLower.includes('quantity') || keyLower.includes('size')) {
            colDef.cellRenderer = (params: any) => {
              if (typeof params.value === 'number') {
                return params.value.toLocaleString('en-US');
              }
              return params.value;
            };
          }
        }
        else if (valueType === 'boolean') {
          colDef.cellRenderer = (params: any) => {
            return params.value ?
              '<span style="color: #4caf50;">✓</span>' :
              '<span style="color: #f44336;">✗</span>';
          };
          colDef.filter = 'agSetColumnFilter';
          colDef.enableRowGroup = true;
        }
        else if (keyLower.includes('time') || keyLower.includes('date') || keyLower === 'timestamp') {
          colDef.filter = 'agDateColumnFilter';
          colDef.enableRowGroup = true;
          colDef.cellRenderer = (params: any) => {
            if (params.value) {
              try {
                const date = new Date(params.value);
                if (keyLower.includes('date') && !keyLower.includes('time')) {
                  return date.toLocaleDateString();
                }
                return date.toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });
              } catch {
                return params.value;
              }
            }
            return '';
          };
        }
        // Status and side fields with color coding
        else if (keyLower === 'status' || keyLower === 'side' || keyLower.includes('type')) {
          colDef.filter = 'agSetColumnFilter';
          colDef.enableRowGroup = true;
          colDef.cellRenderer = (params: any) => {
            if (!params.value) return '';

            let color = '#666';
            const value = params.value.toString().toUpperCase();

            // Status color coding
            if (keyLower === 'status') {
              switch (value) {
                case 'FILLED': case 'ACTIVE': case 'NEW': color = '#4caf50'; break;
                case 'CANCELLED': case 'REJECTED': case 'INACTIVE': color = '#f44336'; break;
                case 'PENDING': case 'PARTIALLY_FILLED': color = '#ff9800'; break;
              }
            }
            // Side color coding
            else if (keyLower === 'side') {
              color = value === 'BUY' ? '#4caf50' : '#f44336';
            }

            return `<span style="color: ${color}; font-weight: 500;">${params.value}</span>`;
          };
        }
        // ID fields - just use default text rendering
        else if (keyLower.includes('id') || keyLower === 'symbol') {
          colDef.filter = 'agTextColumnFilter';
          colDef.enableRowGroup = true;
          // No custom renderer - just display the plain value
        }
        else {
          colDef.filter = 'agTextColumnFilter';
          colDef.enableRowGroup = true;
        }

      return colDef;
    });
  }, [data]);

  // Default column definition with Enterprise features
  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: gridState.enableFiltering,
    enableRowGroup: true,
    enablePivot: true,
    enableValue: true,
    menuTabs: ['filterMenuTab', 'generalMenuTab', 'columnsMenuTab']
  }), [gridState.enableFiltering]);

  // Enhanced sidebar configuration
  const sideBar = useMemo<SideBarDef>(() => ({
    toolPanels: [
      {
        id: 'columns',
        labelDefault: 'Columns',
        labelKey: 'columns',
        iconKey: 'columns',
        toolPanel: 'agColumnsToolPanel',
        toolPanelParams: {
          suppressRowGroups: false,
          suppressValues: false,
          suppressPivots: false,
          suppressPivotMode: false,
          suppressColumnFilter: false,
          suppressColumnSelectAll: false,
          suppressColumnExpandAll: false
        }
      },
      {
        id: 'filters',
        labelDefault: 'Filters',
        labelKey: 'filters',
        iconKey: 'filter',
        toolPanel: 'agFiltersToolPanel'
      }
    ],
    defaultToolPanel: 'columns',
    hiddenByDefault: !gridState.showSidebar
  }), [gridState.showSidebar]);

  // Enhanced grid options with Enterprise features
  const gridOptions = useMemo(() => ({
    pagination: true,
    paginationPageSize: gridState.pageSize,
    rowSelection: 'multiple' as const,
    suppressRowClickSelection: true,
    enableRangeSelection: true,
    enableFillHandle: true,
    enableCharts: true,
    enableRangeHandle: true,
    animateRows: true,
    rowHeight: 35,
    headerHeight: 40,
    suppressCellFocus: false,
    suppressRowHoverHighlight: false,
    rowBuffer: 10,
    rowGroupPanelShow: gridState.enableGrouping ? 'always' as const : 'never' as const,
    groupDisplayType: 'multipleColumns' as RowGroupingDisplayType,
    suppressAggFuncInHeader: false,
    groupDefaultExpanded: 1,
    autoGroupColumnDef: {
      headerName: 'Group',
      field: 'group',
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        checkbox: true
      }
    },
    statusBar: {
      statusPanels: [
        { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
        { statusPanel: 'agSelectedRowCountComponent', align: 'center' },
        { statusPanel: 'agAggregationComponent', align: 'right' }
      ]
    },
    enableClipboard: true,
    copyHeadersToClipboard: true,
    copyGroupHeadersToClipboard: true
  }), [gridState.pageSize, gridState.enableGrouping]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;

    // Auto-size columns on initial load
    if (data.length > 0) {
      params.api.sizeColumnsToFit();
    }
  }, [data.length]);

  // Auto-size columns when data changes
  useEffect(() => {
    if (gridApiRef.current && data.length > 0) {
      // Delay to ensure DOM is updated
      setTimeout(() => {
        gridApiRef.current?.sizeColumnsToFit();
      }, 100);
    }
  }, [data.length, columnDefs]);

  const handleExportCsv = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.exportDataAsCsv({
        fileName: `amps-data-${new Date().toISOString().split('T')[0]}.csv`
      });
    }
  }, []);

  const handleAutoSizeColumns = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.autoSizeAllColumns();
    }
  }, []);

  const handleFitColumns = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.sizeColumnsToFit();
    }
  }, []);

  // Enhanced Enterprise functions
  const handleToggleSidebar = gridActions.toggleSidebar;
  const handleToggleGrouping = gridActions.toggleGrouping;
  const handleToggleFiltering = gridActions.toggleFiltering;

  const handleExportExcel = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.exportDataAsExcel({
        fileName: `amps-data-${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'AMPS Data'
      });
    }
  }, []);

  const handleCreateChart = useCallback(() => {
    if (gridApiRef.current) {
      const selectedRows = gridApiRef.current.getSelectedRows();
      if (selectedRows.length > 0) {
        gridApiRef.current.createRangeChart({
          chartType: 'column',
          cellRange: {
            rowStartIndex: 0,
            rowEndIndex: Math.min(selectedRows.length - 1, 100),
            columns: columnDefs.filter(col => col.field && typeof data[0]?.[col.field] === 'number').map(col => col.field!)
          }
        });
      }
    }
  }, [columnDefs, data]);

  const handlePageSizeChange = gridActions.setPageSize;

  return (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={3}>
          {/* Header with AMPS Message Info */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={1}>
                <TableIcon color="primary" />
                <Typography variant="h6" component="h2">
                  AMPS Data Grid
                </Typography>
              </Box>

              <Chip
                label={isLoading ? 'Loading...' : `${data.length} records`}
                color={data.length > 0 ? 'success' : 'default'}
                variant="outlined"
                size="small"
              />

              {data.length > 0 && !isLoading && (
                <>
                  <Chip
                    label={`${Object.keys(data[0]).length} fields`}
                    size="small"
                    variant="outlined"
                    color="info"
                  />
                  {data[0].symbol && (
                    <Chip
                      label={`${Array.from(new Set(data.map(r => r.symbol))).length} symbols`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {data[0].timestamp && (
                    <Chip
                      label={`Latest: ${new Date(Math.max(...data.map(r => new Date(r.timestamp || 0).getTime()))).toLocaleTimeString()}`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* Enhanced Toolbar - Collapsible */}
          <Paper variant="outlined" sx={{ p: 1 }}>
            {/* Toolbar Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 0.5 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Grid Controls
              </Typography>
              <Tooltip title={toolbarExpanded ? "Hide Controls" : "Show Controls"}>
                <IconButton
                  onClick={() => setToolbarExpanded(!toolbarExpanded)}
                  size="small"
                  color="primary"
                >
                  {toolbarExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Collapsible Toolbar Content */}
            <Collapse in={toolbarExpanded}>
              <Stack spacing={2} sx={{ pt: 1 }}>
                {/* Main Controls */}
                <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                <Tooltip title="Toggle Sidebar">
                  <IconButton
                    onClick={handleToggleSidebar}
                    color={gridState.showSidebar ? 'primary' : 'default'}
                    size="small"
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Toggle Row Grouping">
                  <IconButton
                    onClick={handleToggleGrouping}
                    color={gridState.enableGrouping ? 'primary' : 'default'}
                    size="small"
                  >
                    <GroupIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Toggle Floating Filters">
                  <IconButton
                    onClick={handleToggleFiltering}
                    color={gridState.enableFiltering ? 'primary' : 'default'}
                    size="small"
                  >
                    <FilterIcon />
                  </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem />

                <Tooltip title="Auto-size columns">
                  <span>
                    <IconButton
                      onClick={handleAutoSizeColumns}
                      disabled={data.length === 0}
                      size="small"
                    >
                      <ColumnIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Fit columns to grid">
                  <span>
                    <IconButton
                      onClick={handleFitColumns}
                      disabled={data.length === 0}
                      size="small"
                    >
                      <FullscreenIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Divider orientation="vertical" flexItem />

                <Tooltip title="Create Chart">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ChartIcon />}
                      onClick={handleCreateChart}
                      disabled={data.length === 0}
                    >
                      Chart
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title="Export to Excel">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportExcel}
                      disabled={data.length === 0}
                    >
                      Excel
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title="Export to CSV">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ExportIcon />}
                      onClick={handleExportCsv}
                      disabled={data.length === 0}
                    >
                      CSV
                    </Button>
                  </span>
                </Tooltip>

                {onClearData && (
                  <Tooltip title="Clear all data">
                    <span>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<ClearIcon />}
                        onClick={onClearData}
                        disabled={data.length === 0}
                      >
                        Clear
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </Stack>

              {/* Page Size Control */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Page Size:
                </Typography>
                <Stack direction="row" spacing={1}>
                  {[25, 50, 100, 200].map((size) => (
                    <Button
                      key={size}
                      variant={gridState.pageSize === size ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => handlePageSizeChange(size)}
                      sx={{ minWidth: 40 }}
                    >
                      {size}
                    </Button>
                  ))}
                </Stack>
                </Stack>
              </Stack>
            </Collapse>
          </Paper>

          {/* Grid */}
          <Box
            className={`${theme}`}
            sx={{
              height: toolbarExpanded ? 500 : 600, // More space when toolbar is collapsed
              width: '100%',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {data.length === 0 && !isLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 400,
                  textAlign: 'center',
                  color: 'text.secondary',
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: '2px dashed',
                  borderColor: 'grey.300'
                }}
              >
                <TableIcon sx={{ fontSize: 64, mb: 2, color: 'grey.400' }} />
                <Typography variant="h6" gutterBottom>
                  No AMPS Data Available
                </Typography>
                <Typography variant="body2" sx={{ maxWidth: 400, mb: 2 }}>
                  Connect to an AMPS server and execute a query or subscription to view real-time data.
                  Mock data has been disabled - only actual AMPS messages will be displayed.
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Real AMPS client integration required for data display
                </Typography>
              </Box>
            ) : (
              <AgGridReact
                ref={gridRef}
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                gridOptions={gridOptions}
                sideBar={sideBar}
                onGridReady={onGridReady}
                suppressMenuHide={false}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                enableCharts={true}
                rowGroupPanelShow={gridState.enableGrouping ? 'always' : 'never'}
                rowSelection="multiple"
                overlayLoadingTemplate={
                  '<span class="ag-overlay-loading-center">Connecting to AMPS server...</span>'
                }
                overlayNoRowsTemplate={
                  '<span class="ag-overlay-no-rows-center">No AMPS data received. Check server connection and topic configuration.</span>'
                }
              />
            )}
          </Box>

        </Stack>
      </CardContent>
    </Card>
  );
};
