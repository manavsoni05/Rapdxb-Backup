import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Lock, Mail } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGIN_API_URL = 'https://n8n-production-0558.up.railway.app/webhook/Login';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setLoading(true);

    try {
      console.log('Starting login request...');
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      console.log('Sending request to:', LOGIN_API_URL);
      const response = await fetch(LOGIN_API_URL, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Login Response - Full Data:', JSON.stringify(data, null, 2));
      console.log('Login Response - Success:', data.success);
      console.log('Login Response - User ID:', data.user?._id);
      console.log('Login Response - Full Name:', data.user?.fullName);
      console.log('Login Response - Instagram Profile URL:', data.user?.instagramProfileUrl);
      console.log('Login Response - Total Followers:', data.user?.totalFollowers);
      console.log('Login Response - Connected Usernames:', data.user?.connectedUsernames);
      console.log('Login Response - Platform Analytics:', data.platformAnalyticsTotals);
      
      // Check success status from backend
      if (data.success === true && data.user && data.user._id) {
        console.log('Login successful, storing user data...');
        
        // Store email and fullName in AsyncStorage
        const userEmail = data.user._id; // Backend returns email in _id field
        const fullName = data.user.fullName || 'RAPDXB'; // Get fullName from API response
        const totalFollowers = data.user.totalFollowers || 0; // Get totalFollowers from API response
        const connectedUsernames = data.user.connectedUsernames || {}; // Get connectedUsernames from API response
        const instagramProfileUrl = data.user.instagramProfileUrl || 'https://i.imgur.com/vhILBC1.png'; // Get profile image URL
        const platformAnalyticsTotals = data.platformAnalyticsTotals || {}; // Get platform analytics data
        const platformFollowers = data.platformFollowers || []; // Get platform followers data
        
        await AsyncStorage.setItem('email', userEmail);
        await AsyncStorage.setItem('fullName', fullName);
        await AsyncStorage.setItem('totalFollowers', String(totalFollowers));
        await AsyncStorage.setItem('connectedUsernames', JSON.stringify(connectedUsernames));
        await AsyncStorage.setItem('instagramProfileUrl', instagramProfileUrl);
        await AsyncStorage.setItem('platformAnalyticsTotals', JSON.stringify(platformAnalyticsTotals));
        await AsyncStorage.setItem('platformFollowers', JSON.stringify(platformFollowers));
        
        console.log('Email, fullName, totalFollowers, connectedUsernames, instagramProfileUrl, and platformAnalyticsTotals stored successfully:', userEmail, fullName, totalFollowers, connectedUsernames, instagramProfileUrl, platformAnalyticsTotals);
        console.log('Redirecting to home...');
        
        // Redirect to home
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 100);
      } else {
        console.log('Login failed - Invalid credentials');
        const message = data.message || 'Invalid credentials. Please try again.';
        Alert.alert('Login Failed', message);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'Unable to sign in. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.spacer} />
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.brandName}>Social AI</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconWrapper}>
              <Mail color="rgba(255, 255, 255, 0.5)" size={20} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIconWrapper}>
              <Lock color="rgba(255, 255, 255, 0.5)" size={20} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSignIn}
            disabled={loading}
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>


        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  spacer: {
    flex: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'flex-start',
    alignItems: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  headerSection: {
    marginBottom: 48,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontFamily: 'Archivo-Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  brandName: {
    fontSize: 52,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -2,
    textAlign: 'center',
  },
  formSection: {
    gap: 20,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
  },
  inputIconWrapper: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    fontFamily: 'Archivo-Regular',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  signInButton: {
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  signInButtonText: {
    fontSize: 17,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  footerAction: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  secondaryText: {
    fontSize: 14,
    fontFamily: 'Archivo-Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: -0.3,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Archivo-Bold',
    color: '#3b82f6',
    letterSpacing: -0.3,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
});
