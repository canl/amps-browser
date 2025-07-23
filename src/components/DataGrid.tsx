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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
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
import DataObjectIcon from '@mui/icons-material/DataObject';
import { GridData } from '../types/amps-types';
import { useGridState } from '../hooks/useGridState';
import { useTheme } from '../contexts/ThemeContext';

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
  onClearData?: () => void;
  topicInfo?: { messageType: string; name: string } | null;
}

export const DataGrid: React.FC<DataGridProps> = ({
  data,
  isLoading = false,
  onClearData,
  topicInfo = null
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const { agGridThemeClass } = useTheme();

  // Debug theme changes (development only)
  React.useEffect(() => {
    console.log('AG Grid theme class:', agGridThemeClass);
  }, [agGridThemeClass]);

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

  // Modal state for viewing raw JSON data
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<GridData | null>(null);
  const [showParsedView, setShowParsedView] = useState(false); // For NVFIX toggle

  // Handler for viewing raw JSON data
  const handleViewRawData = useCallback((rowData: GridData) => {
    setSelectedRowData(rowData);

    // For NVFIX messages, default to raw view; for others, default to parsed view
    const isNVFIX = topicInfo?.messageType?.toLowerCase() === 'nvfix';
    setShowParsedView(!isNVFIX);

    setViewModalOpen(true);
  }, [topicInfo]);

  // Handler for closing the view modal
  const handleCloseViewModal = useCallback(() => {
    setViewModalOpen(false);
    setSelectedRowData(null);
    setShowParsedView(false);
  }, []);

  // Function to parse NVFIX messages into structured objects
  const parseNVFIXMessage = useCallback((nvfixString: string): Record<string, any> => {
    if (typeof nvfixString !== 'string') {
      return { error: 'Invalid NVFIX format', original: nvfixString };
    }

    const result: Record<string, any> = {};

    // Split by & delimiter and parse key=value pairs
    const pairs = nvfixString.split('&');

    for (const pair of pairs) {
      const equalIndex = pair.indexOf('=');
      if (equalIndex > 0) {
        const key = pair.substring(0, equalIndex).trim();
        const value = pair.substring(equalIndex + 1).trim();

        // Try to convert numeric values
        if (/^\d+(\.\d+)?$/.test(value)) {
          result[key] = parseFloat(value);
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }, []);

  // Function to format JSON with syntax highlighting
  const formatJsonWithHighlighting = useCallback((obj: any) => {
    const jsonString = JSON.stringify(obj, null, 2);

    // Apply syntax highlighting using regex
    return jsonString
      .replace(/(".*?")(\s*:)/g, '<span class="json-key">$1</span>$2') // Keys
      .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>') // String values
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>') // Number values
      .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>') // Boolean values
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>'); // Null values
  }, []);

  // View Button Cell Renderer Component
  const ViewButtonRenderer = useCallback((props: any) => {
    return (
      <Button
        size="small"
        onClick={() => handleViewRawData(props.data)}
      >
        <DataObjectIcon />
      </Button>
    );
  }, [handleViewRawData]);

  // Nested Object Cell Renderer Component
  const NestedObjectRenderer = useCallback((props: any) => {
    if (props.value === null || props.value === undefined) {
      return (
        <Box component="span" sx={{ fontStyle: 'italic', opacity: 0.6 }}>
          null
        </Box>
      );
    }

    try {
      const jsonString = JSON.stringify(props.value);

      // For arrays, show a more readable format
      if (Array.isArray(props.value)) {
        const arrayLength = props.value.length;
        const preview = arrayLength > 0 ? JSON.stringify(props.value[0]) : '{}';
        const truncatedPreview = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;

        return (
          <Box
            component="span"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}
            title={jsonString}
          >
            [{arrayLength} items] {truncatedPreview}
          </Box>
        );
      }

      // For objects, show a truncated version
      const truncated = jsonString.length > 100 ? jsonString.substring(0, 100) + '...' : jsonString;
      return (
        <Box
          component="span"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}
          title={jsonString}
        >
          {truncated}
        </Box>
      );
    } catch (error) {
      return (
        <Box component="span" sx={{ fontStyle: 'italic', opacity: 0.6 }}>
          [Complex Object]
        </Box>
      );
    }
  }, []);

  // Boolean Cell Renderer Component
  const BooleanRenderer = useCallback((props: any) => {
    return (
      <Box
        component="span"
        sx={{
          color: props.value ? 'success.main' : 'error.main',
          fontWeight: 500
        }}
      >
        {props.value ? 'True' : 'False'}
      </Box>
    );
  }, []);

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
    const dataColumns = Array.from(allKeys)
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

        // Configure column based on data type
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
        // Handle objects and arrays (data-agnostic)
        else if (valueType === 'object' && sampleValue !== null) {
          colDef.filter = 'agTextColumnFilter';
          colDef.enableRowGroup = false;
          colDef.cellRenderer = NestedObjectRenderer;
        }
        // Handle booleans (data-agnostic)
        else if (valueType === 'boolean') {
          colDef.filter = 'agSetColumnFilter';
          colDef.enableRowGroup = true;
          colDef.cellRenderer = BooleanRenderer;
        }

      return colDef;
    });

    // Add View column as the last column for inspecting raw JSON data
    const viewColumn: ColDef = {
      headerName: 'View',
      field: '__view__',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      resizable: false,
      sortable: false,
      filter: false,
      floatingFilter: false,
      enableRowGroup: false,
      enablePivot: false,
      enableValue: false,
      pinned: 'right',
      cellRenderer: ViewButtonRenderer
    };

    return [...dataColumns, viewColumn];
  }, [data, handleViewRawData, ViewButtonRenderer, NestedObjectRenderer, BooleanRenderer]);

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
    <>
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:last-child': { pb: 2 } // Override default CardContent padding
        }}
      >
        <Stack
          spacing={3}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
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

          {/* Grid - Flexible Height */}
          <Box
            sx={{
              flex: 1, // Take up all available space
              width: '100%',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              minHeight: 400, // Minimum height for usability
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
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '2px dashed',
                  borderColor: 'divider'
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
              <div className={agGridThemeClass} style={{ height: '100%', width: '100%' }}>
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
              </div>
            )}
          </Box>

        </Stack>
      </CardContent>
    </Card>

    {/* Raw JSON Data View Modal */}
    <Dialog
      open={viewModalOpen}
      onClose={handleCloseViewModal}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: '#1a1a1a',
            border: '1px solid #667eea',
            borderRadius: 2,
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#2d2d2d',
          color: '#e3f2fd',
          fontFamily: '"Courier New", "Monaco", "Consolas", monospace',
          fontSize: '1rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          borderBottom: '1px solid #667eea',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DataObjectIcon sx={{ color: '#667eea' }} />
          {topicInfo?.messageType?.toLowerCase() === 'nvfix'
            ? (showParsedView ? 'Parsed NVFIX Data' : 'Raw NVFIX Data')
            : 'Raw JSON Data'
          }
        </Box>

        {/* Toggle for NVFIX messages */}
        {topicInfo?.messageType?.toLowerCase() === 'nvfix' && (
          <ToggleButtonGroup
            value={showParsedView ? 'parsed' : 'raw'}
            exclusive
            onChange={(_, newValue) => {
              if (newValue !== null) {
                setShowParsedView(newValue === 'parsed');
              }
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: '#90caf9',
                borderColor: '#667eea',
                fontSize: '0.75rem',
                padding: '4px 8px',
                '&.Mui-selected': {
                  backgroundColor: '#667eea',
                  color: '#ffffff',
                },
              },
            }}
          >
            <ToggleButton value="raw">Raw</ToggleButton>
            <ToggleButton value="parsed">Parsed</ToggleButton>
          </ToggleButtonGroup>
        )}
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          padding: 2,
        }}
      >
        <Box
          component="pre"
          sx={{
            fontFamily: '"Courier New", "Monaco", "Consolas", monospace',
            fontSize: '0.875rem',
            lineHeight: 1.4,
            margin: 0,
            padding: 2,
            backgroundColor: '#1e1e1e',
            border: '1px solid #404040',
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: '60vh',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: '#ffffff',
            '& .json-key': {
              color: '#81c784 !important',
              fontWeight: 'bold',
            },
            '& .json-string': {
              color: '#64b5f6 !important',
            },
            '& .json-number': {
              color: '#ffb74d !important',
              fontWeight: 'bold',
            },
            '& .json-boolean': {
              color: '#ba68c8 !important',
              fontWeight: 'bold',
            },
            '& .json-null': {
              color: '#f06292 !important',
              fontWeight: 'bold',
            },
          }}
          dangerouslySetInnerHTML={{
            __html: (() => {
              if (!selectedRowData) return '';

              const isNVFIX = topicInfo?.messageType?.toLowerCase() === 'nvfix';

              if (isNVFIX) {
                // Extract NVFIX string from the selected row data
                // The NVFIX string is in the first field (excluding 'key')
                const dataKeys = Object.keys(selectedRowData).filter(key => key !== 'key');
                const firstKey = dataKeys[0];
                const nvfixString = firstKey && selectedRowData[firstKey] && typeof selectedRowData[firstKey] === 'string' && selectedRowData[firstKey].includes('&')
                  ? `${firstKey}=${selectedRowData[firstKey]}`
                  : '';

                if (showParsedView) {
                  // Show parsed NVFIX data
                  const parsedData = parseNVFIXMessage(nvfixString);
                  return formatJsonWithHighlighting(parsedData);
                } else {
                  // Show raw NVFIX string in the correct format
                  const rawDisplay = {
                    messageType: 'nvfix',
                    data: nvfixString,
                    sowKey: selectedRowData.key || 'N/A'
                  };
                  return formatJsonWithHighlighting(rawDisplay);
                }
              } else {
                // For non-NVFIX messages, show the parsed data
                return formatJsonWithHighlighting(selectedRowData);
              }
            })()
          }}
        />
      </DialogContent>
      <DialogActions
        sx={{
          backgroundColor: '#2d2d2d',
          borderTop: '1px solid #667eea',
          padding: 2,
        }}
      >
        <Button
          onClick={handleCloseViewModal}
          variant="outlined"
          sx={{
            color: '#90caf9',
            borderColor: '#90caf9',
            fontFamily: '"Courier New", "Monaco", "Consolas", monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            '&:hover': {
              backgroundColor: 'rgba(144, 202, 249, 0.08)',
              borderColor: '#90caf9',
            },
          }}
        >
          Close
        </Button>
        <Button
          onClick={() => {
            if (selectedRowData) {
              navigator.clipboard.writeText(JSON.stringify(selectedRowData, null, 2));
              // Could add a toast notification here
            }
          }}
          variant="contained"
          sx={{
            backgroundColor: '#667eea',
            color: '#ffffff',
            border: '1px solid #667eea',
            fontFamily: '"Courier New", "Monaco", "Consolas", monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            '&:hover': {
              backgroundColor: '#5a6fd8',
            },
          }}
        >
          Copy JSON
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};
