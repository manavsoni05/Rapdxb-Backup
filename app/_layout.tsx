import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_100Thin } from '@expo-google-fonts/inter';
import { Archivo_700Bold } from '@expo-google-fonts/archivo';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { NotificationProvider } from '@/contexts/NotificationContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Thin': Inter_100Thin,
    'Inter-Light': Inter_300Light,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Archivo-Bold': Archivo_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Deep link listener for OAuth redirects
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);
      
      // Close any open WebBrowser
      await WebBrowser.dismissBrowser();
      
      // Parse the URL to get the path
      const { path } = Linking.parse(url);
      
      // Navigate to the appropriate screen
      if (path === 'settings') {
        console.log('Navigating to settings...');
        // Navigate immediately
        router.replace('/(tabs)/settings');
        
        // Force refresh after 1 second
        setTimeout(() => {
          console.log('Refreshing settings page...');
          router.replace('/(tabs)/settings');
        }, 10000);
      }
    };

    // Listen for incoming deep links while app is open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep link if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </NotificationProvider>
    </GestureHandlerRootView>
  );
}
