# AMPS Browser

A modern, professional web-based interface for interacting with AMPS (Advanced Message Processing System) servers. Built with React, TypeScript, Material-UI, and AG Grid Enterprise.

![AMPS Browser](https://img.shields.io/badge/React-18.x-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Material--UI](https://img.shields.io/badge/Material--UI-5.x-blue) ![AG Grid Enterprise](https://img.shields.io/badge/AG%20Grid-Enterprise-green)

## 🚀 Features

### 🎨 Modern UI/UX
- **Material-UI Design System**: Professional, responsive interface with consistent theming
- **Gradient App Bar**: Beautiful header with AMPS branding and navigation
- **Card-based Layout**: Clean, organized component structure with proper elevation
- **Responsive Design**: Adapts seamlessly to different screen sizes

### 🔌 AMPS Integration
- **Multi-Server Support**: Connect to multiple AMPS servers with configurable hosts
- **Real-time Data**: WebSocket subscriptions for live data streaming
- **Command Support**: Query, Subscribe, Query+Subscribe, and SOW Stats operations
- **Advanced Filtering**: AMPS filter expressions with syntax validation
- **Query Customization**: Order by, limit, bookmark, and additional options

### 📊 Enterprise Data Grid (AG Grid Enterprise)
- **Advanced Column Management**: Grouping, pivoting, and value aggregation
- **Professional Export**: Excel and CSV export with full formatting
- **Interactive Charts**: Create charts directly from grid data
- **Sidebar Panels**: Column and filter management tools
- **Range Selection**: Excel-like cell selection and clipboard operations
- **Status Bar**: Real-time statistics and selection information

### 🛠 Technical Features
- **TypeScript**: Full type safety and IntelliSense support
- **Error Handling**: Comprehensive error boundaries and user feedback
- **State Management**: Efficient React hooks and context management
- **Performance**: Optimized rendering with virtual scrolling
- **Testing Ready**: Jest and React Testing Library setup

## 🏗 Architecture

```
src/
├── components/          # React components
│   ├── ServerSelector   # AMPS server connection management
│   ├── TopicSelector    # Topic selection with search
│   ├── CommandSelector  # AMPS command selection
│   ├── QueryCustomization # Advanced query options
│   ├── ExecuteButton    # Command execution with status
│   ├── DataGrid         # AG Grid Enterprise integration
│   └── NotificationToast # User feedback system
├── hooks/               # Custom React hooks
│   └── useAMPS         # AMPS connection and data management
├── services/           # Business logic
│   └── amps-service    # AMPS client wrapper
├── config/             # Configuration
│   └── amps-config     # Server and command definitions
├── types/              # TypeScript type definitions
├── theme/              # Material-UI theme configuration
└── utils/              # Utility functions
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
Edit `src/config/amps-config.ts` to configure your AMPS servers:

```typescript
export const AMPS_SERVERS: AMPSServer[] = [
  {
    name: 'Production AMPS',
    host: 'amps-prod.company.com',
    port: 9090,
    websocketPort: 8080
  },
  {
    name: 'Development AMPS',
    host: 'amps-dev.company.com',
    port: 9090,
    websocketPort: 8080
  }
];
```

### Topics Configuration
Configure available topics in the same file:

```typescript
export const AMPS_TOPICS = [
  'market_data',
  'Orders',
  'Trades',
  'Positions'
];
```

## 📊 Using the Data Grid

### Enterprise Features
The AG Grid Enterprise integration provides powerful data analysis capabilities:

1. **Row Grouping**: Drag columns to the grouping area to organize data hierarchically
2. **Pivoting**: Create pivot tables for cross-tabulation analysis
3. **Aggregation**: Automatic sum, average, count, min, max for numeric columns
4. **Advanced Filtering**: Use the sidebar filter panel for complex filtering
5. **Excel Export**: Export data with full formatting and metadata
6. **Charts**: Select data and create interactive charts

### Toolbar Controls
- **Sidebar Toggle**: Show/hide enterprise tool panels
- **Grouping Toggle**: Enable/disable row grouping panel
- **Filter Toggle**: Show/hide floating filters
- **Auto-size**: Automatically size columns to content
- **Fit Columns**: Fit all columns to grid width
- **Export Options**: Excel and CSV export with formatting

## 🎯 Usage Examples

### Basic Query
1. Select an AMPS server and connect
2. Choose a topic from the dropdown
3. Select "Query" command
4. Click "Execute Command"

### Real-time Subscription
1. Connect to AMPS server
2. Select topic and "Subscribe" command
3. Optionally add filter expression
4. Execute to start receiving real-time updates

### Advanced Filtering
```sql
-- Filter by symbol and price
symbol = 'AAPL' AND price > 150

-- Time-based filtering
timestamp > '2023-01-01' AND timestamp < '2023-12-31'

-- Complex conditions
(symbol = 'AAPL' OR symbol = 'GOOGL') AND volume > 1000000
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

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the [AG Grid Enterprise documentation](https://ag-grid.com/documentation/)
- Review [Material-UI documentation](https://mui.com/)

## 🔗 Related Technologies

- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Material-UI](https://mui.com/) - Design system
- [AG Grid Enterprise](https://ag-grid.com/) - Data grid
- [AMPS](https://www.crankuptheamps.com/) - Message processing system
