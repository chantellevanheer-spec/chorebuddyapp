import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const CSV_TEMPLATE = `title,description,difficulty,category,estimated_time,priority
Vacuum living room,Vacuum all carpets and rugs,medium,living_room,20,medium
Wash dishes,Wash and dry all dirty dishes,easy,kitchen,15,high
Take out trash,Take all trash to outdoor bins,easy,other,5,high`;

export default function BulkImport({ onImportComplete, familyId }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState(null);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chore_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast.error('Please upload a CSV file');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsProcessing(true);
    try {
      // Upload file to get URL
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract data from CSV
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            chores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  category: { type: "string" },
                  estimated_time: { type: "number" },
                  priority: { type: "string", enum: ["low", "medium", "high"] }
                }
              }
            }
          }
        }
      });

      if (result.status === 'error') {
        throw new Error(result.details || 'Failed to parse CSV');
      }

      // Create chores
      const chores = result.output.chores || result.output;
      const validChores = Array.isArray(chores) ? chores : [chores];
      
      for (const chore of validChores) {
        await base44.entities.Chore.create({
          ...chore,
          family_id: familyId,
          auto_assign: true
        });
      }

      toast.success(`Successfully imported ${validChores.length} chores!`);
      onImportComplete();
      setFile(null);
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import chores');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="funky-card p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Upload className="w-6 h-6 text-[#2B59C3]" />
        <h3 className="header-font text-xl text-[#2B59C3]">Bulk Import Chores</h3>
      </div>

      <p className="body-font-light text-sm text-gray-600">
        Upload a CSV file to quickly add multiple chores at once
      </p>

      {/* Download Template */}
      <Button
        onClick={downloadTemplate}
        variant="outline"
        className="funky-button w-full"
      >
        <Download className="w-4 h-4 mr-2" />
        Download CSV Template
      </Button>

      {/* File Upload */}
      <div className="border-2 border-dashed border-[#5E3B85] rounded-xl p-6 text-center">
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="body-font text-sm text-gray-700 mb-1">
            {file ? file.name : 'Click to upload CSV file'}
          </p>
          <p className="body-font-light text-xs text-gray-500">
            CSV format with header row
          </p>
        </label>
      </div>

      {/* Import Button */}
      <Button
        onClick={handleImport}
        disabled={!file || isProcessing}
        className="funky-button bg-[#FF6B35] text-white w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Import Chores
          </>
        )}
      </Button>
    </div>
  );
}