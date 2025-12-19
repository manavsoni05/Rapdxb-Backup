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
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 20H5.2C4.07989 20 3.51984 20 3.09202 19.782C2.71569 19.5903 2.40973 19.2843 2.21799 18.908C2 18.4802 2 17.9201 2 16.8V7.2C2 6.07989 2 5.51984 2.21799 5.09202C2.40973 4.71569 2.71569 4.40973 3.09202 4.21799C3.51984 4 4.07989 4 5.2 4H5.6C7.84021 4 8.96031 4 9.81596 4.43597C10.5686 4.81947 11.1805 5.43139 11.564 6.18404C12 7.03968 12 8.15979 12 10.4M12 20V10.4M12 20H18.8C19.9201 20 20.4802 20 20.908 19.782C21.2843 19.5903 21.5903 19.2843 21.782 18.908C22 18.4802 22 17.9201 22 16.8V7.2C22 6.07989 22 5.51984 21.782 5.09202C21.5903 4.71569 21.2843 4.40973 20.908 4.21799C20.4802 4 19.9201 4 18.8 4H18.4C16.1598 4 15.0397 4 14.184 4.43597C13.4314 4.81947 12.8195 5.43139 12.436 6.18404C12 7.03968 12 8.15979 12 10.4"
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
      router.replace(`/(tabs)/${newTab}`);
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
      initialRouteName="home"
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
        name="community"
        options={{
          href: null,
        }}
      />
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
          unmountOnBlur: true,
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
