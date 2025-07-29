import React from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Card } from '../components/ui/card';

interface BlankPageProps {
  className?: string;
}

export default function BlankPage({ className }: BlankPageProps) {
  return (
    <DashboardLayout className={className}>
      {/* Header */}
      <div className="col-span-12 mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
          New Page
        </h1>
        <p className="text-base text-secondary max-w-3xl">
          This is a blank page ready for your content
        </p>
      </div>

      {/* Main Content Area */}
      <div className="col-span-12">
        <Card className="p-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Ready to build something amazing?
            </h2>
            <p className="text-gray-600 mb-6">
              This blank page is set up with the dashboard layout and ready for your content.
            </p>
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
              <span className="text-2xl text-gray-400">+</span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
} 