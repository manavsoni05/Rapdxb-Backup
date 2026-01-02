import { Tabs, router } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { usePathname } from 'expo-router';
import { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

function HomeIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.tabIconOuter, focused && styles.tabIconOuterFocused]}>
      <LinearGradient
        colors={focused ? ['#ffffff', '#e5e5e5'] : ['#404040', '#2a2a2a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tabIconGradient}>
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 21V13.6C9 13.0399 9 12.7599 9.109 12.546C9.20487 12.3578 9.35785 12.2049 9.54601 12.109C9.75992 12 10.0399 12 10.6 12H13.4C13.9601 12 14.2401 12 14.454 12.109C14.6422 12.2049 14.7951 12.3578 14.891 12.546C15 12.7599 15 13.0399 15 13.6V21M11.0177 2.76403L4.23539 8.03915C3.78202 8.39176 3.55534 8.56807 3.39203 8.78887C3.24737 8.98446 3.1396 9.2048 3.07403 9.43907C3 9.70355 3 9.99073 3 10.5651V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V10.5651C21 9.99073 21 9.70355 20.926 9.43907C20.8604 9.2048 20.7526 8.98446 20.608 8.78887C20.4447 8.56807 20.218 8.39176 19.7646 8.03915L12.9823 2.76403C12.631 2.49078 12.4553 2.35415 12.2613 2.30163C12.0902 2.25529 11.9098 2.25529 11.7387 2.30163C11.5447 2.35415 11.369 2.49078 11.0177 2.76403Z"
            stroke={focused ? '#1a1a1a' : '#ffffff'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </LinearGradient>
    </View>
  );
}

function FeedIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.tabIconOuter, focused && styles.tabIconOuterFocused]}>
      <LinearGradient
        colors={focused ? ['#ffffff', '#e5e5e5'] : ['#404040', '#2a2a2a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tabIconGradient}>
        <Svg width="24" height="24" viewBox="0 0 50 50" fill="none">
          <Path
            d="M8.33332 34.3748C8.33332 37.8265 11.1316 40.6248 14.5833 40.6248C14.5833 43.5013 16.9152 45.8331 19.7917 45.8331C22.6681 45.8331 25 43.5013 25 40.6248C25 43.5013 27.3319 45.8329 30.2083 45.8329C33.0848 45.8329 35.4167 43.501 35.4167 40.6246C38.8685 40.6246 41.6667 37.8263 41.6667 34.3746C41.6667 33.1898 41.3371 32.0821 40.7646 31.1381C43.6514 30.5858 45.8333 28.0475 45.8333 24.9996C45.8333 21.9515 43.6514 19.4131 40.7646 18.8609C41.3371 17.9169 41.6667 16.8092 41.6667 15.6245C41.6667 12.1727 38.8685 9.3745 35.4167 9.3745C35.4167 6.498 33.0848 4.16617 30.2083 4.16617C27.3319 4.16617 25 6.49821 25 9.37469C25 6.49821 22.6681 4.16636 19.7917 4.16636C16.9152 4.16636 14.5833 6.49821 14.5833 9.37469C11.1316 9.37469 8.33332 12.1729 8.33332 15.6247C8.33332 16.8094 8.66295 17.9171 9.23549 18.8611C6.34847 19.4133 4.16666 21.9517 4.16666 24.9998C4.16666 28.0477 6.34847 30.586 9.23549 31.1383C8.66295 32.0823 8.33332 33.19 8.33332 34.3748Z"
            stroke={focused ? '#1a1a1a' : '#ffffff'}
            strokeWidth="3.125"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M15.625 30.2081L19.4623 18.6963C19.659 18.1061 20.2112 17.7081 20.8333 17.7081C21.4554 17.7081 22.0077 18.1061 22.2044 18.6963L26.0417 30.2081M32.2917 17.7081V30.2081M17.7083 26.0414H23.9583"
            stroke={focused ? '#1a1a1a' : '#ffffff'}
            strokeWidth="3.125"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </LinearGradient>
    </View>
  );
}

function PostButton() {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    router.replace('/(tabs)/post');
  };

  return (
    <View style={styles.postButtonOuter}>
      <TouchableOpacity
        style={styles.postButton}
        activeOpacity={0.7}
        onPress={handlePress}
      >
        <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <Path
            d="M16 12L12 8M12 8L8 12M12 8V17.2C12 18.5907 12 19.2861 12.5505 20.0646C12.9163 20.5819 13.9694 21.2203 14.5972 21.3054C15.5421 21.4334 15.9009 21.2462 16.6186 20.8719C19.8167 19.2036 22 15.8568 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 15.7014 4.01099 18.9331 7 20.6622"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
}

function AnalyticsIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.tabIconOuter, focused && styles.tabIconOuterFocused]}>
      <LinearGradient
        colors={focused ? ['#ffffff', '#e5e5e5'] : ['#404040', '#2a2a2a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tabIconGradient}>
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3M20 8L16.0811 12.1827C15.9326 12.3412 15.8584 12.4204 15.7688 12.4614C15.6897 12.4976 15.6026 12.5125 15.516 12.5047C15.4179 12.4958 15.3215 12.4458 15.1287 12.3457L11.8713 10.6543C11.6785 10.5542 11.5821 10.5042 11.484 10.4953C11.3974 10.4875 11.3103 10.5024 11.2312 10.5386C11.1416 10.5796 11.0674 10.6588 10.9189 10.8173L7 15"
            stroke={focused ? '#1a1a1a' : '#ffffff'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </LinearGradient>
    </View>
  );
}

function AccountIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.tabIconOuter, focused && styles.tabIconOuterFocused]}>
      <LinearGradient
        colors={focused ? ['#ffffff', '#e5e5e5'] : ['#404040', '#2a2a2a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tabIconGradient}>
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M22 21V19C22 17.1362 20.7252 15.5701 19 15.126M15.5 3.29076C16.9659 3.88415 18 5.32131 18 7C18 8.67869 16.9659 10.1159 15.5 10.7092M17 21C17 19.1362 17 18.2044 16.6955 17.4693C16.2895 16.4892 15.5108 15.7105 14.5307 15.3045C13.7956 15 12.8638 15 11 15H8C6.13623 15 5.20435 15 4.46927 15.3045C3.48915 15.7105 2.71046 16.4892 2.30448 17.4693C2 18.2044 2 19.1362 2 21M13.5 7C13.5 9.20914 11.7091 11 9.5 11C7.29086 11 5.5 9.20914 5.5 7C5.5 4.79086 7.29086 3 9.5 3C11.7091 3 13.5 4.79086 13.5 7Z"
            stroke={focused ? '#1a1a1a' : '#ffffff'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </LinearGradient>
    </View>
  );
}

export default function TabLayout() {
  const pathname = usePathname();
  const translateX = useSharedValue(0);

  const tabs = ['home', 'feed', 'post', 'stats', 'settings'];
  let currentIndex = -1;

  const isOnHome = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/' || pathname.includes('/home');

  if (isOnHome) {
    currentIndex = 0;
  } else if (pathname.includes('/feed')) {
    currentIndex = 1;
  } else if (pathname.includes('/post')) {
    currentIndex = 2;
  } else if (pathname.includes('/stats')) {
    currentIndex = 3;
  } else if (pathname.includes('/settings')) {
    currentIndex = 4;
  }

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const navigateToTab = (direction: number) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < tabs.length) {
      const newTab = tabs[newIndex];
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      router.replace(`/(tabs)/${newTab}` as any);
    }
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-25, 25])
    .onUpdate((event) => {
      translateX.value = event.translationX * 0.5;
    })
    .onEnd((event) => {
      const threshold = 30;

      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });

      if (Math.abs(event.translationX) > threshold) {
        if (event.translationX > 0) {
          navigateToTab(-1);
        } else {
          navigateToTab(1);
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const TabBarBackgroundWithGesture = () => (
    <View style={styles.tabBarBackground}>
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[styles.tabBarContainer, animatedStyle]} />
      </GestureDetector>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 78.4,
          paddingBottom: 9.8,
          paddingTop: 0,
          position: 'absolute',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: TabBarBackgroundWithGesture,
        tabBarShowLabel: false,
      }}
      screenListeners={{
        tabPress: handleTabPress,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <HomeIcon focused={isOnHome || focused} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ focused }) => <FeedIcon focused={!isOnHome && focused} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          tabBarIcon: () => <PostButton />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ focused }) => <AnalyticsIcon focused={!isOnHome && focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <AccountIcon focused={!isOnHome && focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 98,
    justifyContent: 'flex-end',
    paddingBottom: 31.36,
    paddingHorizontal: 11.76,
  },
  tabBarContainer: {
    height: 54.88,
    backgroundColor: '#1a1a1a',
    borderRadius: 27.44,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3.92,
    },
    shadowOpacity: 0.5,
    shadowRadius: 15.68,
    elevation: 12,
    width: '100%',
  },
  tabIconOuter: {
    width: 47.04,
    height: 47.04,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 23.52,
    padding: 1.96,
    marginTop: -1.96,
  },
  tabIconOuterFocused: {
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 1.96,
    },
    shadowOpacity: 0.4,
    shadowRadius: 7.84,
    elevation: 6,
  },
  tabIconGradient: {
    width: 43.12,
    height: 43.12,
    borderRadius: 21.56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonOuter: {
    width: 62.72,
    height: 62.72,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -31.36,
  },
  postButton: {
    width: 62.72,
    height: 62.72,
    borderRadius: 31.36,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 5.88,
    },
    shadowOpacity: 0.5,
    shadowRadius: 15.68,
    elevation: 14,
  },
});
