import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission, PermissionStatus } from 'react-native-permissions';

/**
 * Permission Types
 */
export type PermissionType = 'microphone';

/**
 * Permission Status Types
 */
export type PermissionResult = 
  | 'granted' 
  | 'denied' 
  | 'blocked' 
  | 'unavailable' 
  | 'limited';

/**
 * Get the correct permission constant based on platform
 */
const getPermission = (type: PermissionType): Permission | null => {
  switch (type) {
    case 'microphone':
      if (Platform.OS === 'ios') {
        return PERMISSIONS.IOS.MICROPHONE;
      } else if (Platform.OS === 'android') {
        return PERMISSIONS.ANDROID.RECORD_AUDIO;
      }
      return null;
    default:
      return null;
  }
};

/**
 * Convert react-native-permissions RESULTS to our custom PermissionResult
 */
const convertStatus = (status: PermissionStatus): PermissionResult => {
  switch (status) {
    case RESULTS.GRANTED:
      return 'granted';
    case RESULTS.DENIED:
      return 'denied';
    case RESULTS.BLOCKED:
      return 'blocked';
    case RESULTS.UNAVAILABLE:
      return 'unavailable';
    case RESULTS.LIMITED:
      return 'limited';
    default:
      return 'unavailable';
  }
};

/**
 * Check if a permission is granted
 */
export const checkPermission = async (type: PermissionType): Promise<PermissionResult> => {
  // For web, return granted as we use browser APIs
  if (Platform.OS === 'web') {
    return 'granted';
  }

  const permission = getPermission(type);
  if (!permission) {
    return 'unavailable';
  }

  try {
    const status = await check(permission);
    return convertStatus(status);
  } catch (error) {
    console.error(`Error checking ${type} permission:`, error);
    return 'unavailable';
  }
};

/**
 * Request a permission from the user
 */
export const requestPermission = async (type: PermissionType): Promise<PermissionResult> => {
  // For web, return granted as we use browser APIs
  if (Platform.OS === 'web') {
    return 'granted';
  }

  const permission = getPermission(type);
  if (!permission) {
    return 'unavailable';
  }

  try {
    const status = await request(permission);
    return convertStatus(status);
  } catch (error) {
    console.error(`Error requesting ${type} permission:`, error);
    return 'unavailable';
  }
};

/**
 * Check and request permission if needed
 * Returns true if permission is granted, false otherwise
 */
export const ensurePermission = async (type: PermissionType): Promise<boolean> => {
  // For web, return true as we use browser APIs
  if (Platform.OS === 'web') {
    return true;
  }

  const currentStatus = await checkPermission(type);

  if (currentStatus === 'granted') {
    return true;
  }

  if (currentStatus === 'blocked') {
    showPermissionBlockedAlert(type);
    return false;
  }

  if (currentStatus === 'unavailable') {
    Alert.alert(
      'Feature Unavailable',
      `${getPermissionName(type)} is not available on this device.`,
      [{ text: 'OK', style: 'cancel' }]
    );
    return false;
  }

  // Request permission
  const requestedStatus = await requestPermission(type);

  if (requestedStatus === 'granted') {
    return true;
  }

  if (requestedStatus === 'blocked') {
    showPermissionBlockedAlert(type);
    return false;
  }

  return false;
};

/**
 * Show alert when permission is blocked
 */
const showPermissionBlockedAlert = (type: PermissionType) => {
  Alert.alert(
    'Permission Required',
    `${getPermissionName(type)} access has been denied. Please enable it in your device settings to use this feature.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Open Settings', 
        onPress: () => Linking.openSettings() 
      }
    ]
  );
};

/**
 * Get human-readable permission name
 */
const getPermissionName = (type: PermissionType): string => {
  switch (type) {
    case 'microphone':
      return 'Microphone';
    default:
      return 'Permission';
  }
};

/**
 * Check multiple permissions at once
 */
export const checkMultiplePermissions = async (
  types: PermissionType[]
): Promise<Record<PermissionType, PermissionResult>> => {
  const results: Record<string, PermissionResult> = {};

  await Promise.all(
    types.map(async (type) => {
      results[type] = await checkPermission(type);
    })
  );

  return results as Record<PermissionType, PermissionResult>;
};

/**
 * Request microphone permission with custom messaging
 */
export const requestMicrophonePermission = async (): Promise<boolean> => {
  return ensurePermission('microphone');
};

/**
 * Check microphone permission status
 */
export const checkMicrophonePermission = async (): Promise<PermissionResult> => {
  return checkPermission('microphone');
};

/**
 * Hook to get permission status (for use in components)
 */
export const getPermissionStatus = async (type: PermissionType): Promise<{
  status: PermissionResult;
  isGranted: boolean;
  isBlocked: boolean;
  isDenied: boolean;
}> => {
  const status = await checkPermission(type);
  
  return {
    status,
    isGranted: status === 'granted',
    isBlocked: status === 'blocked',
    isDenied: status === 'denied',
  };
};
