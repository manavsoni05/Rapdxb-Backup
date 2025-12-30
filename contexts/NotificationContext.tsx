import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NotificationType = 'posting' | 'success' | 'failed';

interface NotificationContextType {
  showPostNotification: (type: NotificationType, message: string, onRetry?: () => void) => void;
  hidePostNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    onRetry?: () => void;
  } | null>(null);
  const notificationOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const showPostNotification = (type: NotificationType, message: string, onRetry?: () => void) => {
    setNotification({ type, message, onRetry });
    Animated.timing(notificationOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-hide success notifications after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        hidePostNotification();
      }, 5000);
    }
  };

  const hidePostNotification = () => {
    Animated.timing(notificationOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setNotification(null));
  };

  return (
    <NotificationContext.Provider value={{ showPostNotification, hidePostNotification }}>
      {children}
      
      {/* Global Notification Banner */}
      {notification && (
        <Animated.View
          style={[
            styles.persistentNotification,
            notification.type === 'posting' && styles.persistentNotificationPosting,
            notification.type === 'success' && styles.persistentNotificationSuccess,
            notification.type === 'failed' && styles.persistentNotificationFailed,
            {
              opacity: notificationOpacity,
              top: insets.top + 16,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={notification.type === 'failed' ? 0.7 : 1}
            onPress={notification.type === 'failed' && notification.onRetry ? notification.onRetry : undefined}
            style={styles.persistentNotificationContent}
          >
            <View style={styles.persistentNotificationLeft}>
              {notification.type === 'posting' && (
                <ActivityIndicator color="#ffffff" size="small" style={styles.persistentNotificationSpinner} />
              )}
              {notification.type === 'success' && (
                <View style={styles.persistentNotificationIconSuccess}>
                  <Check color="#ffffff" size={18} strokeWidth={3} />
                </View>
              )}
              {notification.type === 'failed' && (
                <View style={styles.persistentNotificationIconError}>
                  <X color="#ffffff" size={18} strokeWidth={3} />
                </View>
              )}
              <Text style={styles.persistentNotificationText}>{notification.message}</Text>
            </View>
            <TouchableOpacity
              onPress={hidePostNotification}
              style={styles.persistentNotificationClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color="#ffffff" size={16} strokeWidth={2.5} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  persistentNotification: {
    position: 'absolute',
    right: 16,
    left: 16,
    zIndex: 999999,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 999,
  },
  persistentNotificationPosting: {
    backgroundColor: '#3b82f6',
  },
  persistentNotificationSuccess: {
    backgroundColor: '#10b981',
  },
  persistentNotificationFailed: {
    backgroundColor: '#ef4444',
  },
  persistentNotificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  persistentNotificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  persistentNotificationSpinner: {
    marginRight: 0,
  },
  persistentNotificationIconSuccess: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  persistentNotificationIconError: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  persistentNotificationText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Archivo-SemiBold',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  persistentNotificationClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
