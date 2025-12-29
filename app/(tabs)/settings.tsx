import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image, TextInput, RefreshControl, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, Edit2, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'https://i.imgur.com/vkcuEzE.png', color: ['#E1306C', '#C13584'] },
  { id: 'tiktok', name: 'TikTok', icon: 'https://i.imgur.com/K2FKVUP.png', color: ['#000000', '#333333'] },
  { id: 'youtube', name: 'YouTube', icon: 'https://i.imgur.com/8H35ptZ.png', color: ['#FF0000', '#DC143C'] },
  { id: 'snapchat', name: 'Snapchat', icon: 'https://i.imgur.com/XF3FRka.png', color: ['#FFFC00', '#FFA500'] },
  { id: 'twitter', name: 'Twitter', icon: 'https://i.imgur.com/fPOjKNr.png', color: ['#1DA1F2', '#1a8cd8'] },
  { id: 'facebook', name: 'Facebook', icon: 'https://i.imgur.com/zfY36en.png', color: ['#1877F2', '#0a5fd1'] },
];

const CHECK_STATUS_URL = 'https://n8n-production-0558.up.railway.app/webhook/check-connection-status';
const INSTAGRAM_CONNECT_URL = 'https://n8n-production-0558.up.railway.app/webhook/instagram';
const YOUTUBE_CONNECT_URL = 'https://n8n-production-0558.up.railway.app/webhook/youtube';
const TIKTOK_CONNECT_URL = 'https://n8n-production-0558.up.railway.app/webhook/tiktok';
const DISCONNECT_URL = 'https://n8n-production-0558.up.railway.app/webhook/disconnect';
const UPDATE_USER_DETAIL_URL = 'https://n8n-production-0558.up.railway.app/webhook/updateUserDetail';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileName, setProfileName] = useState('RAPDXB');
  const [profileImage, setProfileImage] = useState('https://i.imgur.com/vhILBC1.png');
  const [editName, setEditName] = useState(profileName);
  const [editImage, setEditImage] = useState(profileImage);
  const [fullName, setFullName] = useState('RAPDXB'); // Default fallback
  const [platformCount, setPlatformCount] = useState(0); // Platform count from API
  const [totalFollowers, setTotalFollowers] = useState(0); // Total followers from API
  const [totalLikes, setTotalLikes] = useState(0); // Total likes from all platforms
  const [connectedUsernames, setConnectedUsernames] = useState<{instagram?: string; tiktok?: string; youtube?: string}>({}); // Connected usernames
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    instagram: false,
    youtube: false,
    tiktok: false,
  });
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error'; message: string} | null>(null);
  const notificationOpacity = useRef(new Animated.Value(0)).current;
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const checkConnectionStatus = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem('email');
      if (!email) {
        console.log('No email found in storage');
        return;
      }

      const response = await fetch(CHECK_STATUS_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: email }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Connection status:', data);
        
        setConnectionStatus({
          instagram: data.isInstagramConnect ,
          youtube: data.isYoutubeConnect ,
          tiktok: data.isTiktokConnect ,
        });
        
        // Extract platformCount from API response
        if (data.platformCount !== undefined) {
          setPlatformCount(data.platformCount);
        }
      }
    } catch (error) {
      console.error('Failed to check connection status', error);
    }
  }, []);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  // Fetch fullName, totalFollowers, and connectedUsernames from AsyncStorage on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedFullName = await AsyncStorage.getItem('fullName');
        if (storedFullName) {
          setFullName(storedFullName);
        }
        
        const storedFollowers = await AsyncStorage.getItem('totalFollowers');
        if (storedFollowers) {
          setTotalFollowers(parseInt(storedFollowers, 10));
        }
        
        const storedUsernames = await AsyncStorage.getItem('connectedUsernames');
        if (storedUsernames) {
          setConnectedUsernames(JSON.parse(storedUsernames));
        }

        const storedProfileUrl = await AsyncStorage.getItem('instagramProfileUrl');
        if (storedProfileUrl) {
          setProfileImage(storedProfileUrl);
        }

        // Calculate total likes from all platforms
        const storedAnalytics = await AsyncStorage.getItem('platformAnalyticsTotals');
        if (storedAnalytics) {
          const analytics = JSON.parse(storedAnalytics);
          let totalLikesCount = 0;
          Object.keys(analytics).forEach((platform) => {
            if (analytics[platform]?.likes) {
              totalLikesCount += analytics[platform].likes;
            }
          });
          setTotalLikes(totalLikesCount);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkConnectionStatus();
    }, [checkConnectionStatus])
  );

  const handlePlatformPress = async (platformId: string) => {
    // Only handle Instagram, YouTube, and TikTok connections
    if (platformId !== 'instagram' && platformId !== 'youtube' && platformId !== 'tiktok') {
      console.log('Platform not yet implemented:', platformId);
      if (Platform.OS === 'web') {
        alert(`${platformId} connection coming soon!`);
      } else {
        Alert.alert('Coming Soon', `${platformId} connection will be available soon.`);
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoadingPlatform(platformId);

    try {
      const email = await AsyncStorage.getItem('email');
      if (!email) {
        console.log('No email found');
        setLoadingPlatform(null);
        if (Platform.OS === 'web') {
          alert('Please sign in again.');
        } else {
          Alert.alert('Error', 'Please sign in again.');
        }
        return;
      }

      console.log(`Connecting ${platformId} for email:`, email);

      // Select the appropriate endpoint
      let connectUrl = '';
      if (platformId === 'instagram') {
        connectUrl = INSTAGRAM_CONNECT_URL;
      } else if (platformId === 'youtube') {
        connectUrl = YOUTUBE_CONNECT_URL;
      } else if (platformId === 'tiktok') {
        connectUrl = TIKTOK_CONNECT_URL;
      }

      console.log(`Calling endpoint: ${connectUrl}`);

      const response = await fetch(connectUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          platform: platformId,
          email: email
        })
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        setLoadingPlatform(null);
        throw new Error(`Failed to initiate ${platformId} connection`);
      }

      const data = await response.json();
      console.log(`Response data:`, data);

      // Handle both array and object responses
      const authData = Array.isArray(data) ? data[0] : data;
      
      if (authData && authData.authUrl) {
        console.log(`Opening auth URL: ${authData.authUrl}`);
        
        // Open the auth URL
        if (Platform.OS === 'web') {
          let url = authData.authUrl;
          if(platformId === 'tiktok') {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}disable_auto_auth=1&set_force_login=true`;
          }
          const authWindow = window.open(url, '_blank');
          if (!authWindow) {
            setLoadingPlatform(null);
            alert('Please allow pop-ups for this site to connect your account.');
          } else {
            // Check status every 2 seconds for web
            const intervalId = setInterval(async () => {
              await checkConnectionStatus();
              if (connectionStatus[platformId as keyof typeof connectionStatus]) {
                clearInterval(intervalId);
                setLoadingPlatform(null);
                showNotification('success', `${platformId} connected successfully!`);
              }
            }, 2000);
            
            // Stop checking after 60 seconds
            setTimeout(() => {
              clearInterval(intervalId);
              setLoadingPlatform(null);
            }, 60000);
          }
        } else {
          // For mobile, use WebBrowser from expo-web-browser
          try {
             let url = authData.authUrl;
          if(platformId === 'tiktok') {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}disable_auto_auth=1&set_force_login=true`;
          }
            const result = await WebBrowser.openBrowserAsync(url, {
              dismissButtonStyle: 'close',
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
              controlsColor: '#3b82f6',
            });
            console.log(`Browser result:`, result);
            
            // Check connection status immediately after browser closes
            await checkConnectionStatus();
            setLoadingPlatform(null);
            
            // Give user feedback
            if (connectionStatus[platformId as keyof typeof connectionStatus]) {
              showNotification('success', `${platformId} connected successfully!`);
            }
          } catch (error) {
            console.error('Failed to open browser:', error);
            setLoadingPlatform(null);
            Alert.alert('Error', 'Failed to open authentication page. Please try again.');
            return;
          }
        }
      } else {
        console.warn('No authUrl in response:', data);
        setLoadingPlatform(null);
        if (Platform.OS === 'web') {
          alert('Failed to get authentication URL. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to get authentication URL. Please try again.');
        }
      }
    } catch (error) {
      console.error(`${platformId} connection error:`, error);
      setLoadingPlatform(null);
      if (Platform.OS === 'web') {
        alert(`Failed to connect ${platformId}. Please try again.`);
      } else {
        Alert.alert('Connection Error', `Failed to connect ${platformId}. Please try again.`);
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    checkConnectionStatus().finally(() => {
      setRefreshing(false);
    });
  };

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    Animated.sequence([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setNotification(null));
  }, [notificationOpacity]);

  const handleDisconnectConfirm = (platformId: string, platformName: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const message = `Are you sure you want to disconnect ${platformName}?`;
    
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        handleDisconnect(platformId, platformName);
      }
    } else {
      Alert.alert(
        'Disconnect Account',
        message,
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => {
              console.log('Disconnect cancelled');
            }
          },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => handleDisconnect(platformId, platformName)
          }
        ],
        { cancelable: true }
      );
    }
  };

  const handleDisconnect = async (platformId: string, platformName: string) => {
    console.log('Disconnect confirmed for:', platformName, platformId);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoadingPlatform(platformId);

    try {
      const email = await AsyncStorage.getItem('email');
      console.log('Email from storage:', email);
      
      if (!email) {
        setLoadingPlatform(null);
        showNotification('error', 'No email found. Please sign in again.');
        return;
      }

      const payload = {
        email: email,
        platform: platformId,
      };
      
      console.log('Sending disconnect request to:', DISCONNECT_URL);
      console.log('Payload:', payload);

      const response = await fetch(DISCONNECT_URL, {
        method: 'DELETE',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        // Update connection status immediately
        setConnectionStatus(prev => ({
          ...prev,
          [platformId]: false,
        }));

        // Show success notification immediately
        setLoadingPlatform(null);
        showNotification('success', `${platformName} disconnected successfully!`);
      } else {
        const errorText = await response.text();
        console.error('Disconnect failed:', errorText);
        setLoadingPlatform(null);
        showNotification('error', `Failed to disconnect ${platformName}. Please try again.`);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      setLoadingPlatform(null);
      showNotification('error', `Failed to disconnect ${platformName}. Please try again.`);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace('/(tabs)/home');
  };

  const handleEditPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditName(profileName);
    setEditImage(profileImage);
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowEditModal(false);
  };

  const handleSaveEdit = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Validate name is not empty
    if (!editName.trim()) {
      showNotification('error', 'Name cannot be empty');
      return;
    }

    setIsSavingProfile(true);

    try {
      const email = await AsyncStorage.getItem('email');
      if (!email) {
        showNotification('error', 'No email found. Please sign in again.');
        setIsSavingProfile(false);
        return;
      }

      const response = await fetch(UPDATE_USER_DETAIL_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim(),
          email: email,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('Profile updated successfully:', data);

      // Update local state
      setProfileName(editName.trim());
      setFullName(editName.trim());
      
      // Update AsyncStorage
      await AsyncStorage.setItem('fullName', editName.trim());

      // TODO: Implement profile image update in future
      // For now, just update the local state
      setProfileImage(editImage);

      setShowEditModal(false);
      showNotification('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
      showNotification('error', errorMessage);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangeImage = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      showNotification('error', 'Permission to access gallery is required');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile image
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImageUri = result.assets[0].uri;
      setEditImage(selectedImageUri);

      // TODO: When implementing backend profile image upload:
      // 1. Convert image to base64 or use FormData
      // 2. Include profileImage field in the API call to UPDATE_USER_DETAIL_URL
      // 3. Update the API endpoint to accept multipart/form-data if using FormData
      // 4. Save the returned image URL to AsyncStorage and state
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Notification Component */}
      {notification && (
        <Animated.View 
          style={[
            styles.notification,
            notification.type === 'error' && styles.notificationError,
            notification.type === 'success' && styles.notificationSuccess,
            { 
              opacity: notificationOpacity,
              top: insets.top + 16,
            }
          ]}
        >
          <View style={styles.notificationContent}>
            {notification.type === 'success' && (
              <View style={styles.notificationIconSuccess}>
                <Check color="#ffffff" size={20} strokeWidth={3} />
              </View>
            )}
            {notification.type === 'error' && (
              <View style={styles.notificationIconError}>
                <X color="#ffffff" size={20} strokeWidth={3} />
              </View>
            )}
            <Text style={styles.notificationText}>{notification.message}</Text>
          </View>
        </Animated.View>
      )}
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.6}
          >
            <View style={styles.backButtonInner}>
              <ArrowLeft color="#ffffff" size={18} strokeWidth={1.5} />
            </View>
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Your </Text>
          <Text style={styles.pageTitleBold}>Account</Text>
        </View>

        <LinearGradient
          colors={['#60a5fa', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditPress}
            activeOpacity={0.7}
          >
            <Edit2 color="#ffffff" size={18} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.profileContent}>
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{fullName}</Text>
              <Image
                source={{ uri: 'https://i.imgur.com/5rF4a1S.png' }}
                style={styles.verifiedBadge}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalFollowers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalLikes}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{platformCount}</Text>
              <Text style={styles.statLabel}>Platforms</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          <View style={styles.platformsGrid}>
            {SOCIAL_PLATFORMS.map((platform) => {
              const isConnected = connectionStatus[platform.id as keyof typeof connectionStatus] || false;
              const canConnect = platform.id === 'instagram' || platform.id === 'youtube' || platform.id === 'tiktok';
              const isLoading = loadingPlatform === platform.id;
              const platformStatus = isLoading ? 'Loading...' : isConnected ? 'Connected' : (canConnect ? 'Connect' : 'Not connected');
              const username = isConnected ? connectedUsernames[platform.id as keyof typeof connectedUsernames] : null;

              return (
              <View
                key={platform.id}
                style={[
                  styles.platformItem, 
                  Platform.OS === 'web' ? styles.pointerCursor : null,
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePlatformPress(platform.id)}
                  disabled={!canConnect || isConnected || isLoading}
                  style={{ flex: 1 }}
                >
                <LinearGradient
                  colors={platform.color}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.platformCard, isLoading && styles.platformCardLoading]}
                >
                  <View style={styles.platformHeader}>
                    <View style={[styles.connectedBadge, isConnected && styles.connectedBadgeActive]}>
                      <Check color="#ffffff" size={10} strokeWidth={3} />
                    </View>
                  </View>
                  <View style={styles.platformContent}>
                    <Image
                      source={{ uri: platform.icon }}
                      style={[styles.platformIcon, isLoading && styles.platformIconLoading]}
                      resizeMode="contain"
                    />
                    <Text style={styles.platformName}>{platform.name}</Text>
                  </View>
                  <View style={styles.connectedStatus}>
                    {isConnected ? (
                      <View style={styles.connectedIndicator}>
                        <View style={styles.greenDot} />
                        <View style={styles.connectedTextContainer}>
                          <Text style={styles.connectedTextActive}>
                            {platformStatus}
                          </Text>
                          {username && (
                            <Text style={styles.usernameText}>
                              @{username}
                            </Text>
                          )}
                        </View>
                      </View>
                    ) : (
                      <Text style={[
                        styles.connectedText,
                        canConnect && styles.connectButtonText,
                        isLoading && styles.loadingText
                      ]}>
                        {platformStatus}
                      </Text>
                    )}
                  </View>
                </LinearGradient>
                </TouchableOpacity>
                
                {/* Disconnect Button */}
                {isConnected && canConnect && (
                  <TouchableOpacity
                    style={[styles.disconnectButton, isLoading && styles.disconnectButtonDisabled]}
                    activeOpacity={0.7}
                    onPress={() => handleDisconnectConfirm(platform.id, platform.name)}
                    disabled={isLoading}
                  >
                    <Text style={styles.disconnectButtonText}>
                      {isLoading ? 'Disconnecting...' : 'Disconnect'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {showEditModal && (
        <>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCloseEdit}
          />
          <View style={[styles.editModal, { top: insets.top + 100 }]}>
            <LinearGradient
              colors={['#60a5fa', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.editModalContent}
            >
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Edit Profile</Text>
                <TouchableOpacity
                  onPress={handleCloseEdit}
                  activeOpacity={0.7}
                  style={styles.closeButton}
                >
                  <X color="#ffffff" size={24} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.editImageSection}>
                <Image
                  source={{ uri: editImage }}
                  style={styles.editProfileImage}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.changeImageButton}
                  onPress={handleChangeImage}
                >
                  <Text style={styles.changeImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your name..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    editable={!isSavingProfile}
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSaveEdit}
                style={[styles.saveButton, isSavingProfile && styles.saveButtonDisabled]}
                disabled={isSavingProfile}
              >
                <Text style={styles.saveButtonText}>
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  backButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholder: {
    width: 48,
  },
  titleSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 44,
    fontFamily: 'Inter-Thin',
    color: '#ffffff',
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  pageTitleBold: {
    fontSize: 44,
    fontFamily: 'Archivo-Bold',
    color: '#60a5fa',
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  profileCard: {
    borderRadius: 38,
    padding: 24,
    gap: 20,
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  editButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  profileContent: {
    alignItems: 'center',
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 28,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  section: {
    marginBottom: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 19.5,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformItem: {
    width: '31.5%',
  },
  pointerCursor: {
    cursor: 'pointer',
  } as any,
  platformCard: {
    borderRadius: 20,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  platformContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  platformIcon: {
    width: 48,
    height: 48,
  },
  connectedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformName: {
    fontSize: 15,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  connectedStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'center',
  },
  connectedText: {
    fontSize: 10,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  userIdText: {
    letterSpacing: -0.1,
    textTransform: 'none',
    fontSize: 11,
  },
  connectedBadgeActive: {
    backgroundColor: '#22c55e', // Green color
  },
  connectedTextActive: {
    color: '#ffffff',
    fontFamily: 'Archivo-Bold',
  },
  connectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectedTextContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  usernameText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontFamily: 'Archivo-Regular',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  connectButtonText: {
    color: '#ffffff',
    fontFamily: 'Archivo-Bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 998,
  },
  editModal: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  editModalContent: {
    borderRadius: 38,
    padding: 24,
    gap: 24,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 16,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editModalTitle: {
    fontSize: 24,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageSection: {
    alignItems: 'center',
    gap: 16,
  },
  editProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  changeImageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  changeImageText: {
    fontSize: 14,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  inputGroup: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 18,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  notification: {
    position: 'absolute',
    right: 16,
    left: 16,
    zIndex: 9999,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  notificationError: {
    backgroundColor: '#ef4444',
  },
  notificationSuccess: {
    backgroundColor: '#10b981',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIconSuccess: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconError: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Archivo-SemiBold',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  disconnectButton: {
    marginTop: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Archivo-SemiBold',
    letterSpacing: -0.2,
  },
  disconnectButtonDisabled: {
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
    opacity: 0.6,
  },
  platformCardLoading: {
    opacity: 0.7,
  },
  platformIconLoading: {
    opacity: 0.5,
  },
  loadingText: {
    opacity: 0.8,
  },
});
