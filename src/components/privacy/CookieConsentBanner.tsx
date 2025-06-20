
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCookieConsent, CookiePreferences } from '@/hooks/useCookieConsent';
import { Cookie, Settings } from 'lucide-react';

const CookieConsentBanner: React.FC = () => {
  const { showBanner, preferences, acceptAll, acceptNecessary, savePreferences } = useCookieConsent();
  const [tempPreferences, setTempPreferences] = useState<CookiePreferences>(preferences);
  const [showSettings, setShowSettings] = useState(false);

  if (!showBanner) return null;

  const handleSaveCustomPreferences = () => {
    savePreferences(tempPreferences);
    setShowSettings(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="bg-white border-t shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Cookie className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Cookie Preferences</h3>
              <p className="text-sm text-gray-600 mb-4">
                We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                You can customize your preferences or accept all cookies.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={acceptAll} size="sm">
                  Accept All
                </Button>
                <Button onClick={acceptNecessary} variant="outline" size="sm">
                  Necessary Only
                </Button>
                
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Settings className="w-4 h-4" />
                      Customize
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Cookie Preferences</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="necessary" className="font-medium">Necessary Cookies</Label>
                          <p className="text-xs text-gray-500">Required for basic site functionality</p>
                        </div>
                        <Switch id="necessary" checked={true} disabled />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="analytics" className="font-medium">Analytics Cookies</Label>
                          <p className="text-xs text-gray-500">Help us understand site usage</p>
                        </div>
                        <Switch
                          id="analytics"
                          checked={tempPreferences.analytics}
                          onCheckedChange={(checked) => 
                            setTempPreferences(prev => ({ ...prev, analytics: checked }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="marketing" className="font-medium">Marketing Cookies</Label>
                          <p className="text-xs text-gray-500">Personalize ads and content</p>
                        </div>
                        <Switch
                          id="marketing"
                          checked={tempPreferences.marketing}
                          onCheckedChange={(checked) => 
                            setTempPreferences(prev => ({ ...prev, marketing: checked }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="preferences" className="font-medium">Preference Cookies</Label>
                          <p className="text-xs text-gray-500">Remember your settings</p>
                        </div>
                        <Switch
                          id="preferences"
                          checked={tempPreferences.preferences}
                          onCheckedChange={(checked) => 
                            setTempPreferences(prev => ({ ...prev, preferences: checked }))
                          }
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-6">
                      <Button onClick={handleSaveCustomPreferences} className="flex-1">
                        Save Preferences
                      </Button>
                      <Button onClick={() => setShowSettings(false)} variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsentBanner;
