// Notification service for managing welfare scheme notifications
export interface Notification {
  id: string;
  type: 'new_scheme';
  title: string;
  message: string;
  schemeId: string;
  schemeTitle: string;
  createdAt: string;
  read: boolean;
}

class NotificationService {
  private getStorageKey(userId: string): string {
    return `civic_notifications_${userId}`;
  }

  private getReadNotificationsKey(userId: string): string {
    return `civic_read_notifications_${userId}`;
  }

  private getSeenSchemesKey(userId: string): string {
    return `civic_seen_schemes_${userId}`;
  }

  private getLastSeenKey(userId: string): string {
    return `civic_last_seen_scheme_ts_${userId}`;
  }

  // Get all notifications for a user
  getNotifications(userId: string): Notification[] {
    try {
      const notifications = localStorage.getItem(this.getStorageKey(userId));
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Get unread notification count
  getUnreadCount(userId: string): number {
    const notifications = this.getNotifications(userId);
    const readIds = this.getReadNotificationIds(userId);
    return notifications.filter(n => !readIds.includes(n.id)).length;
  }

  // Get read notification IDs
  private getReadNotificationIds(userId: string): string[] {
    try {
      const readIds = localStorage.getItem(this.getReadNotificationsKey(userId));
      return readIds ? JSON.parse(readIds) : [];
    } catch (error) {
      console.error('Error getting read notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  markAsRead(userId: string, notificationId: string): void {
    try {
      const readIds = this.getReadNotificationIds(userId);
      if (!readIds.includes(notificationId)) {
        readIds.push(notificationId);
        localStorage.setItem(this.getReadNotificationsKey(userId), JSON.stringify(readIds));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  markAllAsRead(userId: string): void {
    try {
      const notifications = this.getNotifications(userId);
      const allIds = notifications.map(n => n.id);
      localStorage.setItem(this.getReadNotificationsKey(userId), JSON.stringify(allIds));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Add new notification
  addNotification(userId: string, notification: Omit<Notification, 'id' | 'read'>): void {
    try {
      const notifications = this.getNotifications(userId);
      
      // Check if notification already exists for this scheme
      const existingNotification = notifications.find(n => n.schemeId === notification.schemeId);
      if (existingNotification) {
        console.log('Notification already exists for scheme:', notification.schemeId);
        return;
      }
      
      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        read: false
      };
      
      notifications.unshift(newNotification); // Add to beginning
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(notifications));
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }

  // Check for new schemes and create notifications
  async checkForNewSchemes(userId: string, userWard: number): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/welfare/schemes/citizens/${userWard}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const currentSchemes = data.schemes || [];
        // Sort by createdAt ascending for deterministic processing
        currentSchemes.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        // Get previously seen scheme IDs and last seen timestamp for this user
        const seenSchemeIds = this.getSeenSchemeIds(userId);
        const lastSeenTsRaw = localStorage.getItem(this.getLastSeenKey(userId));
        const lastSeenTs = lastSeenTsRaw ? parseInt(lastSeenTsRaw, 10) : 0;
        const latestReturnedTs = currentSchemes.reduce((max: number, s: any) => {
          const t = new Date(s.createdAt || s.updatedAt || Date.now()).getTime();
          return Math.max(max, t);
        }, 0);
        
        // First run bootstrap: mark existing as seen, do NOT notify
        if (!lastSeenTs && currentSchemes.length > 0) {
          const allSchemeIds = currentSchemes.map((scheme: any) => scheme._id);
          this.updateSeenSchemeIds(userId, allSchemeIds);
          localStorage.setItem(this.getLastSeenKey(userId), String(latestReturnedTs || Date.now()));
          return;
        }

        // Find new schemes strictly newer than last seen timestamp
        const newSchemes = currentSchemes.filter((scheme: any) => {
          const created = new Date(scheme.createdAt || scheme.updatedAt || Date.now()).getTime();
          return created > lastSeenTs && !seenSchemeIds.includes(scheme._id);
        });

        console.log(`Found ${newSchemes.length} new schemes for user ${userId}`);

        // Create notifications for new schemes
        newSchemes.forEach((scheme: any) => {
          this.addNotification(userId, {
            type: 'new_scheme',
            title: 'New Welfare Scheme Available',
            message: `A new scheme "${scheme.title}" is now available for your ward.`,
            schemeId: scheme._id,
            schemeTitle: scheme.title,
            createdAt: new Date().toISOString()
          });
        });

        // Update seen scheme IDs incrementally and bump last seen timestamp
        const updatedSeen = Array.from(new Set([...seenSchemeIds, ...currentSchemes.map((s: any) => s._id)]));
        this.updateSeenSchemeIds(userId, updatedSeen);
        const newLastSeen = Math.max(lastSeenTs, latestReturnedTs || Date.now());
        localStorage.setItem(this.getLastSeenKey(userId), String(newLastSeen));
      }
    } catch (error) {
      console.error('Error checking for new schemes:', error);
    }
  }

  // Get seen scheme IDs
  private getSeenSchemeIds(userId: string): string[] {
    try {
      const seenIds = localStorage.getItem(this.getSeenSchemesKey(userId));
      return seenIds ? JSON.parse(seenIds) : [];
    } catch (error) {
      console.error('Error getting seen schemes:', error);
      return [];
    }
  }

  // Update seen scheme IDs
  private updateSeenSchemeIds(userId: string, schemeIds: string[]): void {
    try {
      localStorage.setItem(this.getSeenSchemesKey(userId), JSON.stringify(schemeIds));
    } catch (error) {
      console.error('Error updating seen schemes:', error);
    }
  }

  // Clear all notifications
  clearAllNotifications(userId: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(userId));
      localStorage.removeItem(this.getReadNotificationsKey(userId));
      localStorage.removeItem(this.getSeenSchemesKey(userId));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();