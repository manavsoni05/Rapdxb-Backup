import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, ToastAndroid, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Lock, Mail, User } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default profile image to ensure "image" field exists in DB
  const DEFAULT_PROFILE_IMAGE = 'https://i.imgur.com/vhILBC1.png';

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSignUp = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // --- Validation ---
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }

    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setIsSubmitting(true);

    try {
      // Sending data to n8n Webhook
      const response = await fetch('https://n8n-production-0558.up.railway.app/webhook/8113c0e2-23cc-4aa3-9950-86a3d825ca3c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // We structure the body to match your Database requirements
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: password, // Note: Ideally, hash this in n8n before storing in Firebase
          description: `${trimmedName} workspace`,
          profileImage: DEFAULT_PROFILE_IMAGE,
          created_at: new Date().toISOString(),
          type: 'user_signup'
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to create user. Server responded with error.');
      }

      const data = await response.json();

      // We expect n8n to return the created { userId: "..." }
      if (data?.userId) {
        await AsyncStorage.setItem('userId', data.userId);
        
        // Optional: Store other user details locally for quick access
        await AsyncStorage.setItem('name', trimmedName);
        await AsyncStorage.setItem('userEmail', trimmedEmail);
        await AsyncStorage.setItem('userImage', DEFAULT_PROFILE_IMAGE);

        showToast('Account created successfully!');
        router.replace('/(tabs)/home');
        return;
      }

      throw new Error('Invalid response from server.');
    } catch (apiError) {
      console.error('Sign up error:', apiError);
      const fallbackMessage = apiError instanceof Error ? apiError.message : 'Something went wrong. Please try again.';
      setError(fallbackMessage);
      showToast('Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (error) setError(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.spacer} />
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>Create your account</Text>
          <Text style={styles.brandName}>Social AI</Text>
        </View>

        <View style={styles.formSection}>
          {/* Name Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconWrapper}>
              <User color="rgba(255, 255, 255, 0.5)" size={20} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={name}
              onChangeText={handleNameChange}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Email Input */}
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
              returnKeyType="next"
            />
          </View>

          {/* Password Input */}
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
              returnKeyType="next"
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconWrapper}>
              <Lock color="rgba(255, 255, 255, 0.5)" size={20} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity activeOpacity={0.8} onPress={handleSignUp} disabled={isSubmitting}>
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerAction}>
            <Text style={styles.secondaryText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/sign-in')}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
    flex: 0.15, // Reduced slightly to fit more fields
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
    marginBottom: 40,
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
    fontSize: 48,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  formSection: {
    gap: 18,
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
  errorText: {
    color: '#f87171',
    fontSize: 14,
    fontFamily: 'Archivo-Regular',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginTop: -4,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
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
    marginTop: 4,
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
});
