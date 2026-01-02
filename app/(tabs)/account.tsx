import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, User, Bell, Lock, CreditCard, LogOut, Check, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
// import * as ImagePicker from 'expo-image-picker'; // Commented out - upload disabled
import { useState, useEffect } from 'react';
// import { supabase } from '../../lib/supabase'; // Commented out - upload disabled
import AsyncStorage from '@react-native-async-storage/async-storage';


const SETTINGS_OPTIONS = [
  { id: 'edit', label: 'Edit Profile', icon: User, color: ['#8b5cf6', '#7c3aed'] },
  { id: 'notifications', label: 'Notification Preferences', icon: Bell, color: ['#60a5fa', '#3b82f6'] },
  { id: 'privacy', label: 'Privacy Settings', icon: Lock, color: ['#fbbf24', '#f59e0b'] },
  { id: 'subscription', label: 'Subscription & Plan', icon: CreditCard, color: ['#a3e635', '#84cc16'] },
];

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const [profileImage, setProfileImage] = useState<any>(require('@/assets/images/avatar.png')); // Default avatar from assets
  const [fullName, setFullName] = useState('RAPDXB'); // Default fallback
  // const [uploading, setUploading] = useState(false); // Commented out - upload functionality disabled
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [connectingPlatform, setConnectingPlatform] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [platforms, setPlatforms] = useState([
    { id: 'instagram', name: 'Instagram', connected: false, icon: 'https://i.imgur.com/vkcuEzE.png', color: ['#E1306C', '#C13584'] as [string, string] },
    { id: 'tiktok', name: 'TikTok', connected: false, icon: 'https://i.imgur.com/K2FKVUP.png', color: ['#000000', '#333333'] as [string, string] },
    { id: 'youtube', name: 'YouTube', connected: false, icon: 'https://i.imgur.com/8H35ptZ.png', color: ['#FF0000', '#DC143C'] as [string, string] },
    { id: 'snapchat', name: 'Snapchat', connected: false, icon: 'https://i.imgur.com/XF3FRka.png', color: ['#FFFC00', '#FFA500'] as [string, string] },
    { id: 'twitter', name: 'Twitter', connected: false, icon: 'https://i.imgur.com/fPOjKNr.png', color: ['#1DA1F2', '#1a8cd8'] as [string, string] },
    { id: 'facebook', name: 'Facebook', connected: false, icon: 'https://i.imgur.com/zfY36en.png', color: ['#1877F2', '#0a5fd1'] as [string, string] },
  ]);

  useEffect(() => {
    // Load user data from AsyncStorage
    const loadUserData = async () => {
      try {
        const storedFullName = await AsyncStorage.getItem('fullName');
        if (storedFullName) {
          setFullName(storedFullName);
        }

        // Load profile image from AsyncStorage (set during login if Instagram is connected)
        const storedProfileUrl = await AsyncStorage.getItem('instagramProfileUrl');
        if (storedProfileUrl && storedProfileUrl !== 'https://i.imgur.com/vhILBC1.png') {
          setProfileImage({ uri: storedProfileUrl });
        } else {
          // Use default avatar from assets if Instagram not connected
          setProfileImage(require('@/assets/images/avatar.png'));
        }
      } catch (error) {
        // Failed to load user data
      }
    };
    loadUserData();
    
    // Check connection status when component mounts
    const checkInitialStatus = async () => {
      setCheckingStatus(true);
      try {
        const email = await AsyncStorage.getItem('email');
        if (!email) {
          setCheckingStatus(false);
          return;
        }

        const response = await fetch('https://n8n-production-0558.up.railway.app/webhook/check-connection-status', {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ email: email })
        });
        
        if (response.ok) {
          const apiResponse = await response.json();
          // API returns array with platforms data
          const data = Array.isArray(apiResponse) ? apiResponse[0] : apiResponse;
          const connectedPlatforms = data.platforms || [];
          
          // Update platform connection status
          setPlatforms(prevPlatforms =>
            prevPlatforms.map(platform => {
              const isConnected = connectedPlatforms.some((p: any) => p.platform === platform.id);
              return { ...platform, connected: isConnected };
            })
          );
        }
      } catch (error) {
        console.error('Error checking initial connection status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    checkInitialStatus();
  }, []);

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace('/(tabs)/home');
  };

  // PROFILE PICTURE UPLOAD DISABLED
  // Profile picture now comes from Instagram connection during login
  /*
  const handleImagePicker = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  */

  // PROFILE PICTURE UPLOAD DISABLED
  /*
  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      console.log('Starting upload for:', uri);

      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('Blob created:', blob.type, blob.size);

      const fileName = `profile-${Date.now()}.jpg`;
      const filePath = `profile-images/${fileName}`;
      console.log('Uploading to:', filePath);

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      setProfileImage(publicUrl);

      if (Platform.OS === 'web') {
        alert('Profile image updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (Platform.OS === 'web') {
        alert(`Upload failed: ${errorMessage}`);
      } else {
        Alert.alert('Upload Failed', `Failed to upload image: ${errorMessage}`);
      }
    } finally {
      setUploading(false);
    }
  };
  */

  const handleConnect = async (platform: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (platform.id === 'instagram') {
      // For Instagram, call n8n webhook to get auth URL
      setSelectedPlatform(platform);
      setConnectingPlatform(true);
      
      try {
        const email = await AsyncStorage.getItem('email');
        if (!email) {
          Alert.alert('Error', 'Please sign in again.');
          setConnectingPlatform(false);
          return;
        }

        const response = await fetch('https://n8n-production-0558.up.railway.app/webhook/instagram', {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            platform: 'instagram',
            email: email
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to initiate Instagram connection');
        }
        
        const data = await response.json();
        
        if (data.authUrl) {
          // Open the auth URL in a new window/tab
          if (Platform.OS === 'web') {
            window.open(data.authUrl, '_blank');
          } else {
            // For mobile, you might want to use Linking or WebBrowser
            Alert.alert('Connect Instagram', 'Please complete the authentication in your browser');
          }
          
          // Start checking connection status
          setTimeout(() => checkConnectionStatus(), 3000);
        }
      } catch (error) {
        console.error('Instagram connection error:', error);
        Alert.alert('Connection Error', 'Failed to connect to Instagram. Please try again.');
      } finally {
        setConnectingPlatform(false);
      }
    } else {
      // For other platforms, show the modal as before
      setSelectedPlatform(platform);
      setShowConnectionModal(true);
    }
  };

  const handleConfirmConnection = async () => {
    if (!selectedPlatform) return;

    setConnectingPlatform(true);

    try {
      // For non-Instagram platforms, simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update platform connection status
      setPlatforms(prevPlatforms =>
        prevPlatforms.map(p =>
          p.id === selectedPlatform.id ? { ...p, connected: true } : p
        )
      );

      setShowConnectionModal(false);
      setSelectedPlatform(null);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setConnectingPlatform(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const email = await AsyncStorage.getItem('email');
      if (!email) {
        return;
      }

      const response = await fetch('https://n8n-production-0558.up.railway.app/webhook/check-connection-status', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: email })
      });
      
      if (!response.ok) {
        throw new Error('Failed to check connection status');
      }
      
      const apiResponse = await response.json();
      // API returns array with platforms data
      const data = Array.isArray(apiResponse) ? apiResponse[0] : apiResponse;
      const connectedPlatforms = data.platforms || [];
      
      // Update platform connection status
      setPlatforms(prevPlatforms =>
        prevPlatforms.map(platform => {
          const isConnected = connectedPlatforms.some((p: any) => p.platform === platform.id);
          return { ...platform, connected: isConnected };
        })
      );
      
      // Check if any platform was newly connected
      const hasConnections = connectedPlatforms.length > 0;
      if (hasConnections) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          alert('Platform connected successfully!');
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleDisconnect = (platform: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setPlatforms(prevPlatforms =>
      prevPlatforms.map(p =>
        p.id === platform.id ? { ...p, connected: false } : p
      )
    );
  };

  const handleSettingPress = (settingId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('Open setting:', settingId);
  };

  const handleSignOut = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    try {
      await supabase.auth.signOut();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonInner}
            onPress={handleBack}
            activeOpacity={0.6}
          >
            <ArrowLeft color="#ffffff" size={18} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Your </Text>
          <Text style={styles.pageTitleBold}>Account</Text>
        </View>

        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileContent}>
            {/* PROFILE PICTURE UPLOAD DISABLED - Image comes from Instagram connection */}
            <View style={styles.profileImageContainer}>
              <Image
                source={profileImage}
                style={styles.profileImage}
              />
              {/* Camera overlay disabled */}
            </View>
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
              <Text style={styles.statValue}>56.1K</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>903K</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>6</Text>
              <Text style={styles.statLabel}>Platforms</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.section, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          <View style={styles.platformsGrid}>
            {platforms.map((platform) => (
              <View key={`${platform.id}-${platform.connected}`} style={styles.platformItem}>
                {platform.connected ? (
                  <LinearGradient
                    colors={platform.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.platformCard}
                  >
                    <View style={styles.platformHeader}>
                      <Image
                        source={{ uri: platform.icon }}
                        style={styles.platformIcon}
                        resizeMode="contain"
                      />
                      <View style={styles.connectedBadge}>
                        <Check color="#ffffff" size={12} strokeWidth={3} />
                      </View>
                    </View>
                    <Text style={styles.platformName}>{platform.name}</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDisconnect(platform)}
                      style={styles.connectedStatus}
                    >
                      <Text style={styles.connectedText}>Connected</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                ) : (
                  <View style={styles.platformCardInactive}>
                    <View style={styles.platformHeader}>
                      <Image
                        source={{ uri: platform.icon }}
                        style={styles.platformIcon}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.platformNameInactive}>{platform.name}</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleConnect(platform)}
                      style={styles.connectButton}
                    >
                      <Plus color="rgba(255, 255, 255, 0.6)" size={14} strokeWidth={2} />
                      <Text style={styles.connectText}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsGrid}>
            {SETTINGS_OPTIONS.map((setting) => (
              <TouchableOpacity
                key={setting.id}
                activeOpacity={0.7}
                onPress={() => handleSettingPress(setting.id)}
              >
                <LinearGradient
                  colors={setting.color}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.settingCard}
                >
                  <View style={styles.settingIconWrapper}>
                    <setting.icon color="#ffffff" size={20} strokeWidth={2} />
                  </View>
                  <Text style={styles.settingLabel}>{setting.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSignOut}
          style={styles.signOutWrapper}
        >
          <LinearGradient
            colors={['#fb923c', '#f97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.signOutButton}
          >
            <LogOut color="#ffffff" size={20} strokeWidth={2} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showConnectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConnectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPlatform && (
              <LinearGradient
                colors={selectedPlatform.color}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalCard}
              >
                <Image
                  source={{ uri: selectedPlatform.icon }}
                  style={styles.modalIcon}
                  resizeMode="contain"
                />
                <Text style={styles.modalTitle}>Connect {selectedPlatform.name}</Text>
                <Text style={styles.modalDescription}>
                  This is a placeholder popup. In production, this will redirect to {selectedPlatform.name} for authorization.
                </Text>

                <View style={styles.modalWebViewPlaceholder}>
                  <Text style={styles.modalPlaceholderText}>Web Authorization View</Text>
                  <Text style={styles.modalPlaceholderSubtext}>OAuth flow will happen here</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleConfirmConnection}
                  style={styles.modalDoneButton}
                  disabled={connectingPlatform}
                >
                  {connectingPlatform ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.modalDoneText}>Done (Temporary)</Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            )}
          </View>
        </View>
      </Modal>
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
  backButtonInner: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
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
    color: '#a3e635',
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  profileCard: {
    borderRadius: 38,
    padding: 24,
    gap: 20,
    marginBottom: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  profileContent: {
    alignItems: 'center',
    gap: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
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
    letterSpacing: -1,
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
    marginTop: 20,
    marginBottom: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  platformItem: {
    width: '48.5%',
  },
  platformCard: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  platformCardInactive: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformIcon: {
    width: 32,
    height: 32,
  },
  connectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformName: {
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  platformNameInactive: {
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: -0.3,
  },
  connectedStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  connectedText: {
    fontSize: 11,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  connectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  connectText: {
    fontSize: 12,
    fontFamily: 'Archivo-Bold',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: -0.2,
  },
  settingsGrid: {
    gap: 10,
  },
  settingCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
    flex: 1,
  },
  signOutWrapper: {
    marginTop: 10,
    marginBottom: 20,
  },
  signOutButton: {
    borderRadius: 38,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#fb923c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  signOutText: {
    fontSize: 18,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIcon: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 15,
    fontFamily: 'Archivo-Regular',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalWebViewPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderStyle: 'dashed',
  },
  modalPlaceholderText: {
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: -0.3,
  },
  modalPlaceholderSubtext: {
    fontSize: 13,
    fontFamily: 'Archivo-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: -0.2,
  },
  modalDoneButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
  },
  modalDoneText: {
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    color: '#000000',
    letterSpacing: -0.3,
  },
});
