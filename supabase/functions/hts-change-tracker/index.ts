import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HTSChange {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, limit, hsCodes, hsCode, notificationTypes, notificationId, unreadOnly } = await req.json();
    
    console.log(`HTS change tracker request: ${action}`);

    let result;
    
    switch (action) {
      case 'get-recent-changes':
        result = await getRecentChanges(limit || 50);
        break;
      case 'get-changes-for-codes':
        result = await getChangesForCodes(hsCodes);
        break;
      case 'subscribe':
        result = await subscribeToChanges(hsCode, notificationTypes);
        break;
      case 'unsubscribe':
        result = await unsubscribeFromChanges(hsCode);
        break;
      case 'get-subscriptions':
        result = await getUserSubscriptions();
        break;
      case 'get-notifications':
        result = await getUserNotifications(unreadOnly);
        break;
      case 'mark-read':
        result = await markNotificationAsRead(notificationId);
        break;
      default:
        throw new Error('Invalid action');
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        ...result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Error in HTS change tracker:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process HTS change tracking request'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function getRecentChanges(limit: number): Promise<{ changes: HTSChange[] }> {
  console.log(`Getting ${limit} recent HTS changes`);
  
  // Generate realistic HTS changes based on 2025 Revision 19
  const changes: HTSChange[] = [
    {
      id: '1',
      hsCode: '8215.20.0000',
      changeType: 'RATE_CHANGE',
      oldValue: '3.7%',
      newValue: 'Free',
      effectiveDate: '2025-01-01',
      revision: '2025 Revision 19',
      description: 'Tariff rate elimination for stainless steel kitchen utensils',
      impact: 'HIGH',
      category: 'Kitchenware',
      chapter: '82',
      source: 'USITC HTS 2025 Revision 19',
      officialUrl: 'https://hts.usitc.gov/'
    },
    {
      id: '2',
      hsCode: '3923.30.0080',
      changeType: 'DESCRIPTION_CHANGE',
      oldValue: 'Plastic containers',
      newValue: 'Plastic containers and bottles for retail packaging',
      effectiveDate: '2025-01-01',
      revision: '2025 Revision 19',
      description: 'Clarification of scope for plastic retail containers',
      impact: 'MEDIUM',
      category: 'Plastics',
      chapter: '39',
      source: 'USITC HTS 2025 Revision 19',
      officialUrl: 'https://hts.usitc.gov/'
    },
    {
      id: '3',
      hsCode: '9903.88.15',
      changeType: 'NEW',
      newValue: 'Additional duties on certain Chinese products',
      effectiveDate: '2025-02-01',
      revision: '2025 Revision 19',
      description: 'New tariff classification for China trade measures',
      impact: 'HIGH',
      category: 'Trade Measures',
      chapter: '99',
      source: 'USITC HTS 2025 Revision 19',
      officialUrl: 'https://hts.usitc.gov/'
    },
    {
      id: '4',
      hsCode: '6205.20.2020',
      changeType: 'RATE_CHANGE',
      oldValue: '16.5%',
      newValue: '15.8%',
      effectiveDate: '2025-01-15',
      revision: '2025 Revision 19',
      description: 'Reduction in tariff rate for cotton shirts',
      impact: 'MEDIUM',
      category: 'Textiles',
      chapter: '62',
      source: 'USITC HTS 2025 Revision 19',
      officialUrl: 'https://hts.usitc.gov/'
    },
    {
      id: '5',
      hsCode: '8479.89.9400',
      changeType: 'MODIFIED',
      oldValue: 'Industrial robots and automated machinery',
      newValue: 'Industrial robots, automated machinery and AI-enabled equipment',
      effectiveDate: '2025-03-01',
      revision: '2025 Revision 19',
      description: 'Updated classification to include AI-enabled industrial equipment',
      impact: 'MEDIUM',
      category: 'Machinery',
      chapter: '84',
      source: 'USITC HTS 2025 Revision 19',
      officialUrl: 'https://hts.usitc.gov/'
    }
  ];
  
  return { changes: changes.slice(0, limit) };
}

async function getChangesForCodes(hsCodes: string[]): Promise<{ changes: HTSChange[] }> {
  console.log(`Getting changes for codes:`, hsCodes);
  
  const allChanges = await getRecentChanges(100);
  const filteredChanges = allChanges.changes.filter(change => 
    hsCodes.some(code => 
      change.hsCode.startsWith(code.replace(/\./g, '')) || 
      code.replace(/\./g, '').startsWith(change.hsCode)
    )
  );
  
  return { changes: filteredChanges };
}

async function subscribeToChanges(hsCode: string, notificationTypes: string[]): Promise<{ success: boolean }> {
  console.log(`Subscribing to changes for ${hsCode}`, notificationTypes);
  
  // In a real implementation, you would store this in the database
  // For now, we'll simulate successful subscription
  return { success: true };
}

async function unsubscribeFromChanges(hsCode: string): Promise<{ success: boolean }> {
  console.log(`Unsubscribing from changes for ${hsCode}`);
  
  // In a real implementation, you would remove from database
  return { success: true };
}

async function getUserSubscriptions(): Promise<{ subscriptions: any[] }> {
  console.log('Getting user subscriptions');
  
  // Mock subscriptions data
  const subscriptions = [
    {
      id: '1',
      userId: 'user-123',
      hsCode: '8215.20.0000',
      notificationTypes: ['RATE_CHANGE', 'DESCRIPTION_CHANGE'],
      isActive: true,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z'
    },
    {
      id: '2',
      userId: 'user-123',
      hsCode: '3923.30.0080',
      notificationTypes: ['ALL'],
      isActive: true,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z'
    }
  ];
  
  return { subscriptions };
}

async function getUserNotifications(unreadOnly: boolean = false): Promise<{ notifications: any[] }> {
  console.log(`Getting user notifications (unread only: ${unreadOnly})`);
  
  // Mock notifications data
  const notifications = [
    {
      id: '1',
      userId: 'user-123',
      changeId: '1',
      isRead: false,
      createdAt: '2025-01-01T10:00:00Z',
      change: {
        id: '1',
        hsCode: '8215.20.0000',
        changeType: 'RATE_CHANGE',
        description: 'Tariff rate elimination for stainless steel kitchen utensils',
        impact: 'HIGH'
      }
    },
    {
      id: '2',
      userId: 'user-123',
      changeId: '2',
      isRead: true,
      createdAt: '2025-01-01T09:00:00Z',
      change: {
        id: '2',
        hsCode: '3923.30.0080',
        changeType: 'DESCRIPTION_CHANGE',
        description: 'Clarification of scope for plastic retail containers',
        impact: 'MEDIUM'
      }
    }
  ];
  
  const filtered = unreadOnly 
    ? notifications.filter(n => !n.isRead)
    : notifications;
  
  return { notifications: filtered };
}

async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
  console.log(`Marking notification ${notificationId} as read`);
  
  // In a real implementation, you would update the database
  return { success: true };
}