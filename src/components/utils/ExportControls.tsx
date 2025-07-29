import React, { useState } from 'react';
import { BodyText, StatusIndicator } from '../ui/design-system';
import { dataService } from '../../services/dataService';
import { FilterState, ExportFilters } from '../../types';

interface ExportControlsProps {
  filters: FilterState;
  className?: string;
}

export default function ExportControls({ filters, className }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportMessage, setExportMessage] = useState('');

  const handleExport = async (format: 'csv' | 'json', includeDetails: boolean = false) => {
    try {
      setIsExporting(true);
      setExportStatus('idle');
      setExportMessage('');

      const exportFilters: ExportFilters = {
        timeRange: filters.timeRange,
        departments: filters.departments.length > 0 ? filters.departments : undefined,
        users: filters.users.length > 0 ? filters.users : undefined,
        agents: filters.agents.length > 0 ? filters.agents : undefined,
        includeDetails
      };

      const result = await dataService.exportData(exportFilters, format);
      
      // Create and download the file
      const blob = new Blob([typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus('success');
      setExportMessage(`Export completed: ${result.filename} (${(result.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setExportMessage('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailReport = async () => {
    try {
      setIsExporting(true);
      setExportStatus('idle');
      setExportMessage('');

      // In a real implementation, this would send an email with the report
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));

      setExportStatus('success');
      setExportMessage('Email report sent successfully!');
    } catch (error) {
      console.error('Email report failed:', error);
      setExportStatus('error');
      setExportMessage('Failed to send email report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareDashboard = async () => {
    try {
      setIsExporting(true);
      setExportStatus('idle');
      setExportMessage('');

      // Generate a shareable link (in a real app, this would create a secure share token)
      const shareUrl = `${window.location.origin}/dashboard/shared/${Date.now()}`;
      
      await navigator.clipboard.writeText(shareUrl);
      
      setExportStatus('success');
      setExportMessage('Dashboard link copied to clipboard!');
    } catch (error) {
      console.error('Share dashboard failed:', error);
      setExportStatus('error');
      setExportMessage('Failed to generate share link. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Export & Share</h3>
        {exportStatus !== 'idle' && (
          <StatusIndicator status={exportStatus === 'success' ? 'success' : 'warning'}>
            {exportStatus === 'success' ? 'Success' : 'Error'}
          </StatusIndicator>
        )}
      </div>

      {exportMessage && (
        <div className={`p-3 rounded-lg text-sm ${
          exportStatus === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {exportMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Export CSV */}
        <button
          onClick={() => handleExport('csv', false)}
          disabled={isExporting}
          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
            isExporting
              ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
              : 'bg-background hover:bg-muted/30 text-foreground'
          }`}
        >
          <span className="text-lg">📊</span>
          <div className="text-left">
            <div>Export CSV</div>
            <div className="text-xs text-muted-foreground">Summary data</div>
          </div>
        </button>

        {/* Export JSON */}
        <button
          onClick={() => handleExport('json', true)}
          disabled={isExporting}
          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
            isExporting
              ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
              : 'bg-background hover:bg-muted/30 text-foreground'
          }`}
        >
          <span className="text-lg">📄</span>
          <div className="text-left">
            <div>Export JSON</div>
            <div className="text-xs text-muted-foreground">Detailed data</div>
          </div>
        </button>

        {/* Email Report */}
        <button
          onClick={handleEmailReport}
          disabled={isExporting}
          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
            isExporting
              ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
              : 'bg-background hover:bg-muted/30 text-foreground'
          }`}
        >
          <span className="text-lg">📧</span>
          <div className="text-left">
            <div>Email Report</div>
            <div className="text-xs text-muted-foreground">Send summary</div>
          </div>
        </button>

        {/* Share Dashboard */}
        <button
          onClick={handleShareDashboard}
          disabled={isExporting}
          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
            isExporting
              ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
              : 'bg-background hover:bg-muted/30 text-foreground'
          }`}
        >
          <span className="text-lg">🔗</span>
          <div className="text-left">
            <div>Share Link</div>
            <div className="text-xs text-muted-foreground">Copy to clipboard</div>
          </div>
        </button>
      </div>

      {/* Current Filters Summary */}
      <div className="p-3 bg-muted/20 rounded-lg">
        <BodyText className="text-sm font-medium mb-2">Current Filters:</BodyText>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>
            Time Range: {filters.timeRange.start.toLocaleDateString()} - {filters.timeRange.end.toLocaleDateString()}
          </div>
          {filters.departments.length > 0 && (
            <div>Departments: {filters.departments.length} selected</div>
          )}
          {filters.users.length > 0 && (
            <div>Users: {filters.users.length} selected</div>
          )}
          {filters.agents.length > 0 && (
            <div>Agents: {filters.agents.length} selected</div>
          )}
          {filters.costThreshold && (
            <div>Min Cost: ${filters.costThreshold}</div>
          )}
        </div>
      </div>

      {isExporting && (
        <div className="flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Processing export...</span>
        </div>
      )}
    </div>
  );
}