import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, AlertTriangle, Clock, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { HTSChangeTrackerService, HTSChange, HTSSubscription, ChangeNotification } from '@/services/HTSChangeTrackerService';
import { useToast } from '@/components/ui/use-toast';

export const HTSChangeTracker = () => {
  const [recentChanges, setRecentChanges] = useState<HTSChange[]>([]);
  const [subscriptions, setSubscriptions] = useState<HTSSubscription[]>([]);
  const [notifications, setNotifications] = useState<ChangeNotification[]>([]);
  const [newSubscriptionCode, setNewSubscriptionCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [changesResult, subscriptionsResult, notificationsResult] = await Promise.all([
        HTSChangeTrackerService.getRecentChanges(20),
        HTSChangeTrackerService.getUserSubscriptions(),
        HTSChangeTrackerService.getUserNotifications()
      ]);
      
      setRecentChanges(changesResult);
      setSubscriptions(subscriptionsResult);
      setNotifications(notificationsResult);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load HTS change data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!newSubscriptionCode.trim()) {
      toast({
        title: "Invalid HS Code",
        description: "Please enter a valid HS code",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await HTSChangeTrackerService.subscribeToHTSCode(newSubscriptionCode.trim());
      
      if (success) {
        toast({
          title: "Subscription Added",
          description: `You will now receive notifications for changes to ${newSubscriptionCode}`,
        });
        setNewSubscriptionCode('');
        loadData(); // Refresh subscriptions
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      toast({
        title: "Subscription Error",
        description: "Failed to subscribe to HS code changes",
        variant: "destructive",
      });
    }
  };

  const handleUnsubscribe = async (hsCode: string) => {
    try {
      const success = await HTSChangeTrackerService.unsubscribeFromHTSCode(hsCode);
      
      if (success) {
        toast({
          title: "Unsubscribed",
          description: `Notifications for ${hsCode} have been disabled`,
        });
        loadData(); // Refresh subscriptions
      } else {
        throw new Error('Unsubscribe failed');
      }
    } catch (error) {
      toast({
        title: "Unsubscribe Error",
        description: "Failed to unsubscribe from HS code changes",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const success = await HTSChangeTrackerService.markNotificationAsRead(notificationId);
      
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'NEW': return 'default';
      case 'MODIFIED': return 'secondary';
      case 'DELETED': return 'destructive';
      case 'RATE_CHANGE': return 'default';
      case 'DESCRIPTION_CHANGE': return 'secondary';
      default: return 'secondary';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            HTS Change Tracker
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Track changes to Harmonized Tariff Schedule codes and receive notifications
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="changes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="changes">Recent Changes</TabsTrigger>
          <TabsTrigger value="subscriptions">My Subscriptions</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="changes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent HTS Changes</CardTitle>
              <CardDescription>
                Latest updates to the Harmonized Tariff Schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading changes...</div>
              ) : recentChanges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent changes found
                </div>
              ) : (
                <div className="space-y-4">
                  {recentChanges.map((change) => {
                    const impact = HTSChangeTrackerService.getImpactAssessment(change);
                    
                    return (
                      <Card key={change.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={getChangeTypeColor(change.changeType)}>
                                  {change.changeType.replace('_', ' ')}
                                </Badge>
                                <Badge variant={getImpactColor(change.impact)}>
                                  {change.impact} Impact
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {change.hsCode}
                                </span>
                              </div>
                              
                              <h4 className="font-medium">{change.description}</h4>
                              
                              {(change.oldValue || change.newValue) && (
                                <div className="text-sm space-y-1">
                                  {change.oldValue && (
                                    <div className="text-muted-foreground">
                                      <span className="font-medium">From:</span> {change.oldValue}
                                    </div>
                                  )}
                                  {change.newValue && (
                                    <div className="text-green-600 dark:text-green-400">
                                      <span className="font-medium">To:</span> {change.newValue}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Effective: {formatDate(change.effectiveDate)}
                                </span>
                                <span>{change.revision}</span>
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSubscribe()}
                                className="whitespace-nowrap"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Subscribe
                              </Button>
                            </div>
                          </div>
                          
                          <Alert className="mt-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-1">
                                <p className="font-medium">{impact.description}</p>
                                <div className="text-sm">
                                  <span className="font-medium">Recommendations:</span>
                                  <ul className="mt-1 ml-4">
                                    {impact.recommendations.map((rec, index) => (
                                      <li key={index} className="list-disc">{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Subscription</CardTitle>
              <CardDescription>
                Subscribe to receive notifications when an HS code changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter HS Code (e.g., 8215.20.0000)"
                  value={newSubscriptionCode}
                  onChange={(e) => setNewSubscriptionCode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSubscribe}>
                  <Plus className="h-4 w-4 mr-1" />
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Subscriptions</CardTitle>
              <CardDescription>
                HS codes you're currently monitoring for changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active subscriptions
                </div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((subscription) => (
                    <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{subscription.hsCode}</div>
                        <div className="text-sm text-muted-foreground">
                          Notifications: {subscription.notificationTypes.join(', ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Subscribed: {formatDate(subscription.createdAt)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnsubscribe(subscription.hsCode)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Unsubscribe
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Notifications</CardTitle>
              <CardDescription>
                Updates for your subscribed HS codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border rounded-lg ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getChangeTypeColor(notification.change.changeType)}>
                              {notification.change.changeType.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getImpactColor(notification.change.impact)}>
                              {notification.change.impact}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {notification.change.hsCode}
                            </span>
                            {!notification.isRead && (
                              <Badge variant="destructive" className="text-xs">New</Badge>
                            )}
                          </div>
                          
                          <p className="font-medium">{notification.change.description}</p>
                          
                          <div className="text-sm text-muted-foreground">
                            {formatDate(notification.createdAt)}
                          </div>
                        </div>
                        
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};