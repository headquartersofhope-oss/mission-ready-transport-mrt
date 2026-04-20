import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Copy, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AppAssistant({ userRole = 'dispatcher' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [briefData, setBriefData] = useState(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const generateBrief = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('aiAssistant', { userRole });
      setBriefData(response.data);
    } catch (error) {
      toast.error('Failed to generate brief');
    } finally {
      setLoading(false);
    }
  };

  const copyFullBrief = () => {
    if (briefData?.fullBrief) {
      navigator.clipboard.writeText(briefData.fullBrief);
      toast.success('Brief copied to clipboard');
    }
  };

  const handleBriefClaude = () => {
    if (briefData?.fullBrief) {
      window.open(`https://claude.ai`, '_blank');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest('[data-assistant-trigger]')) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* Floating Button */}
      <button
        data-assistant-trigger
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && !briefData) generateBrief();
        }}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40 active:scale-95"
        title="AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Brief Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-6 w-96 bg-card border border-border/60 rounded-lg shadow-2xl z-50 p-6 max-h-96 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">MRT Live Report</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : briefData ? (
            <>
              <div className="text-xs text-muted-foreground mb-4 whitespace-pre-wrap leading-relaxed">
                {briefData.briefSummary}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleBriefClaude}
                  className="flex-1 text-xs"
                >
                  Brief Claude
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyFullBrief}
                  className="flex-1 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={generateBrief}
              className="w-full"
              disabled={loading}
            >
              Generate Brief
            </Button>
          )}
        </div>
      )}
    </>
  );
}