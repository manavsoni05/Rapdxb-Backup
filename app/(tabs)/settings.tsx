import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image, TextInput, RefreshControl, Alert, Linking, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, Edit2, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', connected: true, icon: 'https://i.imgur.com/vkcuEzE.png', color: ['#E1306C', '#C13584'] },
  { id: 'tiktok', name: 'TikTok', connected: true, icon: 'https://i.imgur.com/K2FKVUP.png', color: ['#000000', '#333333'] },
  { id: 'youtube', name: 'YouTube', connected: true, icon: 'https://i.imgur.com/8H35ptZ.png', color: ['#FF0000', '#DC143C'] },
  { id: 'snapchat', name: 'Snapchat', connected: true, icon: 'https://i.imgur.com/XF3FRka.png', color: ['#FFFC00', '#FFA500'] },
  { id: 'twitter', name: 'Twitter', connected: true, icon: 'https://i.imgur.com/fPOjKNr.png', color: ['#1DA1F2', '#1a8cd8'] },
  { id: 'facebook', name: 'Facebook', connected: true, icon: 'https://i.imgur.com/zfY36en.png', color: ['#1877F2', '#0a5fd1'] },
];

const WEBHOOK_URL = 'https://n8n-production-0558.up.railway.app/webhook/f34adde4-1571-4d9f-a210-2d3ff9aa99d3';
const CHECK_STATUS_URL = 'https://n8n-production-0558.up.railway.app/webhook/check-instagram-status';
const INSTAGRAM_STORAGE_KEY = 'instagramConnectedUserId';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileName, setProfileName] = useState('RAPDXB');
  const [profileImage, setProfileImage] = useState('https://i.imgur.com/vhILBC1.png');
  const [editName, setEditName] = useState(profileName);
  const [editImage, setEditImage] = useState(profileImage);
  const [refreshing, setRefreshing] = useState(false);
  const [instagramUserId, setInstagramUserId] = useState<string | null>(null);
  const [showWaitModal, setShowWaitModal] = useState(false);

  const loadInstagramConnection = useCallback(async () => {
    try {
      const storedConnectionId = await AsyncStorage.getItem(INSTAGRAM_STORAGE_KEY);
      setInstagramUserId(storedConnectionId);
    } catch (error) {
      console.error('Failed to load Instagram connection state', error);
      setInstagramUserId(null);
    }
  }, []);

  useEffect(() => {
    loadInstagramConnection();
  }, [loadInstagramConnection]);

  const handlePlatformPress = async (platformId: string) => {
    if (platformId !== 'instagram') {
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const storedUserId = await AsyncStorage.getItem('userId');

      if (!storedUserId) {
        await AsyncStorage.removeItem(INSTAGRAM_STORAGE_KEY);
        setInstagramUserId(null);
        Alert.alert('Missing Account', 'We could not find your account locally. Please sign in again.');
        return;
      }

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ UserId: storedUserId }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const authData = Array.isArray(payload) ? payload[0] : payload;
      const authUrl = authData?.authUrl;

      if (!authUrl) {
        Alert.alert('Connection Error', 'Instagram did not return an authorization link. Please try again later.');
        return;
      }

      const canOpen = await Linking.canOpenURL(authUrl);
      if (!canOpen) {
        Alert.alert('Connection Error', 'This device cannot open the Instagram authorization link.');
        return;
      }

      // Open URL and start polling
      await Linking.openURL(authUrl);
      setShowWaitModal(true);

      // Polling logic
      const pollInterval = 3000; // 3 seconds
      const maxDuration = 60000; // 60 seconds
      const startTime = Date.now();

      const checkStatus = async () => {
        try {
          const url = `${CHECK_STATUS_URL}?userId=${storedUserId}`;
          console.log('Checking Status URL:', url);
          
          const statusResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (statusResponse.ok) {
            const text = await statusResponse.text();
            console.log('Check Status Raw Text:', text);

            if (!text) {
              console.log('Empty response received');
              return false;
            }

            let statusData;
            try {
              statusData = JSON.parse(text);
            } catch (e) {
              console.error('Failed to parse JSON:', e);
              return false;
            }

            console.log('Check Status Parsed JSON:', JSON.stringify(statusData));
            
            // Expected format: [{ "connected": true, "instagramPostId": "...", "userId": "...", "message": "Instagram connected" }]
            const data = Array.isArray(statusData) ? statusData[0] : statusData;
            console.log('Parsed Data Object:', data);

            if (data && data.connected === true) {
              await AsyncStorage.setItem(INSTAGRAM_STORAGE_KEY, storedUserId);
              setInstagramUserId(storedUserId);
              setShowWaitModal(false);
              Alert.alert('Success', 'Instagram connected successfully!');
              return true; // Stop polling
            }
          }
        } catch (err) {
          console.error('Error checking status:', err);
        }
        return false; // Continue polling
      };

      const pollId = setInterval(async () => {
        if (Date.now() - startTime > maxDuration) {
          clearInterval(pollId);
          setShowWaitModal(false);
          Alert.alert('Timeout', 'Connection check timed out. Please check if you completed the process.');
          return;
        }

        const isConnected = await checkStatus();
        if (isConnected) {
          clearInterval(pollId);
        }
      }, pollInterval);

    } catch (error) {
      console.error('Failed to notify Instagram webhook', error);
      Alert.alert('Connection Error', 'We were unable to launch the Instagram authorization link. Please try again later.');
      await AsyncStorage.removeItem(INSTAGRAM_STORAGE_KEY);
      setInstagramUserId(null);
      setShowWaitModal(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInstagramConnection().finally(() => {
      setRefreshing(false);
    });
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

  const handleSaveEdit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setProfileName(editName);
    setProfileImage(editImage);
    setShowEditModal(false);
  };

  const handleChangeImage = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const sampleImages = [
      'https://i.imgur.com/vhILBC1.png',
      'https://i.imgur.com/9BvTmzs.png',
      'https://i.imgur.com/K2vZ9xL.png',
    ];
    const currentIndex = sampleImages.indexOf(editImage);
    const nextIndex = (currentIndex + 1) % sampleImages.length;
    setEditImage(sampleImages[nextIndex]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
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
              <Text style={styles.profileName}>{profileName}</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          <View style={styles.platformsGrid}>
            {SOCIAL_PLATFORMS.map((platform) => {
              const isInstagram = platform.id === 'instagram';
              const isConnected = isInstagram && instagramUserId;
              const platformStatus = isConnected ? 'Connected' : 'Not connected';

              return (
              <TouchableOpacity
                key={platform.id}
                style={[
                  styles.platformItem, 
                  Platform.OS === 'web' ? styles.pointerCursor : null,
                  isConnected && { opacity: 0.8 }
                ]}
                activeOpacity={0.8}
                onPress={() => !isConnected && handlePlatformPress(platform.id)}
                disabled={!!isConnected}
              >
                <LinearGradient
                  colors={platform.color}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.platformCard}
                >
                  <View style={styles.platformHeader}>
                    <View style={[styles.connectedBadge, isConnected && styles.connectedBadgeActive]}>
                      <Check color="#ffffff" size={10} strokeWidth={3} />
                    </View>
                  </View>
                  <View style={styles.platformContent}>
                    <Image
                      source={{ uri: platform.icon }}
                      style={styles.platformIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.platformName}>{platform.name}</Text>
                  </View>
                  <View style={styles.connectedStatus}>
                    <Text style={[
                      styles.connectedText, 
                      isConnected && styles.connectedTextActive
                    ]}>
                      {platformStatus}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
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
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSaveEdit}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </>
      )}

      {/* Wait Modal */}
      <Modal
        visible={showWaitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWaitModal(false)}
      >
        <View style={styles.waitModalOverlay}>
          <View style={styles.waitModalContent}>
            <ActivityIndicator size="large" color="#60a5fa" />
            <Text style={styles.waitModalText}>Wait for a while...</Text>
            <Text style={styles.waitModalSubText}>Connecting to Instagram</Text>
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
    color: '#22c55e', // Green color
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
  saveButtonText: {
    fontSize: 18,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  waitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitModalContent: {
    backgroundColor: '#1a1a1a',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  waitModalText: {
    fontSize: 20,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  waitModalSubText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
