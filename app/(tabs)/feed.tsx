import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image, Animated, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Link, Check, Globe, Plus, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useState, useRef } from 'react';
import * as Clipboard from 'expo-clipboard';

const FEED_DATA = [
  {
    id: 1,
    platform: 'Instagram',
    platformIcon: 'https://i.imgur.com/vkcuEzE.png',
    thumbnail: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Drake Announces New Album "For All The Dogs"',
    source: '@complexmusic',
    description: 'Drake reveals surprise album dropping next week with features from Travis Scott and 21 Savage. The Canadian rapper shared the news on his Instagram story late last night, sending fans into a frenzy.',
    timeAgo: '1h ago',
    url: 'https://www.instagram.com/p/drake-announces-new-album',
  },
  {
    id: 2,
    platform: 'YouTube',
    platformIcon: 'https://i.imgur.com/8H35ptZ.png',
    thumbnail: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Kendrick Lamar Live Performance Breakdown',
    source: '@geniusofficial',
    description: 'Watch Kendrick deliver an electrifying performance at Rolling Loud. His stage presence and lyrical prowess continue to set him apart as one of the greatest performers of our generation.',
    timeAgo: '2h ago',
    url: 'https://www.youtube.com/watch?v=kendrick-lamar-performance',
  },
  {
    id: 3,
    platform: 'TikTok',
    platformIcon: 'https://i.imgur.com/K2FKVUP.png',
    thumbnail: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Ice Spice New Single Goes Viral',
    source: '@rapvibes',
    description: 'Ice Spice breaks the internet with her latest drop. The Bronx rapper\'s infectious flow and catchy hooks have TikTok users creating thousands of videos to the track.',
    timeAgo: '3h ago',
    url: 'https://www.tiktok.com/@rapvibes/video/ice-spice-viral',
  },
  {
    id: 4,
    platform: 'Web',
    platformIcon: 'https://i.imgur.com/aXfHxEZ.png',
    thumbnail: 'https://images.pexels.com/photos/1644888/pexels-photo-1644888.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'J. Cole Talks About His Songwriting Process',
    source: 'Complex Interview',
    description: 'In an exclusive interview, J. Cole opens up about his creative approach to making music. The North Carolina rapper discusses how he crafts his introspective lyrics and conceptual albums.',
    timeAgo: '4h ago',
    url: 'https://www.complex.com/music/j-cole-songwriting-process-interview',
  },
];

const FILTERS = [
  { name: 'Posts', colors: ['#60a5fa', '#3b82f6'] },
  { name: 'Stories', colors: ['#fb923c', '#f97316'] },
];

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('Posts');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAddFeedModal, setShowAddFeedModal] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-20)).current;

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace('/(tabs)/home');
  };

  const handleFilterPress = (filter: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedFilter(filter);
  };

  const showCustomToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowToast(false);
        toastTranslateY.setValue(-20);
      });
    }, 2000);
  };

  const handleCopyLink = async (item: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await Clipboard.setStringAsync(item.url);
    showCustomToast('Link copied to clipboard!');
  };

  const handleAddFeed = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowAddFeedModal(true);
  };

  const handleCloseAddFeedModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowAddFeedModal(false);
    setFeedUrl('');
  };

  const handleSubmitFeed = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    console.log('Adding feed:', feedUrl);
    showCustomToast('Feed added successfully!');
    setShowAddFeedModal(false);
    setFeedUrl('');
  };

  const filteredFeed = FEED_DATA;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonGradient}
            onPress={handleBack}
            activeOpacity={0.6}
          >
            <ArrowLeft color="#ffffff" size={18} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Your </Text>
          <Text style={styles.pageTitleBold}>Feed</Text>
        </View>

        <View style={styles.topSection}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{FEED_DATA.length}</Text>
              <Text style={styles.statLabel}>Articles</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>Sources</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>6</Text>
              <Text style={styles.statLabel}>Platforms</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleAddFeed}
            activeOpacity={0.7}
            style={styles.addFeedButton}
          >
            <LinearGradient
              colors={['#60a5fa', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addFeedButtonInner}
            >
              <Plus color="#ffffff" size={18} strokeWidth={2.5} />
              <Text style={styles.addFeedButtonText}>Add Feed</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.filterToggleContainer}>
          <View style={styles.filterToggleBackground}>
            {FILTERS.map((filter, index) => {
              const isSelected = selectedFilter === filter.name;
              return (
                <TouchableOpacity
                  key={filter.name}
                  onPress={() => handleFilterPress(filter.name)}
                  activeOpacity={0.8}
                  style={styles.filterToggleOption}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={filter.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.filterToggleSelected}
                    >
                      <Text style={styles.filterToggleTextActive}>
                        {filter.name}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.filterToggleUnselected}>
                      <Text style={styles.filterToggleText}>
                        {filter.name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.feedList}>
          {filteredFeed.map((item, index) => (
            <View key={item.id} style={styles.feedCardWrapper}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.feedCard}
              >
                <View style={styles.cardTopSection}>
                  <View style={styles.cardHeader}>
                    <View style={styles.platformBadge}>
                      {item.platform === 'Web' ? (
                        <Globe color="#6B7280" size={16} strokeWidth={2} />
                      ) : (
                        <Image
                          source={{ uri: item.platformIcon }}
                          style={styles.platformIconSmall}
                        />
                      )}
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardSource}>{item.source}</Text>
                      <Text style={styles.timeAgo}>{item.timeAgo}</Text>
                    </View>
                  </View>

                  <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>
                    {item.description}
                  </Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.platformTag}>
                      <View style={[styles.platformDot, { backgroundColor: item.platform === 'Instagram' ? '#E1306C' : item.platform === 'YouTube' ? '#FF0000' : item.platform === 'TikTok' ? '#69C9D0' : '#6B7280' }]} />
                      <Text style={styles.platformTagText}>{item.platform}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleCopyLink(item)}
                      activeOpacity={0.7}
                      style={styles.copyButton}
                    >
                      <LinearGradient
                        colors={['rgba(96, 165, 250, 0.2)', 'rgba(59, 130, 246, 0.2)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.copyButtonInner}
                      >
                        <Link color="#60a5fa" size={16} strokeWidth={2} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>
      </ScrollView>

      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
              top: insets.top + 60,
            },
          ]}
        >
          <View style={styles.toastGradient}>
            <View style={styles.toastIconContainer}>
              <Check color="#ffffff" size={22} strokeWidth={3.5} />
            </View>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}

      <Modal
        visible={showAddFeedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseAddFeedModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Feed</Text>
              <TouchableOpacity
                onPress={handleCloseAddFeedModal}
                activeOpacity={0.7}
                style={styles.modalCloseButton}
              >
                <X color="#ffffff" size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>Feed URL</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="https://..."
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={feedUrl}
                  onChangeText={setFeedUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                onPress={handleSubmitFeed}
                activeOpacity={0.8}
                style={[styles.modalSubmitButton, !feedUrl && styles.modalSubmitButtonDisabled]}
                disabled={!feedUrl}
              >
                <LinearGradient
                  colors={['#60a5fa', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalSubmitButtonInner}
                >
                  <Text style={styles.modalSubmitButtonText}>Add Feed</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  backButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholder: {
    width: 48,
  },
  titleSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
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
    color: '#fb923c',
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  topSection: {
    gap: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addFeedButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addFeedButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  addFeedButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.2,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -1,
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  filterToggleContainer: {
    marginBottom: 24,
  },
  filterToggleBackground: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterToggleOption: {
    flex: 1,
  },
  filterToggleSelected: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleUnselected: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.2,
  },
  filterToggleTextActive: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.2,
  },
  feedList: {
    gap: 20,
  },
  feedCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  feedCard: {
    padding: 20,
    gap: 16,
  },
  cardTopSection: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  platformIconSmall: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  cardMeta: {
    flex: 1,
  },
  cardSource: {
    color: '#60a5fa',
    fontSize: 14,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardContent: {
    gap: 12,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  platformTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  platformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  platformTagText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
  },
  copyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  copyButtonInner: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    borderRadius: 12,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 14,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  toastIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.4,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.4,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    gap: 16,
  },
  modalLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  modalInputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  modalSubmitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
});
