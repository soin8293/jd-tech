
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Globe, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  RefreshCw 
} from "lucide-react";

interface APIEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  lastResponseTime: number;
  status: 'healthy' | 'slow' | 'error';
  successRate: number;
  averageResponseTime: number;
}

export const APIResponseTracker: React.FC = () => {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([
    {
      name: 'Create Payment Intent',
      url: '/createPaymentIntent',
      method: 'POST',
      lastResponseTime: 0,
      status: 'healthy',
      successRate: 100,
      averageResponseTime: 0
    },
    {
      name: 'Process Booking',
      url: '/processBooking',
      method: 'POST',
      lastResponseTime: 0,
      status: 'healthy',
      successRate: 100,
      averageResponseTime: 0
    },
    {
      name: 'Room Availability',
      url: '/rooms',
      method: 'GET',
      lastResponseTime: 0,
      status: 'healthy',
      successRate: 100,
      averageResponseTime: 0
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [overallStats, setOverallStats] = useState({
    averageResponseTime: 0,
    successRate: 0,
    totalRequests: 0
  });

  const testAPIEndpoint = async (endpoint: APIEndpoint): Promise<APIEndpoint> => {
    console.log(`🌐 API_TRACKER: Testing ${endpoint.name}...`);
    
    try {
      const startTime = performance.now();
      
      // Simulate API call based on endpoint
      let response;
      if (endpoint.name === 'Create Payment Intent') {
        // Test with minimal valid data
        response = await fetch('https://us-central1-jd-suites-backend.cloudfunctions.net/createPaymentIntent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              rooms: [{ id: 'test', name: 'Test Room', price: 100 }],
              period: { checkIn: new Date().toISOString(), checkOut: new Date().toISOString() },
              guests: 1,
              transaction_id: `health_check_${Date.now()}`,
              currency: 'usd'
            }
          })
        });
      } else {
        // For other endpoints, just check if they exist
        response = { ok: false, status: 404 }; // Simulate not found for now
      }
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      let status: 'healthy' | 'slow' | 'error' = 'healthy';
      if (!response.ok) {
        status = 'error';
      } else if (responseTime > 2000) {
        status = 'slow';
      }
      
      return {
        ...endpoint,
        lastResponseTime: responseTime,
        status,
        successRate: response.ok ? 100 : 0,
        averageResponseTime: responseTime
      };
      
    } catch (error) {
      console.error(`🌐 API_TRACKER: ${endpoint.name} test failed:`, error);
      return {
        ...endpoint,
        lastResponseTime: 0,
        status: 'error',
        successRate: 0,
        averageResponseTime: 0
      };
    }
  };

  const testAllEndpoints = async () => {
    setIsLoading(true);
    console.log('🌐 API_TRACKER: Testing all API endpoints...');
    
    try {
      const results = await Promise.all(
        endpoints.map(endpoint => testAPIEndpoint(endpoint))
      );
      
      setEndpoints(results);
      
      // Calculate overall stats
      const totalResponseTime = results.reduce((sum, ep) => sum + ep.averageResponseTime, 0);
      const totalSuccessRate = results.reduce((sum, ep) => sum + ep.successRate, 0);
      
      setOverallStats({
        averageResponseTime: totalResponseTime / results.length,
        successRate: totalSuccessRate / results.length,
        totalRequests: results.length
      });
      
      console.log('🌐 API_TRACKER: All endpoints tested:', results);
      
    } catch (error) {
      console.error('🌐 API_TRACKER: Endpoint testing failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testAllEndpoints();
    
    // Test every 2 minutes
    const interval = setInterval(testAllEndpoints, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'slow': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'slow': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              API Response Time Tracker
            </CardTitle>
            <CardDescription>
              Monitor API endpoint performance and response times
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={testAllEndpoints}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Test All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{overallStats.averageResponseTime.toFixed(0)}ms</div>
            <div className="text-sm text-muted-foreground">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{overallStats.successRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{overallStats.totalRequests}</div>
            <div className="text-sm text-muted-foreground">Endpoints Monitored</div>
          </div>
        </div>
        
        {/* Individual Endpoints */}
        <div className="space-y-3">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(endpoint.status)}
                <div>
                  <div className="font-medium">{endpoint.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {endpoint.method} {endpoint.url}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-medium">{endpoint.lastResponseTime.toFixed(0)}ms</div>
                  <div className="text-sm text-muted-foreground">
                    {endpoint.successRate.toFixed(0)}% success
                  </div>
                </div>
                <Badge variant={getStatusColor(endpoint.status) as any}>
                  {endpoint.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
