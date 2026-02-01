import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Table } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Export to CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(key => {
      const value = row[key];
      // Handle values with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  
  toast.success('CSV exported successfully!');
};

// Export to PDF (simple text-based)
export const exportToPDF = async (data, filename, title) => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }

  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text(title || 'Export', 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 20, 30);

    // Simple table layout
    let y = 45;
    const headers = Object.keys(data[0]);
    
    // Headers
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(headers.join('  |  '), 20, y);
    y += 7;

    // Data rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    data.forEach((row, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      const rowText = headers.map(key => String(row[key] || '')).join('  |  ');
      doc.text(rowText.substring(0, 80), 20, y); // Limit to 80 chars
      y += 7;
    });

    doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF exported successfully!');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export PDF');
  }
};

export default function ExportButton({ data, filename = 'export', title = 'Export', variant = 'outline' }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type) => {
    setIsExporting(true);
    try {
      if (type === 'csv') {
        exportToCSV(data, filename);
      } else if (type === 'pdf') {
        await exportToPDF(data, filename, title);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          className="funky-button flex items-center gap-2"
          disabled={isExporting || !data || data.length === 0}
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <Table className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}