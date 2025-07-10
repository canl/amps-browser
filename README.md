# AMPS Browser

A modern, professional web-based interface for interacting with AMPS (Advanced Message Processing System) servers. Built with React, TypeScript, Material-UI, and AG Grid Enterprise.

**🎯 Real-Time Data Terminal** • **🔌 Dynamic WebSocket Routing** • **🌙 Dark Theme** • **📊 Enterprise Data Grid**

![AMPS Browser](https://img.shields.io/badge/React-18.x-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Material--UI](https://img.shields.io/badge/Material--UI-5.x-blue) ![AG Grid Enterprise](https://img.shields.io/badge/AG%20Grid-Enterprise-green) ![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-green)

## 🚀 Features

### 🎨 Modern UI/UX
- **Dual Theme Support**: Light and dark themes with seamless switching
- **Material-UI Design System**: Professional, responsive interface with consistent theming
- **Full-Screen Layout**: Optimized space utilization with dynamic content adjustment
- **Responsive Design**: Adapts seamlessly to different screen sizes and orientations
- **Toast Notifications**: Real-time feedback with contextual success/error messages

### 🔌 Advanced AMPS Integration
- **Dynamic WebSocket Routing**: Automatic endpoint selection based on message format (json/nvfix/xml/bson/fix)
- **Multi-Server Support**: Connect to multiple AMPS servers with detailed host:port information
- **Smart Connection Management**: Server dropdown locks during active sessions for safety
- **Real-time Data Streaming**: WebSocket subscriptions with live updates and conflict resolution
- **Command-Specific Parameters**: Intelligent defaults (Query: top_n=100, Subscribe: tail_n=100)
- **Connection State Monitoring**: Real-time connection health with automatic error detection

### 📊 Enhanced Data Operations
- **Advanced AMPS Filtering**: Comprehensive filter syntax with field validation and error highlighting
- **Topic Management**: Color-coded topics sorted by message type with autocomplete search
- **Query Customization**: Content filters, order by, bookmarks, and conflation options
- **Command Types**: Query (SOW), Subscribe, Query+Subscribe with appropriate parameter handling
- **Data Integrity**: Automatic data clearing when switching between command types

### 📊 Enterprise Data Grid (AG Grid Enterprise)
- **Dark Theme Integration**: Fully styled dark mode with consistent theming
- **Advanced Column Management**: Grouping, pivoting, and value aggregation
- **Professional Export**: Excel and CSV export with full formatting
- **Interactive Charts**: Create charts directly from grid data
- **Enhanced Filtering**: Dark-themed filter inputs with proper styling
- **Raw Data Viewer**: JSON modal with syntax highlighting and copy functionality
- **Pagination Controls**: Dark-themed footer with page size selection
- **Range Selection**: Excel-like cell selection and clipboard operations
- **Status Bar**: Real-time statistics and selection information

### 🛠 Technical Features
- **TypeScript**: Full type safety and IntelliSense support
- **Robust Error Handling**: Comprehensive error boundaries with specific AMPS error detection
- **Smart Notifications**: Context-aware success/error messages based on actual operation results
- **State Management**: Efficient React hooks and context management with connection monitoring
- **Performance**: Optimized rendering with virtual scrolling and efficient data updates
- **Code Quality**: Clean architecture with extracted helper methods and consistent naming

### 🎯 User Experience Enhancements
- **Intelligent Feedback**: No misleading success notifications - only shows success after confirmed data receipt
- **Connection Transparency**: Detailed connection status with host:port information
- **Field-Level Validation**: Real-time error highlighting for filters, order by, and other query parameters
- **Session Safety**: Server selection locked during active connections to prevent accidental changes
- **Visual Consistency**: Harmonious color schemes optimized for extended use and reduced eye strain

## 🏗 Architecture

```
src/
├── components/          # React components
│   ├── ServerConnection # AMPS server connection with host:port display
│   ├── TopicSelection   # Color-coded topic selection with message type sorting
│   ├── CompactQueryBar  # Advanced query configuration with field validation
│   ├── DataGrid         # AG Grid Enterprise with dark theme integration
│   ├── common/          # Reusable UI components
│   │   ├── StatusDisplay # Connection and execution status with detailed feedback
│   │   └── FormField    # Consistent form controls
│   └── NotificationToast # Context-aware user feedback system
├── hooks/               # Custom React hooks
│   └── useAMPS         # AMPS connection, data management, and error handling
├── services/           # Business logic
│   └── amps-service    # AMPS client with dynamic WebSocket routing
├── config/             # Configuration
│   └── amps-config     # Server definitions with dynamic URL generation
├── contexts/           # React contexts
│   └── ThemeContext    # Light/dark theme management
├── types/              # TypeScript type definitions
│   └── amps-types      # AMPS-specific interfaces and types
└── utils/              # Utility functions
    └── constants       # Application constants and configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- AG Grid Enterprise license (for full enterprise features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd amps-browser
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure AG Grid Enterprise License** (Optional)
   
   Edit `src/components/DataGrid.tsx` and add your license key:
   ```typescript
   LicenseManager.setLicenseKey('YOUR_AG_GRID_ENTERPRISE_LICENSE_KEY');
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

### `npm start`
Runs the app in development mode with hot reloading.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder with optimizations.

### `npm run eject`
**⚠️ One-way operation!** Ejects from Create React App for full configuration control.

## 🔧 Configuration

### AMPS Server Configuration
Edit `src/config/amps-config.ts` to configure your AMPS servers with dynamic WebSocket routing:

```typescript
export const AMPS_SERVERS: AMPSServer[] = [
  {
    name: 'Production AMPS',
    host: 'amps-prod.company.com',
    tcpPort: 9007,
    websocketPort: 9008,
    adminPort: 8085,
    ampsUrl: 'ws://amps-prod.company.com:9008/amps/json', // Default
    getWebSocketUrl: (messageFormat: string) =>
      `ws://amps-prod.company.com:9008/amps/${messageFormat}`
  },
  {
    name: 'Development AMPS',
    host: 'amps-dev.company.com',
    tcpPort: 9007,
    websocketPort: 9008,
    adminPort: 8085,
    ampsUrl: 'ws://amps-dev.company.com:9008/amps/json', // Default
    getWebSocketUrl: (messageFormat: string) =>
      `ws://amps-dev.company.com:9008/amps/${messageFormat}`
  }
];
```

### Dynamic WebSocket Routing
The system automatically routes connections based on topic message formats:
- **JSON topics** → `/amps/json` endpoint
- **NVFIX topics** → `/amps/nvfix` endpoint
- **XML topics** → `/amps/xml` endpoint
- **BSON topics** → `/amps/bson` endpoint
- **FIX topics** → `/amps/fix` endpoint

### Topics Configuration
Topics are automatically discovered from the AMPS server admin interface. The system supports:

```typescript
export interface AMPSTopic {
  name: string;           // Topic name
  messageType: string;    // json, nvfix, xml, bson, fix
  key: string;           // SOW key field (e.g., /symbol)
  fileName?: string;     // SOW file name
}
```

## 📊 Using the Data Grid

### Enterprise Features
The AG Grid Enterprise integration provides powerful data analysis capabilities with full dark theme support:

1. **Row Grouping**: Drag columns to the grouping area to organize data hierarchically
2. **Pivoting**: Create pivot tables for cross-tabulation analysis
3. **Aggregation**: Automatic sum, average, count, min, max for numeric columns
4. **Advanced Filtering**: Dark-themed filter inputs with proper validation
5. **Excel Export**: Export data with full formatting and metadata
6. **Charts**: Select data and create interactive charts
7. **Raw Data Viewer**: Click "View" button to see full JSON data with syntax highlighting

### Dark Theme Integration
- **Consistent Styling**: All grid components match the application's dark theme
- **Filter Inputs**: Properly styled dark backgrounds for all filter types
- **Pagination**: Dark-themed footer with page size controls
- **JSON Modal**: Syntax-highlighted raw data viewer with soft color palette

### Toolbar Controls
- **Theme Toggle**: Switch between light and dark themes (top-right corner)
- **Sidebar Toggle**: Show/hide enterprise tool panels
- **Grouping Toggle**: Enable/disable row grouping panel
- **Filter Toggle**: Show/hide floating filters
- **Auto-size**: Automatically size columns to content
- **Fit Columns**: Fit all columns to grid width
- **Export Options**: Excel and CSV export with formatting
- **Clear Data**: Reset grid when switching command types

## 🎯 Usage Examples

### Basic SOW Query
1. **Select Server**: Choose from dropdown (shows host:port details)
2. **Connect**: Click Connect button (server dropdown becomes locked)
3. **Choose Topic**: Select from color-coded, sorted topic list
4. **Select Command**: Choose "Query (SOW)" for historical data
5. **Execute**: Click Execute - uses `top_n=100` for first 100 records
6. **View Results**: Data appears in grid with option to view raw JSON

### Real-time Subscription
1. **Connect to Server**: Establish connection (dropdown locks automatically)
2. **Select Topic**: Choose topic (system detects message format automatically)
3. **Choose Command**: Select "Subscribe" for live updates
4. **Add Filters**: Optional content filter with syntax validation
5. **Execute**: Click Execute - uses `tail_n=100` for latest 100 + live updates
6. **Monitor Data**: Real-time updates appear with conflict resolution

### SOW Query + Live Subscription
1. **Setup Connection**: Connect and select topic
2. **Choose Command**: Select "Query + Subscribe" for both historical and live data
3. **Configure Options**: Set conflation, filters, and other parameters
4. **Execute**: Gets latest 100 records then continues with live updates

### Advanced AMPS Filtering
```sql
-- Symbol-based filtering (case-insensitive)
/symbol = 'APPL'
/symbol IN ('APPL', 'GOOGL')

-- Numeric comparisons
/bid > 200 AND /bid < 300
/quantity >= 1000

-- String functions
INSTR_I(/symbol, 'APPL') != 0        -- Case-insensitive search
LENGTH(/symbol) = 4                   -- String length

-- Complex conditions with null checks
/symbol IS NOT NULL AND /bid > 0
```

### Error Handling Examples
The system provides specific error feedback:
- **Bad Filter**: Shows error directly in Content Filter field
- **Connection Issues**: Displays detailed host:port connection status
- **Invalid Options**: Highlights problematic parameters with context
- **Topic Errors**: Indicates topic availability and access issues

## 🎨 Theme and Visual Features

### Dark Theme Support
- **Seamless Theme Switching**: Toggle between light and dark themes
- **Consistent Styling**: All components properly themed including AG Grid
- **Eye Strain Reduction**: Soft, cool color palette optimized for extended use
- **Logo Adaptation**: Dynamic logo switching based on theme

### Visual Enhancements
- **Color-Coded Topics**: Different colors for message types (JSON=green, NVFIX=blue, etc.)
- **Status Indicators**: Real-time connection and execution status with detailed feedback
- **Toast Notifications**: Context-aware success/error messages with proper timing
- **Field Validation**: Real-time error highlighting with specific field targeting

## 🔧 Advanced Configuration

### Debug Tools
The application includes several debug utilities accessible via browser console:

```javascript
// Get current connection information
getConnectionInfo()

// Test filter expressions
testFilter('/symbol = "APPL"')

// Get AMPS client name
getAMPSClientName()

// Debug topic information
debugAMPSTopic('market_data')
```

### Environment Variables
```bash
# Development mode features
NODE_ENV=development  # Enables detailed console logging

# AG Grid Enterprise License
REACT_APP_AG_GRID_LICENSE=your_license_key_here
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## 🏗 Building for Production

Create an optimized production build:
```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Key Enhancements

### Recent Major Updates
- **🔌 Dynamic WebSocket Routing**: Automatic endpoint selection based on message format
- **🌙 Complete Dark Theme**: Fully integrated dark mode with AG Grid support
- **🎯 Smart Notifications**: Context-aware feedback that reflects actual operation results
- **🔒 Session Safety**: Server dropdown locks during active connections
- **📊 Enhanced Data Grid**: Dark theme integration with improved filter styling
- **� Visual Improvements**: Color-coded topics, detailed connection status, harmonious color schemes
- **⚡ Performance Optimizations**: Efficient data updates, connection monitoring, and error handling

### User Experience Improvements
- **No False Positives**: Success notifications only appear after confirmed data receipt
- **Detailed Error Messages**: Specific feedback for connection failures, AMPS errors, and validation issues
- **Field-Level Validation**: Real-time error highlighting for filters and query parameters
- **Connection Transparency**: Host:port details in all connection status messages

## �🆘 Support

For support and questions:
- Create an issue in the repository
- Check the [AG Grid Enterprise documentation](https://ag-grid.com/documentation/)
- Review [Material-UI documentation](https://mui.com/)
- Consult [AMPS documentation](https://www.crankuptheamps.com/documentation/)

## 🔗 Related Technologies

- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Material-UI](https://mui.com/) - Design system
- [AG Grid Enterprise](https://ag-grid.com/) - Data grid
- [AMPS](https://www.crankuptheamps.com/) - Message processing system
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - Real-time communication
