# Mini Wallet Dashboard

A modern, accessible wallet dashboard application built with React, TypeScript, and Tailwind CSS. This application demonstrates proper state management, money logic safety, and user experience best practices.

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 9jatask
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Features

### Core Functionality

1. **Transactions List**
   - Displays date, merchant, category, amount (credit/debit), and running balance
   - Fetches from local JSON files and localStorage for persistence
   - Real-time running balance calculation
   - Pagination with 10 items per page
   - Click on any transaction to view detailed information in a modal
   - Responsive design that works on mobile and desktop

2. **Transfer Form** (`/transfer`)
   - Move money between two accounts (Main ↔ Savings)
   - Support for internal transfers (between your accounts) and external transfers (to other users)
   - Validation:
     - Positive decimal numbers only
     - Maximum 2 decimal places
     - Sufficient balance check
     - Cannot transfer to same account
   - Optimistic updates with automatic rollback on error
   - Multi-step flow: form input → PIN verification → processing → success
   - Real-time balance preview showing current and new balances
   - Category selection for transaction organization
   - Disabled submit button during processing to prevent double submission

3. **Fund Wallet** (`/fund-wallet`)
   - Add money to your wallet accounts
   - Account selection dropdown
   - Real-time amount formatting with commas
   - Balance preview cards showing current and new balance
   - Multi-step flow: amount input → PIN verification → processing → success
   - Category selection for funding reason
   - Disabled submit button during processing
   - Auto-redirect to dashboard after successful funding

4. **Dashboard** (`/`)
   - Overview of all accounts and balances
   - Account switching (Total, Main Account, Savings Account)
   - Balance visibility toggle (show/hide balance)
   - Quick actions sidebar with links to Fund Wallet, Fund Transfers, Transactions, Analytics, and Goals
   - Wallet summary showing monthly income, expenses, and net change
   - Transaction list with pagination
   - Advanced filtering by category, merchant, and date range
   - Responsive grid layout

5. **Transactions Page** (`/transactions`)
   - View all transactions with full pagination
   - Advanced filtering options
   - Time period selection (Last 7 days, 30 days, 90 days, or all time)
   - Search by merchant name
   - Filter by category
   - Date range filtering

6. **Analytics & Insights** (`/analytics`)
   - Comprehensive spending analysis and visualization
   - Spending trends line chart (last 30 days)
   - Category breakdown pie chart
   - Monthly comparison bar chart (last 6 months)
   - Advanced spending statistics:
     - Average transaction amount
     - Most active day of the week
     - This month vs last month expenses
     - Projected monthly spending
     - Top merchants list
     - Spending patterns by time of day (morning, afternoon, evening)
   - Responsive chart layouts
   - Interactive tooltips with formatted currency values

7. **Goals & Savings Targets** (`/goals`)
   - Create custom savings goals with target amounts and dates
   - Link goals to specific accounts
   - Allocate funds to goals from linked accounts
   - Withdraw from goals (only after target date is reached)
   - Progress tracking based on both date and amount
   - Visual progress bars with color-coded status
   - Separate views for active and completed goals
   - Goal completion celebration animations
   - Date-based and amount-based progress calculation
   - Automatic goal synchronization with account balances
   - Formatted amount display with commas and decimals

8. **Account Management** (`/accounts`)
   - Full CRUD operations for accounts
   - Create new accounts with custom details
   - Edit account information (name, type, balance, description)
   - Archive and unarchive accounts
   - Delete accounts (with validation to prevent deletion of accounts with goals)
   - Account customization:
     - Color coding for visual organization
     - Icon selection for quick identification
     - Account number and description fields
   - Account type selection (checking, savings, investment, etc.)
   - Real-time balance updates
   - Responsive grid layout

9. **User Profile Management** (`/profile`)
   - View and edit user profile information
   - Update personal details:
     - First name and last name
     - Email address
     - Phone number
     - Date of birth
     - Address
     - Plan and role
   - Avatar customization:
     - Upload custom avatar image
     - Generate avatar with initials and color
     - Color picker for avatar background
   - Profile changes reflected across the entire application
   - Dynamic avatar display in header and sidebar
   - Form validation and error handling

### Advanced Features

1. **State Management**
   - Zustand store for global state management
   - Persistent storage using localStorage
   - Automatic data synchronization between localStorage and JSON files
   - Optimistic UI updates with rollback capability

2. **Filtering and Search**
   - Filter transactions by category
   - Search transactions by merchant name
   - Filter by date range (from/to dates)
   - Time period quick filters (7, 30, 90 days)
   - Clear filters functionality
   - Mobile-friendly filter modal

3. **Transaction Details**
   - Click any transaction to view full details
   - Modal shows: amount, merchant, category, date, time, type, account, running balance, and transaction ID
   - Responsive modal design
   - Smooth animations and transitions

4. **Pagination**
   - 10 transactions per page
   - Previous/Next navigation buttons
   - Page number buttons with smart ellipsis for large page counts
   - Shows current page and total pages
   - Displays transaction count (e.g., "Showing 1-10 of 25 transactions")
   - Auto-resets to page 1 when filters change
   - Smooth scroll to top on page change

5. **Responsive Design**
   - Mobile-first approach
   - Works seamlessly from 360px width to desktop
   - Collapsible sidebar menu on mobile
   - Touch-friendly buttons and inputs
   - Responsive modals and forms
   - Optimized typography and spacing for all screen sizes

6. **Accessibility**
   - Semantic HTML elements
   - ARIA labels and roles
   - Keyboard navigation support
   - Focus management
   - Screen reader friendly
   - Proper color contrast

7. **Security and UX**
   - No sensitive data logged to console
   - Generic error messages that don't expose internals
   - Form validation before submission
   - Disabled buttons during processing to prevent double submission
   - Clear error messages without technical details
   - PIN entry with auto-advance and paste support
   - Success modals with progress bar and manual redirect option

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **date-fns** - Date formatting and manipulation
- **Zod** - Schema validation (for form validation)
- **Recharts** - Data visualization and charting library
- **jsPDF** - PDF generation for transaction exports

## Project Structure

```
9jatask/
├── public/
│   ├── accounts.json          # Account data
│   ├── transactions.json       # Initial transaction data
│   └── dummy-users.json       # External transfer recipients
├── src/
│   ├── components/
│   │   ├── Common/           # Reusable components
│   │   │   ├── FeatureNotAvailable.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── PINModal.tsx
│   │   │   └── SuccessModal.tsx
│   │   ├── Dashboard/         # Dashboard-specific components
│   │   │   ├── AccountCard.tsx
│   │   │   ├── Filters.tsx
│   │   │   ├── FilterModal.tsx
│   │   │   ├── RightSidebar.tsx
│   │   │   ├── TotalAssets.tsx
│   │   │   ├── TransactionDetailModal.tsx
│   │   │   └── TransactionTable.tsx
│   │   └── Layout/            # Layout components
│   │       ├── Layout.tsx
│   │       ├── MobileMenu.tsx
│   │       └── Sidebar.tsx
│   ├── pages/                 # Page components
│   │   ├── Dashboard.tsx
│   │   ├── FundWallet.tsx
│   │   ├── Transfer.tsx
│   │   ├── Transactions.tsx
│   │   ├── Analytics.tsx
│   │   ├── Goals.tsx
│   │   ├── AccountManagement.tsx
│   │   └── Profile.tsx
│   ├── store/                 # State management
│   │   └── useWalletStore.ts
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── categories.ts
│   │   ├── validation.ts
│   │   └── export.ts          # CSV/PDF export utilities
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── README.md
└── package.json
```

## Key Implementation Details

### Running Balance Calculation

The running balance is calculated by:
1. Starting with the current account balance
2. Working backwards through transactions to find the starting balance
3. Then applying transactions forward chronologically to get the balance after each transaction
4. This ensures accuracy even when transactions are added out of order

### Optimistic Updates with Rollback

When a transfer or funding operation is initiated:
1. The UI updates immediately (optimistic update)
2. Account balances are updated in the store
3. Transactions are added to the list
4. If the operation fails, all changes are rolled back automatically
5. Error messages are shown to the user

### Data Persistence

- Data is stored in localStorage for persistence across sessions
- Falls back to JSON files if localStorage is empty
- Automatic synchronization between localStorage and store
- Transactions, accounts, goals, and user profile are saved after every update
- Goals persist across page refreshes
- User profile changes are immediately reflected throughout the application

### Form Validation

All forms include comprehensive validation:
- Amount validation: positive numbers, max 2 decimal places
- Balance validation: sufficient funds check
- Account validation: valid account selection
- Category validation: required field
- Real-time error messages
- Disabled submit during processing

### Error Handling

- Generic error messages that don't expose internal details
- User-friendly error displays
- Retry functionality for failed operations
- Non-blocking error banners for runtime errors
- Loading states for better UX
- Graceful degradation when data fails to load
- Consistent error handling across all pages
- Loading indicators on all data-fetching operations

### Goals & Savings System

The goals feature implements a comprehensive savings target system:

1. **Goal Creation**: Users can create goals with target amounts and withdrawal dates
2. **Progress Tracking**: Progress is calculated based on both:
   - Date progress: Time elapsed towards target date
   - Amount progress: Funds allocated towards target amount
   - Overall progress: Average of both metrics
3. **Allocation**: Funds can be allocated to goals from linked accounts
4. **Withdrawal**: Withdrawals are only allowed after the target date is reached
5. **Completion**: Goals are marked complete when both amount and date requirements are met
6. **Persistence**: All goals are saved to localStorage and persist across sessions
7. **Synchronization**: Goals automatically sync with account balances

### Data Visualization

The Analytics page provides comprehensive spending insights:

1. **Charts**: Interactive charts using Recharts library
   - Line chart for spending trends over time
   - Pie chart for category breakdown
   - Bar chart for monthly income/expense comparison
2. **Statistics**: Calculated metrics including:
   - Average transaction amounts
   - Most active spending days
   - Projected monthly spending
   - Top merchants by transaction volume
   - Spending patterns by time of day
3. **Responsive Design**: All charts adapt to different screen sizes
4. **Formatted Values**: Currency values are properly formatted in tooltips and labels

### Account Management

The account management system provides full control over user accounts:

1. **CRUD Operations**: Create, read, update, and delete accounts
2. **Customization**: Color coding and icon selection for visual organization
3. **Archiving**: Archive accounts without deleting them
4. **Validation**: Prevents deletion of accounts that have active goals
5. **Real-time Updates**: Changes reflect immediately across the application
6. **Account Types**: Support for multiple account types (checking, savings, investment, etc.)

### User Profile Management

The profile system allows users to manage their personal information:

1. **Profile Editing**: Update name, email, phone, date of birth, address, plan, and role
2. **Avatar System**: 
   - Upload custom avatar images
   - Generate avatars with user initials and custom colors
   - Color picker for avatar background customization
3. **Global Updates**: Profile changes are reflected in header, sidebar, and throughout the app
4. **Persistence**: Profile data is saved to localStorage and persists across sessions

## Routes

- `/` - Dashboard (main page with account overview and recent transactions)
- `/transfer` - Transfer funds between accounts or to external users
- `/fund-wallet` - Add money to wallet accounts
- `/transactions` - View all transactions with advanced filtering
- `/analytics` - Analytics and insights with data visualization charts
- `/goals` - Goals and savings targets management
- `/accounts` - Account management with CRUD operations
- `/profile` - User profile management and settings

## Security Considerations

1. **No Console Logs**: Sensitive data (amounts, PINs, account details) is never logged to console. Only non-sensitive warnings about localStorage operations are logged.

2. **Error Handling**: All error messages are generic and user-friendly. Internal error details are never exposed to users. Technical errors are logged to console for debugging but not shown in the UI.

3. **Input Validation**: All user inputs are validated before processing. Invalid inputs are rejected with clear error messages.

4. **Disabled States**: Forms and buttons are disabled during processing to prevent double submission and ensure data integrity.

5. **Type Safety**: TypeScript provides compile-time type checking to prevent many runtime errors.

6. **No Sensitive Data Exposure**: Error messages, console logs, and UI displays never reveal sensitive information like account numbers, PINs, or internal system details.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive from 360px width to desktop sizes
- Touch-friendly interactions

## Development Notes

### State Management

The application uses Zustand for state management, which provides:
- Simple, lightweight API
- TypeScript support
- No boilerplate code
- Easy to test and maintain

### Styling

Tailwind CSS is used throughout for:
- Consistent design system
- Responsive utilities
- Easy customization
- Small bundle size with purging

### Form Handling

Forms use controlled components with:
- Real-time validation
- Optimistic updates
- Error handling
- Loading states
- Success feedback

### Date and Time Handling

The application uses date-fns for:
- Consistent date formatting
- Time calculations
- Date comparisons
- Locale support

## Additional Features

### Export Functionality

- **CSV Export**: Export transactions to CSV format with all details
- **PDF Export**: Generate PDF reports of transactions with formatting
- **Date Range Support**: Export filtered transactions or all transactions
- **Formatted Output**: Properly formatted currency and dates in exports

### Responsive Design Enhancements

- **Mobile-First**: All new features are fully responsive
- **Touch-Friendly**: Optimized for mobile interactions
- **Adaptive Layouts**: Charts and tables adapt to screen size
- **Modal Optimization**: All modals work seamlessly on mobile devices

## Future Enhancements

If this were a production application, additional features could include:

1. **Testing**: Unit tests (Jest/Vitest) and integration tests
2. **Error Boundaries**: React error boundaries for better error handling
3. **Loading States**: Skeleton loaders for better perceived performance
4. **Real API**: Integration with actual backend API
5. **Authentication**: User authentication and authorization
6. **PWA**: Progressive Web App features for offline support
7. **Notifications**: Real-time notifications for transactions
8. **Budgeting**: Budget tracking and alerts
9. **Recurring Transactions**: Set up recurring payments and income
10. **Transaction Templates**: Quick templates for common transactions
11. **Multi-Currency Support**: Support for multiple currencies
12. **Goal Templates**: Pre-defined goal templates for common savings targets
13. **Advanced Analytics**: More detailed analytics and forecasting
14. **Transaction Categorization AI**: Automatic transaction categorization
15. **Bill Reminders**: Reminders for upcoming bills and payments

## Contributing

This is a demonstration project. If you'd like to extend it:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all features work on mobile and desktop
5. Test error handling and edge cases
6. Submit a pull request

## License

This project is for demonstration purposes.

## Acknowledgments

Built with modern web technologies and best practices for a smooth, accessible user experience.
