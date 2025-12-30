import { View, Text, StyleSheet, Image, Animated, ScrollView, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, MapPin, Moon, Flame, ChartBar as BarChart, X, LogOut } from 'lucide-react-native';
import Svg, { Path, Circle, Defs, Pattern, Rect, G, Line, ClipPath, LinearGradient as SvgLinearGradient, Stop, RadialGradient } from 'react-native-svg';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
import { useEffect, useRef, useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLATFORM_DATA = [
  { name: 'Instagram', followers: '21.6K', likes: '743K', icon: 'https://i.imgur.com/vkcuEzE.png', color: '#E1306C' },
  { name: 'TikTok', followers: '18.3K', likes: '146K', icon: 'https://i.imgur.com/K2FKVUP.png', color: '#000000' },
  { name: 'YouTube', followers: '3.7K', likes: '4.5K', icon: 'https://i.imgur.com/8H35ptZ.png', color: '#FF0000' },
];

const MONTHLY_DATA = [
  { month: 'Sep', instagram: 82, others: 45 },
  { month: 'Oct', instagram: 68, others: 58 },
  { month: 'Nov', instagram: 91, others: 38 },
  { month: 'Dec', instagram: 75, others: 52 },
];

const GROWTH_CHART_POINTS = [
  { x: 0, y: 80 },
  { x: 30, y: 60 },
  { x: 60, y: 40 },
  { x: 90, y: 20 },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const barAnimations = useRef(
    [...Array(4)].map(() => ({
      instagram: new Animated.Value(0),
      others: new Animated.Value(0),
    }))
  ).current;
  const orbAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Just Posted To All Socials', read: false, icon: 'upload', time: '2m ago', color: '#8b5cf6' },
    { id: 2, text: 'You Just Hit 10k Likes', read: false, icon: 'heart', time: '1h ago', color: '#fbbf24' },
    { id: 3, text: 'Just Posted To Website', read: false, icon: 'website', time: '3h ago', color: '#10b981' },
  ]);
  const [fullName, setFullName] = useState('RAPDXB'); // Default fallback
  const [profileImage, setProfileImage] = useState('https://i.imgur.com/vhILBC1.png'); // Static default image
  const [platformAnalytics, setPlatformAnalytics] = useState<any>({});
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  // Load user name and analytics data function
  const loadUserName = useCallback(async () => {
    try {
      const storedFullName = await AsyncStorage.getItem('fullName');
      if (storedFullName) {
        setFullName(storedFullName);
      }

      // Load profile image from AsyncStorage (set during login if Instagram is connected)
      const storedProfileUrl = await AsyncStorage.getItem('instagramProfileUrl');
      if (storedProfileUrl && storedProfileUrl !== 'https://i.imgur.com/vhILBC1.png') {
        setProfileImage(storedProfileUrl);
      }

      // Load total followers from AsyncStorage
      const storedFollowers = await AsyncStorage.getItem('totalFollowers');
      if (storedFollowers) {
        setTotalFollowers(parseInt(storedFollowers, 10));
      }

      // Load platform analytics and calculate total likes
      const storedAnalytics = await AsyncStorage.getItem('platformAnalyticsTotals');
      if (storedAnalytics) {
        const analytics = JSON.parse(storedAnalytics);
        setPlatformAnalytics(analytics);

        // Calculate total likes from all platforms
        let totalLikesCount = 0;
        Object.keys(analytics).forEach((platform) => {
          if (analytics[platform] && analytics[platform].likes) {
            totalLikesCount += analytics[platform].likes;
          }
        });
        setTotalLikes(totalLikesCount);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, []);

  // Fetch fullName from AsyncStorage on component mount
  useEffect(() => {
    loadUserName();
  }, [loadUserName]);

  // Refresh fullName when screen comes into focus (e.g., when returning from settings)
  useFocusEffect(
    useCallback(() => {
      loadUserName();
    }, [loadUserName])
  );

  // Format number with K/M suffix
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const onRefresh = () => {
    setRefreshing(true);
    setNotifications([
      { id: 1, text: 'Just Posted To All Socials', read: false, icon: 'upload', time: '2m ago', color: '#8b5cf6' },
      { id: 2, text: 'You Just Hit 10k Likes', read: false, icon: 'heart', time: '1h ago', color: '#fbbf24' },
      { id: 3, text: 'Just Posted To Website', read: false, icon: 'website', time: '3h ago', color: '#10b981' },
    ]);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNotificationPress = (id: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const handleBellPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setShowNotifications(!showNotifications);
  };

  const hasUnreadNotifications = notifications.some(n => !n.read);

  const handleProfilePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace('/(tabs)/settings');
  };

  const handleLogout = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    try {
      await AsyncStorage.clear();
    } catch (err) {
      console.warn('Failed to clear user session', err);
    }
    router.replace('/sign-in');
  };

  useEffect(() => {
    MONTHLY_DATA.forEach((data, index) => {
      Animated.parallel([
        Animated.timing(barAnimations[index].instagram, {
          toValue: data.instagram,
          duration: 1200,
          delay: index * 150,
          useNativeDriver: false,
        }),
        Animated.timing(barAnimations[index].others, {
          toValue: data.others,
          duration: 1200,
          delay: index * 150 + 100,
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, []);

  useEffect(() => {
    const cardWidth = 148;
    const totalWidth = cardWidth * PLATFORM_DATA.length;

    Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: -totalWidth,
        duration: 20000,
        useNativeDriver: true,
        easing: (t) => t,
      }),
      { resetBeforeIteration: true }
    ).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(orbAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 70 }}
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
        <Image
          source={{ uri: 'https://i.imgur.com/Qyjvjv0.png' }}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.6}
          >
            <LogOut color="#ffffff" size={18} strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={handleBellPress}
            activeOpacity={0.6}
          >
            <Bell color="#ffffff" size={18} strokeWidth={1.5} />
            {hasUnreadNotifications && <View style={styles.notificationDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleProfilePress}
            activeOpacity={0.6}
          >
            <Image
              source={{ uri: profileImage, cache: 'reload' }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      {showNotifications && (
        <>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowNotifications(false)}
          />
          <View style={[styles.notificationPopup, { top: insets.top + 60 }]}>
            <View style={styles.notificationContainer}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>Notifications</Text>
              </View>
              {notifications.map((notif) => {
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={styles.notificationItem}
                    onPress={() => handleNotificationPress(notif.id)}
                    activeOpacity={0.7}
                  >
                    {notif.icon === 'heart' && (
                      <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <Path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M11.9932 5.13581C9.9938 2.7984 6.65975 2.16964 4.15469 4.31001C1.64964 6.45038 1.29697 10.029 3.2642 12.5604C4.89982 14.6651 9.84977 19.1041 11.4721 20.5408C11.6536 20.7016 11.7444 20.7819 11.8502 20.8135C11.9426 20.8411 12.0437 20.8411 12.1361 20.8135C12.2419 20.7819 12.3327 20.7016 12.5142 20.5408C14.1365 19.1041 19.0865 14.6651 20.7221 12.5604C22.6893 10.029 22.3797 6.42787 19.8316 4.31001C17.2835 2.19216 13.9925 2.7984 11.9932 5.13581Z"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                    {notif.icon === 'website' && (
                      <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M22 9H2M2 7.8L2 16.2C2 17.8802 2 18.7202 2.32698 19.362C2.6146 19.9265 3.07354 20.3854 3.63803 20.673C4.27976 21 5.11984 21 6.8 21H17.2C18.8802 21 19.7202 21 20.362 20.673C20.9265 20.3854 21.3854 19.9265 21.673 19.362C22 18.7202 22 17.8802 22 16.2V7.8C22 6.11984 22 5.27977 21.673 4.63803C21.3854 4.07354 20.9265 3.6146 20.362 3.32698C19.7202 3 18.8802 3 17.2 3L6.8 3C5.11984 3 4.27976 3 3.63803 3.32698C3.07354 3.6146 2.6146 4.07354 2.32698 4.63803C2 5.27976 2 6.11984 2 7.8Z"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                    {notif.icon === 'upload' && (
                      <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M21 12V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V12M16 7L12 3M12 3L8 7M12 3V15"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                    <View style={styles.notificationTextContainer}>
                      <Text style={styles.notificationText} numberOfLines={1}>{notif.text}</Text>
                      <Text style={styles.notificationTime}>{notif.time}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dismissButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setNotifications(prev => prev.filter(n => n.id !== notif.id));
                      }}
                      activeOpacity={0.6}
                    >
                      <X color="#6b7280" size={20} strokeWidth={2} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </>
      )}

      <View style={styles.greetingContainer}>
        <Text style={styles.greetingHello}>Hello, </Text>
        <Text style={styles.greetingName}>{fullName}</Text>
        <Image
          source={{ uri: 'https://i.imgur.com/5rF4a1S.png' }}
          style={styles.verifiedBadge}
          resizeMode="contain"
        />
      </View>

      <View style={styles.cardsContainer}>
        <View style={styles.topRow}>
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.cardPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Image
              source={{ uri: 'https://i.imgur.com/3k5Bxer.png' }}
              style={styles.cardBackgroundImage}
              resizeMode="cover"
            />
            <View style={styles.cardBottom}>
              <Text style={styles.cardValue}>{formatNumber(totalFollowers)}</Text>
              <Text style={styles.cardLabel}>Followers</Text>
            </View>
          </LinearGradient>

          <View style={styles.cardYellowWrapper}>
            <Svg width="100%" height="100%" viewBox="0 0 200 145" preserveAspectRatio="none" style={{ transform: [{ rotate: '180deg' }] }}>
              <Defs>
                <ClipPath id="yellowClip">
                  <Path d="M 0 0 L 162 0 Q 200 0 200 38 L 200 145 Z" />
                </ClipPath>
                <SvgLinearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#fbbf24" />
                  <Stop offset="100%" stopColor="#f59e0b" />
                </SvgLinearGradient>
              </Defs>
              <G clipPath="url(#yellowClip)">
                <Rect width="200" height="145" fill="url(#yellowGradient)" />
              </G>
            </Svg>
            <Image
              source={{ uri: 'https://i.imgur.com/3k5Bxer.png' }}
              style={styles.cardYellowBackgroundImage}
              resizeMode="cover"
            />
            <View style={styles.cardYellowContent}>
              <View style={styles.cardBottom}>
                <Text style={styles.cardValueDark}>{formatNumber(totalLikes)}</Text>
                <Text style={styles.cardLabelDark}>Likes</Text>
              </View>
            </View>
          </View>
        </View>

        <LinearGradient
          colors={['#60a5fa', '#3b82f6']}
          style={styles.cardBlue}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Image
            source={{ uri: 'https://i.imgur.com/Y4IXN1r.png' }}
            style={styles.cardBlueBackgroundImage}
            resizeMode="cover"
          />

          <View style={styles.analyticsContent}>
            <View style={styles.analyticsHeader}>
              <BarChart color="#ffffff" size={21} strokeWidth={2.5} />
              <Text style={styles.analyticsTitle}>Social Analytics</Text>
            </View>

            <View style={styles.chartWrapper}>
              <View style={styles.chartArea}>
                <View style={styles.barsContainer}>
                  {MONTHLY_DATA.map((data, index) => {
                    const instagramHeight = barAnimations[index].instagram.interpolate({
                      inputRange: [0, 100],
                      outputRange: [0, 110],
                    });
                    const othersHeight = barAnimations[index].others.interpolate({
                      inputRange: [0, 100],
                      outputRange: [0, 110],
                    });

                    return (
                      <View key={data.month} style={styles.barColumn}>
                        <View style={styles.barPair}>
                          <View style={styles.barContainer}>
                            <Animated.View
                              style={[
                                styles.barInstagram,
                                { height: instagramHeight }
                              ]}
                            />
                          </View>
                          <View style={styles.barContainer}>
                            <Animated.View
                              style={[
                                styles.barOthers,
                                { height: othersHeight }
                              ]}
                            />
                          </View>
                        </View>
                        <Text style={styles.xAxisLabel}>{data.month}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

          </View>

          <View style={styles.scrollBannerWrapper}>
            <Animated.View style={[styles.scrollingBanner, { transform: [{ translateX: scrollAnim }] }]}>
              {[...PLATFORM_DATA, ...PLATFORM_DATA].map((platform, idx) => (
                <View key={idx} style={styles.platformCard}>
                  <View style={styles.platformCardContent}>
                    {platform.icon.startsWith('http') ? (
                      <Image
                        source={{ uri: platform.icon }}
                        style={styles.cardIconImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.cardEmoji}>{platform.icon}</Text>
                    )}
                    <View style={styles.platformTextGroup}>
                      <Text style={styles.cardPlatform}>{platform.name}</Text>
                      <View style={styles.platformMetrics}>
                        <Text style={styles.cardMetric}>{platform.followers}</Text>
                        <View style={styles.metricDot} />
                        <Text style={styles.cardMetric}>{platform.likes}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
        </LinearGradient>

        <View style={styles.bottomRow}>
          <View style={styles.circleCardWrapper}>
            <LinearGradient
              colors={['#a3e635', '#84cc16']}
              style={styles.cardGreen}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Image
                source={{ uri: 'https://i.imgur.com/O9spy4H.png' }}
                style={styles.cardGreenBackgroundImage}
                resizeMode="cover"
              />
              <View style={styles.cardCenterContent}>
                <Text style={styles.cardValueDark}>7-9PM</Text>
                <Text style={styles.cardLabelDark}>Posting Hours</Text>
              </View>
            </LinearGradient>
          </View>

          <LinearGradient
            colors={['#fb923c', '#f97316']}
            style={styles.cardOrange}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={StyleSheet.absoluteFill}>
              <Svg
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                preserveAspectRatio="none">
                <Defs>
                  <Pattern
                    id="orangeLines"
                    x="0"
                    y="0"
                    width="5"
                    height="5"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-45)">
                    <Line
                      x1="0"
                      y1="2.5"
                      x2="5"
                      y2="2.5"
                      stroke="#dc2626"
                      strokeWidth="0.5"
                      opacity="0.2"
                    />
                  </Pattern>
                </Defs>
                <Rect x="0" y="0" width="100" height="100" fill="url(#orangeLines)" />
              </Svg>
            </View>
            <Svg
              style={styles.growthChartSvg}
              viewBox="0 0 100 100"
              preserveAspectRatio="none">
              <Path
                d="M0,75 Q15,55 25,55 Q35,55 45,75 Q55,95 65,75 Q75,55 85,35 Q92,20 100,5 Q105,0 110,-2 Q115,-3 120,-3"
                stroke="#a855f7"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Defs>
                <RadialGradient id="orbGlow" cx="50%" cy="50%">
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                  <Stop offset="70%" stopColor="#ffffff" stopOpacity="0.05" />
                  <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <AnimatedCircle
                cx={orbAnim.interpolate({
                  inputRange: [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.76, 0.8, 0.84, 0.88, 0.92, 0.96, 0.97, 0.98, 0.99, 0.995, 1],
                  outputRange: [0, 3, 6, 9, 12, 15, 18, 21, 24, 25, 28, 31, 35, 39, 43, 47, 51, 55, 59, 63, 67, 72, 77, 83, 90, 100, 105, 110, 115, 120],
                })}
                cy={orbAnim.interpolate({
                  inputRange: [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.76, 0.8, 0.84, 0.88, 0.92, 0.96, 0.97, 0.98, 0.99, 0.995, 1],
                  outputRange: [75, 73, 70, 67, 63, 60, 58, 56.5, 55.5, 55, 55.2, 56, 58, 62, 68, 75, 80, 83, 84, 83, 79, 72, 62, 48, 30, 5, 0, -2, -3, -3],
                })}
                r="6"
                fill="url(#orbGlow)"
              />
              <AnimatedCircle
                cx={orbAnim.interpolate({
                  inputRange: [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.76, 0.8, 0.84, 0.88, 0.92, 0.96, 0.97, 0.98, 0.99, 0.995, 1],
                  outputRange: [0, 3, 6, 9, 12, 15, 18, 21, 24, 25, 28, 31, 35, 39, 43, 47, 51, 55, 59, 63, 67, 72, 77, 83, 90, 100, 105, 110, 115, 120],
                })}
                cy={orbAnim.interpolate({
                  inputRange: [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.76, 0.8, 0.84, 0.88, 0.92, 0.96, 0.97, 0.98, 0.99, 0.995, 1],
                  outputRange: [75, 73, 70, 67, 63, 60, 58, 56.5, 55.5, 55, 55.2, 56, 58, 62, 68, 75, 80, 83, 84, 83, 79, 72, 62, 48, 30, 5, 0, -2, -3, -3],
                })}
                r="3"
                fill="#ffffff"
              />
            </Svg>
            <View style={styles.cardTop}>
              <Text style={styles.cardValue}>13.4%</Text>
              <Text style={styles.cardLabel}>Growth this month</Text>
            </View>
          </LinearGradient>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 48,
    height: 48,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutButton: {
    width: 48,
    height: 48,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 6,
    height: 6,
    backgroundColor: '#ef4444',
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  greetingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  greetingHello: {
    fontSize: 44,
    fontFamily: 'Inter-Thin',
    color: '#ffffff',
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  greetingName: {
    fontSize: 44,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  verifiedBadge: {
    width: 28,
    height: 28,
    marginLeft: 8,
    marginTop: 10,
  },
  cardsContainer: {
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    gap: 10,
    height: 145,
  },
  cardPurple: {
    width: 145,
    height: 145,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 38,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cardBackgroundImage: {
    position: 'absolute',
    top: -110,
    right: -110,
    width: 210,
    height: 210,
    opacity: 0.4,
  },
  cardBlueBackgroundImage: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    width: 'auto',
    height: 'auto',
    opacity: 0.3,
  },
  cardYellowWrapper: {
    flex: 1,
    height: 145,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderRadius: 38,
  },
  cardYellowBackgroundImage: {
    position: 'absolute',
    bottom: -73,
    left: -110,
    width: 210,
    height: 210,
    opacity: 0.3,
    transform: [{ rotate: '180deg' }],
  },
  cardYellowContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'flex-end',
  },
  cardBlue: {
    width: '100%',
    height: 270,
    borderRadius: 38,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  analyticsTitle: {
    fontSize: 19.5,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  analyticsContent: {
    gap: 8,
    paddingTop: 8,
  },
  chartWrapper: {
    height: 140,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingTop: 60,
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 110,
  },
  barContainer: {
    width: 14,
    height: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'flex-end',
  },
  barInstagram: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
  },
  barOthers: {
    width: '100%',
    backgroundColor: '#ffffff',
    opacity: 0.4,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
  },
  xAxisLabel: {
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-start',
  },
  legendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSquare: {
    width: 6,
    height: 6,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  legendLabel: {
    fontSize: 8,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    opacity: 0.7,
  },
  scrollBannerWrapper: {
    overflow: 'hidden',
    height: 36,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  scrollingBanner: {
    flexDirection: 'row',
    gap: 8,
  },
  platformCard: {
    width: 140,
  },
  platformCardContent: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardEmoji: {
    fontSize: 14,
  },
  cardIconImage: {
    width: 14,
    height: 14,
  },
  platformTextGroup: {
    flex: 1,
    gap: 1,
  },
  cardPlatform: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  platformMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardMetric: {
    fontSize: 7.5,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    opacity: 0.8,
  },
  metricDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#ffffff',
    opacity: 0.5,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
    height: 160,
  },
  circleCardWrapper: {
    width: 160,
    height: 160,
  },
  cardGreen: {
    width: 160,
    height: 160,
    borderRadius: 80,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a3e635',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGreenBackgroundImage: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 320,
    height: 320,
    opacity: 0.3,
  },
  cardOrange: {
    flex: 1,
    height: 160,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 0,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    shadowColor: '#fb923c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  growthChartSvg: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  growthOrb: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  patternSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cardTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    gap: 1,
  },
  iconEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  iconTopLeft: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  iconTopLeftCircle: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  cardBottom: {
    gap: 1,
  },
  cardBottomCenter: {
    gap: 1,
    alignItems: 'center',
  },
  cardTopCenter: {
    gap: 1,
    alignItems: 'center',
    paddingTop: 8,
  },
  cardCenterContent: {
    gap: 1,
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 34,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    letterSpacing: -1,
    lineHeight: 38,
  },
  cardValueDark: {
    fontSize: 34,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    letterSpacing: -1,
    lineHeight: 38,
  },
  cardValueLarge: {
    fontSize: 38,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    letterSpacing: -1,
    lineHeight: 42,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    opacity: 0.9,
    letterSpacing: -0.2,
    lineHeight: 17,
  },
  cardLabelDark: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#000000',
    opacity: 0.8,
    letterSpacing: -0.2,
    lineHeight: 17,
  },
  miniBarChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    position: 'absolute',
    bottom: 32,
    left: -10,
    right: -10,
    height: 40,
  },
  miniBar: {
    flex: 1,
    backgroundColor: '#fbbf24',
    borderRadius: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 9998,
  },
  notificationPopup: {
    position: 'absolute',
    right: 16,
    width: 380,
    zIndex: 9999,
  },
  notificationContainer: {
    backgroundColor: '#000000',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 24,
  },
  notificationHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  notificationTitle: {
    fontSize: 18,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  notificationTextContainer: {
    flex: 1,
    gap: 2,
  },
  notificationText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  dismissButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
