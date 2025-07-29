import React, { useState } from 'react';
import { BodyText } from '../ui/design-system';

interface ContextualActionsProps {
  value: number;
  type: 'cost' | 'usage' | 'budget';
  label: string;
  onViewDetails?: () => void;
  onSetAlert?: (threshold: number) => void;
  onComparePeriods?: () => void;
  onExportData?: () => void;
  className?: string;
}

export default function ContextualActions({
  value,
  type,
  label,
  onViewDetails,
  onSetAlert,
  onComparePeriods,
  onExportData,
  className
}: ContextualActionsProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(value * 1.1);

  const formatValue = (val: number) => {
    switch (type) {
      case 'cost':
      case 'budget':
        return `$${val.toFixed(2)}`;
      case 'usage':
        return val.toLocaleString();
      default:
        return val.toString();
    }
  };

  const handleSetAlert = () => {
    if (onSetAlert) {
      onSetAlert(alertThreshold);
      setShowAlertForm(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className="group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="font-mono font-medium text-primary border-b border-dotted border-primary/50 hover:border-primary transition-colors">
          {formatValue(value)}
        </span>
        
        {/* Hover Menu */}
        {isHovered && (
          <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-lg border border-border p-2">
            <div className="space-y-1">
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                {label}: {formatValue(value)}
              </div>
              
              {onViewDetails && (
                <button
                  onClick={onViewDetails}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-md transition-colors"
                >
                  👁️ View Details
                </button>
              )}
              
              {onSetAlert && (
                <button
                  onClick={() => setShowAlertForm(true)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-md transition-colors"
                >
                  🔔 Set Alert
                </button>
              )}
              
              {onComparePeriods && (
                <button
                  onClick={onComparePeriods}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-md transition-colors"
                >
                  📊 Compare Periods
                </button>
              )}
              
              {onExportData && (
                <button
                  onClick={onExportData}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-md transition-colors"
                >
                  📤 Export Data
                </button>
              )}
            </div>
            
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
          </div>
        )}
      </div>

      {/* Alert Form Modal */}
      {showAlertForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Set Alert Threshold</h3>
                <button
                  onClick={() => setShowAlertForm(false)}
                  className="text-muted-foreground hover:text-primary"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Current Value
                  </label>
                  <div className="px-3 py-2 bg-muted/20 rounded-md text-sm">
                    {formatValue(value)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Alert Threshold
                  </label>
                  <div className="flex items-center gap-2">
                    {(type === 'cost' || type === 'budget') && (
                      <span className="text-sm text-muted-foreground">$</span>
                    )}
                    <input
                      type="number"
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
                      className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                      step={type === 'cost' || type === 'budget' ? '0.01' : '1'}
                      min="0"
                    />
                  </div>
                  <BodyText className="text-xs text-muted-foreground mt-1">
                    You'll be notified when {type} exceeds this threshold
                  </BodyText>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleSetAlert}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
                >
                  Set Alert
                </button>
                <button
                  onClick={() => setShowAlertForm(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}