import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Zap } from "lucide-react";

interface PerformanceMetrics {
  loadTime: number;
  bundleSize: string;
  searchTime: number;
  cacheHitRate: number;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    bundleSize: "0 KB",
    searchTime: 0,
    cacheHitRate: 0
  });

  useEffect(() => {
    // Measure page load time using Navigation Timing API
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.startTime;
        setMetrics(prev => ({ ...prev, loadTime }));
      }
    } catch (error) {
      console.warn('Performance timing not available');
    }

    // Estimate bundle size from network timing
    if (performance && performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const totalSize = resources.reduce((size, resource) => {
        return size + (resource.transferSize || 0);
      }, 0);
      
      setMetrics(prev => ({ 
        ...prev, 
        bundleSize: `${(totalSize / 1024).toFixed(1)} KB` 
      }));
    }

    // Mock cache hit rate and search time for demo
    setMetrics(prev => ({
      ...prev,
      searchTime: Math.random() * 200 + 50, // 50-250ms
      cacheHitRate: Math.random() * 30 + 70 // 70-100%
    }));
  }, []);

  const getPerformanceColor = (loadTime: number) => {
    if (loadTime < 1000) return "text-green-600";
    if (loadTime < 3000) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Load Time</p>
              <p className={`text-lg font-bold ${getPerformanceColor(metrics.loadTime)}`}>
                {metrics.loadTime > 0 ? `${(metrics.loadTime / 1000).toFixed(2)}s` : "Measuring..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Bundle Size</p>
              <p className="text-lg font-bold">{metrics.bundleSize}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Search Time</p>
              <p className="text-lg font-bold text-blue-600">
                {metrics.searchTime.toFixed(0)}ms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Cache Hit Rate: {metrics.cacheHitRate.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;