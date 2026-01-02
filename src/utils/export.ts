import type { Transaction } from '../types';
import { formatCurrency } from './validation';
import { format } from 'date-fns';

/**
 * Export transactions to CSV format
 */
export const exportToCSV = (transactions: Transaction[], filename?: string): void => {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  // CSV headers
  const headers = [
    'Date',
    'Time',
    'Merchant',
    'Category',
    'Type',
    'Amount',
    'Balance',
    'Notes',
    'Tags',
    'Transaction ID',
  ];

  // Convert transactions to CSV rows
  const rows = transactions.map((t) => {
    const date = t.timestamp ? new Date(t.timestamp) : new Date(t.date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = t.timestamp ? format(date, 'HH:mm:ss') : '';
    const tagsStr = t.tags ? t.tags.join('; ') : '';
    const notesStr = t.notes ? t.notes.replace(/"/g, '""') : ''; // Escape quotes

    return [
      dateStr,
      timeStr,
      t.merchant.replace(/"/g, '""'), // Escape quotes
      t.category,
      t.type,
      t.amount.toFixed(2),
      t.runningBalance?.toFixed(2) || '',
      notesStr,
      tagsStr,
      t.id,
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export transactions to PDF format
 * Note: This uses jsPDF library - make sure it's installed
 */
export const exportToPDF = async (
  transactions: Transaction[],
  filename?: string
): Promise<void> => {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  try {
    // Dynamic import of jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Set up PDF document
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const startY = 20;
    let currentY = startY;

    // Title
    doc.setFontSize(18);
    doc.text('Transaction Report', margin, currentY);
    currentY += 10;

    // Date range info
    doc.setFontSize(10);
    const dateRange = transactions.length > 0
      ? `${format(new Date(transactions[transactions.length - 1].date), 'MMM d, yyyy')} - ${format(new Date(transactions[0].date), 'MMM d, yyyy')}`
      : 'All Transactions';
    doc.text(`Period: ${dateRange}`, margin, currentY);
    currentY += 5;
    doc.text(`Total Transactions: ${transactions.length}`, margin, currentY);
    currentY += 10;

    // Table headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold' as const);
    const headers = ['Date', 'Merchant', 'Category', 'Type', 'Amount', 'Balance'];
    const colWidths = [25, 60, 35, 20, 25, 25];
    let xPos = margin;

    headers.forEach((header, index) => {
      doc.text(header, xPos, currentY);
      xPos += colWidths[index];
    });

    currentY += 7;
    doc.setFont('helvetica', 'normal' as const);

    // Table rows
    transactions.forEach((transaction) => {
      // Check if we need a new page
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = startY;
        // Redraw headers
        xPos = margin;
        doc.setFont('helvetica', 'bold' as const);
        headers.forEach((header) => {
          doc.text(header, xPos, currentY);
          xPos += colWidths[headers.indexOf(header)];
        });
        currentY += 7;
        doc.setFont('helvetica', 'normal' as const);
      }

      const date = transaction.timestamp
        ? new Date(transaction.timestamp)
        : new Date(transaction.date);
      const dateStr = format(date, 'MMM d, yyyy');
      const merchant = transaction.merchant.length > 25
        ? transaction.merchant.substring(0, 22) + '...'
        : transaction.merchant;
      const category = transaction.category.length > 15
        ? transaction.category.substring(0, 12) + '...'
        : transaction.category;
      const type = transaction.type === 'credit' ? 'Cr' : 'Db';
      const amount = formatCurrency(transaction.amount);
      const balance = transaction.runningBalance
        ? formatCurrency(transaction.runningBalance)
        : 'N/A';

      xPos = margin;
      const rowData = [dateStr, merchant, category, type, amount, balance];
      rowData.forEach((cell, idx) => {
        doc.text(cell, xPos, currentY);
        xPos += colWidths[idx];
      });

      currentY += 6;
    });

    // Summary at the end
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = startY;
    }

    currentY += 5;
    doc.setFont('helvetica', 'bold' as const);
    doc.setFontSize(10);
    doc.text('Summary', margin, currentY);
    currentY += 7;

    doc.setFont('helvetica', 'normal' as const);
    doc.setFontSize(9);
    const totalDebits = transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalCredits - totalDebits;

    doc.text(`Total Debits: ${formatCurrency(totalDebits)}`, margin, currentY);
    currentY += 6;
    doc.text(`Total Credits: ${formatCurrency(totalCredits)}`, margin, currentY);
    currentY += 6;
    doc.setFont('helvetica', 'bold' as const);
    doc.text(`Net Amount: ${formatCurrency(netAmount)}`, margin, currentY);

    // Save PDF
    doc.save(filename || `transactions-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please make sure jsPDF is installed.');
  }
};

/**
 * Generate filename with date range
 */
export const generateExportFilename = (
  transactions: Transaction[],
  fileFormat: 'csv' | 'pdf'
): string => {
  if (transactions.length === 0) {
    return `transactions-${new Date().toISOString().split('T')[0]}.${fileFormat}`;
  }

  const dates = transactions.map((t) => new Date(t.date).getTime()).sort((a, b) => a - b);
  const startDate = format(new Date(dates[0]), 'yyyy-MM-dd');
  const endDate = format(new Date(dates[dates.length - 1]), 'yyyy-MM-dd');

  if (startDate === endDate) {
    return `transactions-${startDate}.${fileFormat}`;
  }

  return `transactions-${startDate}-to-${endDate}.${fileFormat}`;
};

