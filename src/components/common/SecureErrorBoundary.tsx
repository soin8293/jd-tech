import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Shield } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

export class SecureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorId: this.generateErrorId()
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sanitize error information before logging
    const sanitizedError = {
      message: this.sanitizeErrorMessage(error.message),
      stack: error.stack ? this.sanitizeStackTrace(error.stack) : 'No stack trace available',
      componentStack: errorInfo.componentStack ? this.sanitizeStackTrace(errorInfo.componentStack) : 'No component stack',
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('🔒 SECURE ERROR BOUNDARY:', sanitizedError);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to secure logging service
    if (process.env.NODE_ENV === 'production') {
      this.logToSecureService(sanitizedError);
    }
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove potential sensitive information from error messages
    return message
      .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL_REDACTED]')
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]')
      .replace(/\btoken[=:]\s*[\w\.-]+/gi, 'token=[TOKEN_REDACTED]')
      .replace(/\bapi[_-]?key[=:]\s*[\w\.-]+/gi, 'api_key=[KEY_REDACTED]');
  }

  private sanitizeStackTrace(stack: string): string {
    // Remove file paths and keep only relevant error information
    return stack
      .split('\n')
      .map(line => line.replace(/file:\/\/.*?\/([^\/]+:\d+:\d+)/, '$1'))
      .join('\n');
  }

  private logToSecureService(errorData: any) {
    // This would integrate with a secure logging service like Sentry
    try {
      sessionStorage.setItem(`error_${errorData.errorId}`, JSON.stringify(errorData));
    } catch (storageError) {
      console.error('Failed to store error data:', storageError);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: undefined,
      errorId: this.generateErrorId()
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Show user-friendly error message without exposing sensitive details
      const userMessage = process.env.NODE_ENV === 'development' 
        ? this.state.error?.message 
        : 'An unexpected error occurred. Our team has been notified.';

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                {userMessage}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-2 text-xs opacity-75">
                    Error ID: {this.state.errorId}
                  </div>
                )}
              </AlertDescription>
              <div className="mt-4 flex gap-2">
                <Button onClick={this.handleReset} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                {process.env.NODE_ENV === 'development' && (
                  <Button 
                    onClick={() => console.log(this.state.error)} 
                    variant="ghost" 
                    size="sm"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Log Details
                  </Button>
                )}
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
