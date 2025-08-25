// Service for tracking HTS changes and notifications
import { supabase } from '@/integrations/supabase/client';

export interface HTSChange {
  id: string;
  hsCode: string;
  changeType: 'NEW' | 'MODIFIED' | 'DELETED' | 'RATE_CHANGE' | 'DESCRIPTION_CHANGE';
  oldValue?: string;
  newValue?: string;
  effectiveDate: string;
  revision: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  category?: string;
  chapter: string;
  source: string;
  officialUrl?: string;
}

export interface HTSSubscription {
  id: string;
  userId: string;
  hsCode: string;
  notificationTypes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeNotification {
  id: string;
  userId: string;
  changeId: string;
  isRead: boolean;
  createdAt: string;
  change: HTSChange;
}

export class HTSChangeTrackerService {
  
  /**
   * Get recent HTS changes
   */
  static async getRecentChanges(limit: number = 50): Promise<HTSChange[]> {
    try {
      const { data, error } = await supabase.functions.invoke('hts-change-tracker', {
        body: {
          action: 'get-recent-changes',
          limit
        }
      });

      if (error) {
        console.error('Error fetching HTS changes:', error);
        return [];
      }

      return data.changes || [];
    } catch (error) {
      console.error('Failed to get recent changes:', error);
      return [];
    }
  }

  /**
   * Get changes for specific HTS codes
   */
  static async getChangesForCodes(hsCodes: string[]): Promise<HTSChange[]> {
    try {
      const { data, error } = await supabase.functions.invoke('hts-change-tracker', {
        body: {
          action: 'get-changes-for-codes',
          hsCodes
        }
      });

      if (error) {
        console.error('Error fetching changes for codes:', error);
        return [];
      }

      return data.changes || [];
    } catch (error) {
      console.error('Failed to get changes for codes:', error);
      return [];
    }
  }

  /**
   * Subscribe to HTS code changes
   */
  static async subscribeToHTSCode(
    hsCode: string, 
    notificationTypes: string[] = ['ALL']
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('hts-change-tracker', {
        body: {
          action: 'subscribe',
          hsCode,
          notificationTypes
        }
      });

      if (error) {
        console.error('Error subscribing to HTS changes:', error);
        return false;
      }

      return data.success || false;
    } catch (error) {
      console.error('Failed to subscribe to HTS changes:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from HTS code changes
   */
  static async unsubscribeFromHTSCode(hsCode: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('hts-change-tracker', {
        body: {
          action: 'unsubscribe',
          hsCode
        }
      });

      if (error) {
        console.error('Error unsubscribing from HTS changes:', error);
        return false;
      }

      return data.success || false;
    } catch (error) {
      console.error('Failed to unsubscribe from HTS changes:', error);
      return false;
    }
  }

  /**
   * Get user's subscriptions
   */
  static async getUserSubscriptions(): Promise<HTSSubscription[]> {
    try {
      const { data, error } = await supabase.functions.invoke('hts-change-tracker', {
        body: {
          action: 'get-subscriptions'
        }
      });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
      }

      return data.subscriptions || [];
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      return [];
    }
  }

  /**
   * Get user's notifications
   */
  static async getUserNotifications(
    unreadOnly: boolean = false
  ): Promise<ChangeNotification[]> {
    try {
      const { data, error } = await supabase.functions.invoke('hts-change-tracker', {
        body: {
          action: 'get-notifications',
          unreadOnly
        }
      });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data.notifications || [];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('hts-change-tracker', {
        body: {
          action: 'mark-read',
          notificationId
        }
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return data.success || false;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Process USITC change record document
   */
  static async processChangeRecord(pdfText: string): Promise<HTSChange[]> {
    try {
      const { data, error } = await supabase.functions.invoke('pdf-processor', {
        body: {
          action: 'process-change-record',
          text: pdfText
        }
      });

      if (error) {
        console.error('Error processing change record:', error);
        return [];
      }

      return data.changes || [];
    } catch (error) {
      console.error('Failed to process change record:', error);
      return [];
    }
  }

  /**
   * Get impact assessment for changes
   */
  static getImpactAssessment(change: HTSChange): {
    severity: string;
    description: string;
    recommendations: string[];
  } {
    const assessments = {
      'RATE_CHANGE': {
        severity: 'HIGH',
        description: 'Tariff rate changes directly affect import costs',
        recommendations: [
          'Review current shipments and pending orders',
          'Consider timing of future imports',
          'Update pricing calculations',
          'Notify affected customers or suppliers'
        ]
      },
      'NEW': {
        severity: 'MEDIUM',
        description: 'New HTS codes may provide better classification options',
        recommendations: [
          'Review product classifications',
          'Consider if new code provides better fit',
          'Update classification procedures'
        ]
      },
      'MODIFIED': {
        severity: 'MEDIUM',
        description: 'Code modifications may affect current classifications',
        recommendations: [
          'Review current product classifications',
          'Assess if changes affect your products',
          'Update documentation if needed'
        ]
      },
      'DESCRIPTION_CHANGE': {
        severity: 'LOW',
        description: 'Description clarifications may affect interpretation',
        recommendations: [
          'Review product fit under updated description',
          'Update internal documentation'
        ]
      },
      'DELETED': {
        severity: 'HIGH',
        description: 'Deleted codes require immediate reclassification',
        recommendations: [
          'Find alternative classification immediately',
          'Update all documentation and systems',
          'Review pending shipments'
        ]
      }
    };

    return assessments[change.changeType] || {
      severity: 'LOW',
      description: 'General HTS update',
      recommendations: ['Review for potential impact']
    };
  }

  /**
   * Format change for display
   */
  static formatChangeDescription(change: HTSChange): string {
    const formatters = {
      'NEW': () => `New HTS code ${change.hsCode} added`,
      'MODIFIED': () => `HTS code ${change.hsCode} modified`,
      'DELETED': () => `HTS code ${change.hsCode} deleted`,
      'RATE_CHANGE': () => `Tariff rate changed for ${change.hsCode}${change.oldValue ? ` from ${change.oldValue}` : ''}${change.newValue ? ` to ${change.newValue}` : ''}`,
      'DESCRIPTION_CHANGE': () => `Description updated for ${change.hsCode}`
    };

    const formatter = formatters[change.changeType];
    return formatter ? formatter() : `Change to ${change.hsCode}`;
  }
}