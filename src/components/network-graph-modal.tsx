'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NetworkGraph } from '@/components/network-graph';
import { useNetworkGraph } from '@/hooks/use-network-graph';
import { X, Network } from 'lucide-react';

interface NetworkGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NetworkGraphModal({ isOpen, onClose }: NetworkGraphModalProps) {
  const { data: networkData, isLoading: loadingNetwork } = useNetworkGraph();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border rounded-lg shadow-xl w-[95vw] h-[90vh] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Contact Network</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4">
          <div className="h-full border rounded-lg bg-background">
            <NetworkGraph data={networkData} isLoading={loadingNetwork} compact={false} />
          </div>
        </div>
        
        {/* Footer with stats */}
        {networkData && (
          <div className="p-4 border-t bg-muted/30">
            <div className="text-center text-sm text-muted-foreground">
              Showing {networkData.nodes.length} contacts with {networkData.edges.length} connections based on shared emails and meetings
            </div>
          </div>
        )}
      </div>
    </div>
  );
}