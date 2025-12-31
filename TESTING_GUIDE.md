# Testing Guide - Mini Wallet Dashboard

## ✅ Requirements Verification

All requirements have been implemented:

1. ✅ **Transactions List** - Shows date, merchant, category, amount, running balance
2. ✅ **Transfer Form** - Validates inputs, optimistic updates, rollback on error
3. ✅ **Filters/Search** - Category filter, date range, merchant search
4. ✅ **State Management** - Zustand store (fast, no infinite loops)
5. ✅ **Accessibility** - Semantic HTML, ARIA labels, keyboard navigation
6. ✅ **Responsive** - Works from 360px to desktop
7. ✅ **Security** - No console logs, proper error handling
8. ✅ **Routes** - `/` (dashboard) and `/transfer`
9. ✅ **Data Files** - `accounts.json` and `transactions.json`

---

## 🧪 Manual Testing Checklist

### 1. **Dashboard Page (`/`)**

#### ✅ Data Loading
- [ok ] Open `http://localhost:5173/`
- [ok ] See "Loading..." briefly
- [ ok] Accounts load and display (Main Account: $56,295.67, Savings: $15,000.00)
- [ ok] Transactions table displays with 10 transactions
- [ ] Running balances are calculated and displayed correctly

#### ✅ Account Summary Cards
- [ ] Current Balance card shows correct amount
- [ ] Account Type card shows "Checking" or "Savings"
- [ ] Cards are responsive (stack on mobile, side-by-side on desktop)

#### ✅ Transaction Table
- [ ] All columns visible: Date, Transaction Type, Currency, Amount, Running Balance
- [ ] Transactions sorted by date (newest first)
- [ ] Credit transactions show green, debit shows red
- [ ] Running balance decreases for debits, increases for credits
- [ ] Table is scrollable on mobile

#### ✅ Filters
- [ ] **Category Filter**: Select a category (e.g., "Food") → Only that category shows
- [ ] **Date From**: Select a date → Only transactions from that date forward show
- [ ] **Date To**: Select a date → Only transactions up to that date show
- [ ] **Clear Filters**: Click "Clear Filters" → All filters reset, all transactions show
- [ ] Multiple filters work together (AND logic)

#### ✅ Search
- [ ] Type in search bar (e.g., "Paypal") → Only matching merchants show
- [ ] Search is case-insensitive
- [ ] Clear search → All transactions show again

---

### 2. **Transfer Form (`/transfer`)**

#### ✅ Navigation
- [ ] Click "Fund Transfer" in sidebar → Navigate to `/transfer`
- [ ] Or manually go to `http://localhost:5173/transfer`

#### ✅ Form Display
- [ ] Form shows: From Account, To Account, Amount fields
- [ ] Dropdowns show account names and balances
- [ ] "To Account" excludes the selected "From Account"

#### ✅ Validation Tests

**Test 1: Positive Decimal Validation**
- [ ] Enter negative number (e.g., "-100") → Error: "Amount must be a positive number"
- [ ] Enter "0" → Error: "Amount must be a positive number"
- [ ] Enter "0.00" → Error: "Amount must be a positive number"
- [ ] Enter "100.123" (3 decimal places) → Error: "Amount can have at most 2 decimal places"
- [ ] Enter "100.12" (2 decimal places) → ✅ Valid

**Test 2: Sufficient Balance**
- [ ] Select Main Account (balance: $56,295.67)
- [ ] Enter amount greater than balance (e.g., "60000") → Error: "Insufficient balance"
- [ ] Enter amount less than balance (e.g., "100") → ✅ Valid

**Test 3: Same Account Transfer**
- [ ] Select same account for "From" and "To" → Error: "Cannot transfer to the same account"

**Test 4: Empty Fields**
- [ ] Try to submit with empty fields → Validation errors appear
- [ ] All required fields are marked

#### ✅ Optimistic Updates
- [ ] Fill form: Main → Savings, Amount: $100
- [ ] Click "Transfer Money"
- [ ] **IMMEDIATELY** check:
  - [ ] Main Account balance decreases by $100 (optimistic update)
  - [ ] Savings Account balance increases by $100 (optimistic update)
  - [ ] Button shows "Processing..." and is disabled
- [ ] After ~500ms, navigate to dashboard
- [ ] Verify:
  - [ ] New transactions appear in table (2 new: debit from Main, credit to Savings)
  - [ ] Balances are correct
  - [ ] Running balances recalculated correctly

#### ✅ Error Handling & Rollback
- [ ] To test rollback, you can temporarily modify the code to simulate an error
- [ ] On error:
  - [ ] Balances revert to original values
  - [ ] Error message displays (user-friendly, no internal details)
  - [ ] Form is re-enabled
  - [ ] No transactions added

#### ✅ Form Security
- [ ] Open browser DevTools → Console tab
- [ ] Fill form with sensitive data
- [ ] Submit form
- [ ] **Verify**: No console.log statements output form data
- [ ] Error messages don't expose internal implementation details

---

### 3. **State Management Testing**

#### ✅ Zustand Store Performance
- [ ] Open React DevTools (if installed)
- [ ] Navigate between pages → No infinite loops
- [ ] Filter transactions → Fast, no lag
- [ ] Add transaction → State updates immediately
- [ ] No console errors about "Maximum update depth exceeded"

#### ✅ State Persistence
- [ ] Make a transfer
- [ ] Navigate to dashboard
- [ ] Navigate back to transfer
- [ ] **Verify**: Account balances persist (not reset)
- [ ] **Verify**: Transactions persist

#### ✅ Running Balance Calculation
- [ ] Check first transaction (oldest) → Running balance should be correct
- [ ] Check last transaction (newest) → Running balance should equal current account balance (approximately)
- [ ] Make a transfer → Running balances recalculate correctly for all transactions

---

### 4. **Accessibility Testing**

#### ✅ Keyboard Navigation
- [ ] Press `Tab` → Focus moves through all interactive elements
- [ ] Press `Enter` on buttons → Actions trigger
- [ ] Press `Space` on buttons → Actions trigger
- [ ] Navigate entire form using only keyboard → All fields accessible

#### ✅ Screen Reader (if available)
- [ ] Use screen reader (NVDA/JAWS/VoiceOver)
- [ ] All form fields have labels
- [ ] Buttons have descriptive text
- [ ] Error messages are announced

#### ✅ Semantic HTML
- [ ] View page source → Uses `<nav>`, `<main>`, `<table>`, `<form>`, etc.
- [ ] Headings are in order (h1, h2, etc.)

---

### 5. **Responsive Design Testing**

#### ✅ Mobile (360px)
- [ ] Open DevTools → Toggle device toolbar
- [ ] Set to 360px width
- [ ] **Verify**:
  - [ ] Sidebar is hidden (hamburger menu visible)
  - [ ] Cards stack vertically
  - [ ] Table is horizontally scrollable
  - [ ] Filters stack vertically
  - [ ] All text is readable
  - [ ] Buttons are tappable (not too small)

#### ✅ Tablet (768px)
- [ ] Set to 768px width
- [ ] **Verify**:
  - [ ] Sidebar visible or accessible
  - [ ] Cards side-by-side
  - [ ] Table fits well
  - [ ] Filters in row layout

#### ✅ Desktop (1920px)
- [ ] Set to 1920px width
- [ ] **Verify**:
  - [ ] Sidebar always visible
  - [ ] Content centered/well-spaced
  - [ ] No excessive whitespace
  - [ ] All elements properly sized

---

### 6. **Edge Cases & Error Scenarios**

#### ✅ Network Errors
- [ ] Disable network in DevTools
- [ ] Refresh page
- [ ] **Verify**: Error message displays (user-friendly)
- [ ] Re-enable network → Refresh → Data loads

#### ✅ Empty States
- [ ] If transactions.json is empty → "No transactions found" displays
- [ ] If accounts.json is empty → Handles gracefully

#### ✅ Invalid Data
- [ ] Modify transactions.json with invalid date → Handles gracefully
- [ ] Modify accounts.json with negative balance → Displays correctly

---

## 🚀 Quick Test Script

Run through this quick test in order:

1. **Start app**: `npm run dev`
2. **Dashboard loads**: See accounts and transactions
3. **Test search**: Type "Paypal" → 2 transactions show
4. **Test filter**: Select "Food" category → 1 transaction shows
5. **Clear filters**: Click "Clear Filters" → All transactions show
6. **Navigate to transfer**: Click "Fund Transfer" in sidebar
7. **Test validation**: 
   - Try negative number → Error
   - Try 3 decimal places → Error
   - Try amount > balance → Error
8. **Make valid transfer**: Main → Savings, $50
9. **Verify optimistic update**: Balances update immediately
10. **Check dashboard**: New transactions appear, balances correct
11. **Test responsive**: Resize browser → Layout adapts
12. **Test keyboard**: Tab through form → All accessible

---

## ✅ State Management Verification

### Why Zustand is Fast & Error-Free:

1. **No Infinite Loops**: 
   - Running balance calculated inline in state updates
   - No recursive function calls
   - Memoized selectors prevent unnecessary recalculations

2. **Performance**:
   - Only components using changed state re-render
   - `useMemo` prevents expensive recalculations
   - Single source of truth

3. **Type Safety**:
   - Full TypeScript support
   - Compile-time error checking

### How to Verify State Management:

1. **Open Browser Console**:
   - No errors about "Maximum update depth"
   - No warnings about "getSnapshot should be cached"

2. **Performance**:
   - Filtering is instant (no lag)
   - Transfers update immediately
   - No unnecessary re-renders

3. **React DevTools Profiler** (if installed):
   - Components only re-render when their data changes
   - No excessive renders

---

## 🐛 Common Issues & Solutions

### Issue: "Transactions not showing"
- **Check**: Browser console for errors
- **Check**: `public/transactions.json` exists and is valid JSON
- **Check**: Network tab → Is `/transactions.json` loading (200 status)?

### Issue: "Running balance incorrect"
- **Check**: Account balances in `accounts.json` match displayed balances
- **Check**: Transactions are sorted correctly (newest first for display)

### Issue: "Transfer not working"
- **Check**: Both accounts selected
- **Check**: Amount is valid (positive, max 2 decimals, sufficient balance)
- **Check**: Browser console for errors

### Issue: "Filters not working"
- **Check**: Search is case-sensitive? (Should be case-insensitive)
- **Check**: Date filters: Ensure "From" date is before "To" date

---

## 📊 Performance Benchmarks

Expected performance:
- **Initial load**: < 1 second
- **Filter/search**: < 100ms (instant)
- **Transfer**: < 500ms (optimistic update)
- **Navigation**: < 50ms (client-side routing)

---

## ✅ Final Checklist Before Submission

- [ ] All requirements implemented
- [ ] No console errors
- [ ] No infinite loops
- [ ] Responsive on mobile (360px)
- [ ] Responsive on desktop (1920px)
- [ ] Keyboard navigation works
- [ ] Form validation works
- [ ] Optimistic updates work
- [ ] Running balance correct
- [ ] README.md complete
- [ ] Code is clean and commented
- [ ] No sensitive data in console
- [ ] Error messages are user-friendly

---

**🎉 If all tests pass, you're ready to submit!**

