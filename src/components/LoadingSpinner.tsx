'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 ${sizeClasses[size]}`}></div>
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-1/2 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-full"></div>
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
      <div className="bg-gray-200 h-6 rounded mb-2"></div>
      <div className="bg-gray-200 h-4 rounded w-3/4 mb-4"></div>
      <div className="flex items-center space-x-4">
        <div className="bg-gray-200 h-8 w-8 rounded-full"></div>
        <div className="bg-gray-200 h-4 w-24 rounded"></div>
        <div className="bg-gray-200 h-4 w-16 rounded"></div>
      </div>
    </div>
  );
}
