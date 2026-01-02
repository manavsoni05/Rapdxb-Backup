import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, TextInput, Animated, Dimensions, RefreshControl, Image, Modal, Alert, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Upload, Calendar, X, Image as ImageIcon, Video, Check, Plus, Globe, Mic, Square, Maximize2, Layout, Sparkles } from 'lucide-react-native';
import Svg, { Circle, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useState, useRef, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestMicrophonePermission } from '@/lib/permissions';
import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
  AudioEncodingAndroid,
} from 'expo-speech-recognition';
import AnimatedWave from '@/components/AnimatedWave';
import { useNotification } from '@/contexts/NotificationContext';

const { width } = Dimensions.get('window');

const CREATE_POST_ENDPOINT = 'https://n8n-production-0558.up.railway.app/webhook/create-post';
const CREATE_REEL_ENDPOINT = 'https://n8n-production-0558.up.railway.app/webhook/create-reel';
const CREATE_CAROUSEL_ENDPOINT = 'https://n8n-production-0558.up.railway.app/webhook/create-carousels';
const CREATE_STORY_ENDPOINT = 'https://n8n-production-0558.up.railway.app/webhook/create-story';
const CHECK_STATUS_URL = 'https://n8n-production-0558.up.railway.app/webhook/check-connection-status';
const CAPTION_RECREATE_URL = 'https://n8n-production-0558.up.railway.app/webhook/captionRecreate';

const PLATFORMS_POST = ['Instagram', 'Facebook', 'Twitter', 'Snapchat', 'All'];
const PLATFORMS_REEL = ['Instagram Reels', 'YouTube Shorts', 'TikTok', 'Facebook Reels', 'Snapchat', 'All'];

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'https://i.imgur.com/vkcuEzE.png', color: ['#E1306C', '#C13584'] },
  { id: 'tiktok', name: 'TikTok', icon: 'https://i.imgur.com/K2FKVUP.png', color: ['#000000', '#333333'] },
  { id: 'youtube', name: 'YouTube', icon: 'https://i.imgur.com/8H35ptZ.png', color: ['#FF0000', '#DC143C'] },
  { id: 'snapchat', name: 'Snapchat', icon: 'https://i.imgur.com/XF3FRka.png', color: ['#FFFC00', '#FFA500'] },
  { id: 'twitter', name: 'Twitter', icon: 'https://i.imgur.com/fPOjKNr.png', color: ['#1DA1F2', '#1a8cd8'] },
  { id: 'facebook', name: 'Facebook', icon: 'https://i.imgur.com/zfY36en.png', color: ['#1877F2', '#0a5fd1'] },
];

const MIME_EXTENSIONS: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  m4v: 'video/x-m4v',
};

const getFileNameFromUri = (uri: string, fallback: string) => {
  const cleaned = decodeURIComponent(uri.split('?')[0] ?? '');
  const candidate = cleaned.split('/').pop();
  if (candidate && candidate.length > 0 && !candidate.startsWith('blob:')) {
    return candidate;
  }
  return fallback;
};

const getMimeTypeFromUri = (uri: string, fallback: string) => {
  const cleaned = uri.split('?')[0] ?? '';
  const ext = cleaned.split('.').pop()?.toLowerCase();
  if (ext && MIME_EXTENSIONS[ext]) {
    return MIME_EXTENSIONS[ext];
  }
  return fallback;
};

const readBlobAsBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const result = reader.result;
    if (typeof result === 'string') {
      const [, base64] = result.split(',');
      resolve(base64 ?? '');
    } else {
      reject(new Error('Failed to convert blob to base64'));
    }
  };
  reader.onerror = () => reject(new Error('Unable to read blob as base64'));
  reader.readAsDataURL(blob);
});

type ConvertedMedia = {
  base64Data: string;
  mimeType: string;
  fileName: string;
  blob?: Blob | null;
  fileUri?: string;
  cleanupUri?: string | null;
};

const convertUriToBase64 = async (uri: string, fallbackMimeType: string): Promise<ConvertedMedia> => {
  const defaultExtension = fallbackMimeType.includes('video') ? 'mp4' : 'jpg';
  const defaultName = `upload-${Date.now()}.${defaultExtension}`;
  if (Platform.OS === 'web') {
    if (uri.startsWith('data:')) {
      const [, base64] = uri.split(',');
      const mimeType = getMimeTypeFromUri(uri, fallbackMimeType);
      let blob: Blob | null = null;
      try {
        const response = await fetch(uri);
        blob = await response.blob();
      } catch {
        try {
          const binary = Uint8Array.from(atob(base64 ?? ''), char => char.charCodeAt(0));
          blob = new Blob([binary], { type: mimeType });
        } catch {
          blob = null;
        }
      }
      return {
        base64Data: base64 ?? '',
        mimeType,
        fileName: getFileNameFromUri(uri, defaultName),
        blob,
      };
    }

    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Unable to download media (${response.status})`);
    }
    const blob = await response.blob();
    const base64Data = await readBlobAsBase64(blob);
    return {
      base64Data,
      mimeType: blob.type || getMimeTypeFromUri(uri, fallbackMimeType),
      fileName: getFileNameFromUri(uri, defaultName),
      blob,
    };
  }

  let targetUri = uri;
  let cleanupUri: string | null = null;

  if (!uri.startsWith('file://')) {
    const downloadTarget = `${FileSystem.cacheDirectory}${Date.now()}-upload`;
    const downloadResult = await FileSystem.downloadAsync(uri, downloadTarget);
    if (!downloadResult || !downloadResult.uri) {
      throw new Error('Unable to prepare remote media file for upload');
    }
    targetUri = downloadResult.uri;
    cleanupUri = downloadResult.uri;
  } else {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Selected media file no longer exists on device');
    }
  }

  const base64Data = await FileSystem.readAsStringAsync(targetUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const result: ConvertedMedia = {
    base64Data,
    mimeType: getMimeTypeFromUri(uri, fallbackMimeType),
    fileName: getFileNameFromUri(uri, defaultName),
    fileUri: targetUri,
    cleanupUri,
  };

  if (cleanupUri) {
    result.cleanupUri = cleanupUri;
  }

  return result;
};

const FEED_DATA = [
  {
    id: 1,
    platform: 'Instagram',
    platformIcon: 'https://i.imgur.com/vkcuEzE.png',
    thumbnail: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Drake Announces New Album',
    source: '@complexmusic',
  },
  {
    id: 2,
    platform: 'YouTube',
    platformIcon: 'https://i.imgur.com/8H35ptZ.png',
    thumbnail: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Kendrick Lamar Performance',
    source: '@geniusofficial',
  },
  {
    id: 3,
    platform: 'TikTok',
    platformIcon: 'https://i.imgur.com/K2FKVUP.png',
    thumbnail: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Ice Spice New Single',
    source: '@rapvibes',
  },
  {
    id: 4,
    platform: 'Web',
    platformIcon: 'https://i.imgur.com/aXfHxEZ.png',
    thumbnail: 'https://images.pexels.com/photos/1644888/pexels-photo-1644888.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'J. Cole Interview',
    source: 'Complex',
  },
];

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const { showPostNotification, hidePostNotification } = useNotification();
  const [contentType, setContentType] = useState<'post' | 'reel' | 'story'>('post');
  const [postType, setPostType] = useState<'single' | 'carousel'>('single');
  // Commented out for future use - Title field related state
  // const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [mediaOrder, setMediaOrder] = useState<string[]>([]);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  // Commented out for future use - Title recording related states
  // const [isRecordingTitle, setIsRecordingTitle] = useState(false);
  const [isRecordingCaption, setIsRecordingCaption] = useState(false);
  const [isRegeneratingCaption, setIsRegeneratingCaption] = useState(false);
  // const recognitionTitle = useRef<any>(null);
  const recognitionCaption = useRef<any>(null);
  // const lastResultIndexTitle = useRef<number>(0);
  const lastResultIndexCaption = useRef<number>(0);
  // Commented out for future use - Story Style related state
  // const [selectedBannerId, setSelectedBannerId] = useState('agXkA3Dw0zNEbW2VBY'); // Default

  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [confirmedPosts, setConfirmedPosts] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [notification, setNotification] = useState<{type: 'error' | 'success' | 'info'; message: string} | null>(null);
  const notificationOpacity = useRef(new Animated.Value(0)).current;

  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;

  const showNotification = (type: 'error' | 'success' | 'info', message: string) => {
    setNotification({ type, message });
    Animated.sequence([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setNotification(null));
  };

  const savePostState = async (state: 'posting' | 'failed', postData: any) => {
    try {
      await AsyncStorage.setItem('pendingPost', JSON.stringify({
        state,
        postData,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.log('Failed to save post state');
    }
  };

  const clearPostState = async () => {
    try {
      await AsyncStorage.removeItem('pendingPost');
    } catch (error) {
      console.log('Failed to clear post state');
    }
  };

  const retryFailedPost = async () => {
    const pendingPostString = await AsyncStorage.getItem('pendingPost');
    if (!pendingPostString) return;
    
    const pendingPost = JSON.parse(pendingPostString);
    hidePostNotification();
    await clearPostState();
    
    // Restore form data and resubmit
    const postData = pendingPost.postData;
    setContentType(postData.contentType);
    setCaption(postData.caption);
    setTags(postData.tags);
    setScheduleDate(postData.scheduleDate ? new Date(postData.scheduleDate) : null);
    setSelectedPlatforms(postData.selectedPlatforms);
    showNotification('info', 'Retrying post submission...');
    // Trigger submission
    setTimeout(() => handleCreate(), 500);
  };
  
  const loadPendingPost = async () => {
    try {
      const pendingPostString = await AsyncStorage.getItem('pendingPost');
      if (pendingPostString) {
        const pendingPost = JSON.parse(pendingPostString);
        if (pendingPost.state === 'posting') {
          showPostNotification('posting', 'Post is still being processed...', retryFailedPost);
        } else if (pendingPost.state === 'failed') {
          showPostNotification('failed', 'Previous post failed. Tap to retry.', retryFailedPost);
        }
      }
    } catch (error) {
      console.log('Failed to load pending post');
    }
  };
  

  const sliderAnim = useRef(new Animated.Value(0)).current;

  const fetchConnectedPlatforms = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem('email');
      if (!email) {
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
        
        const connected: string[] = [];
        if (data.isInstagramConnect) connected.push('instagram');
        if (data.isYoutubeConnect) connected.push('youtube');
        if (data.isTiktokConnect) connected.push('tiktok');
        
        setConnectedPlatforms(connected);
      }
    } catch (error) {
      console.error('Failed to fetch connected platforms', error);
    }
  }, []);

  useEffect(() => {
    fetchConnectedPlatforms();
    loadPendingPost();
  }, [fetchConnectedPlatforms]);

  // When switching to single post, keep only last photo and remove all videos
  useEffect(() => {
    if (contentType === 'post' && postType === 'single') {
      // Remove all videos for single post
      if (uploadedVideos.length > 0) {
        setUploadedVideos([]);
      }
      // Keep only the last photo if multiple exist
      if (uploadedPhotos.length > 1) {
        const lastPhoto = uploadedPhotos[uploadedPhotos.length - 1];
        setUploadedPhotos([lastPhoto]);
        setMediaOrder([lastPhoto]);
      } else if (uploadedPhotos.length === 1) {
        setMediaOrder([uploadedPhotos[0]]);
      }
    }
  }, [postType, contentType]);

  // Speech recognition event listeners for mobile - REAL-TIME MODE
  useSpeechRecognitionEvent('result', (event) => {
    console.log('📱 Mobile Speech Recognition Result:', {
      transcript: event.results[0]?.transcript,
      isFinal: (event.results[0] as any)?.isFinal,
      resultsLength: event.results?.length,
    });
    
    // Commented out for future use - Title recording event handling
    // if (isRecordingTitle) {
    //   const transcript = event.results[0]?.transcript || '';
    //   if (transcript) {
    //     // For real-time: replace from last known position to avoid duplicates
    //     setTitle(prev => {
    //       const baseText = prev.substring(0, lastResultIndexTitle.current);
    //       return baseText + transcript;
    //     });
    //     // Update last index only when we get a final result (when isFinal exists and is true)
    //     const resultData = event.results[0] as any;
    //     if (resultData && resultData.isFinal === true) {
    //       lastResultIndexTitle.current += transcript.length;
    //     }
    //   }
    // } else 
    if (isRecordingCaption) {
      const transcript = event.results[0]?.transcript || '';
      if (transcript) {
        // For real-time: replace from last known position to avoid duplicates
        setCaption(prev => {
          const baseText = prev.substring(0, lastResultIndexCaption.current);
          const newText = baseText + transcript;
          console.log('📝 Caption Update:', {
            baseLength: baseText.length,
            transcriptLength: transcript.length,
            newTextLength: newText.length,
            lastIndex: lastResultIndexCaption.current,
          });
          return newText;
        });
        
        // Update last index only when we get a final result (when isFinal exists and is true)
        // For expo-speech-recognition, check if isFinal property exists and is true
        const resultData = event.results[0] as any;
        if (resultData && resultData.isFinal === true) {
          lastResultIndexCaption.current += transcript.length;
          console.log('✅ Final result - Updated lastIndex to:', lastResultIndexCaption.current);
        }
      }
    }
  });

  useSpeechRecognitionEvent('end', () => {
    // Auto-stop when recognition ends
    // Commented out for future use - Title recording end handling
    // if (isRecordingTitle) {
    //   setIsRecordingTitle(false);
    //   lastResultIndexTitle.current = 0;
    // }
    if (isRecordingCaption) {
      setIsRecordingCaption(false);
      lastResultIndexCaption.current = 0;
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error);
    
    // Handle specific error types
    if (event.error === 'language-not-supported') {
      showNotification('error', 'Speech recognition is not available in your language. Please check your device settings.');
    } else if (event.error === 'not-allowed') {
      showNotification('error', 'Microphone permission denied. Please enable it in settings.');
    } else {
      showNotification('error', 'Speech recognition failed. Please try again.');
    }
    
    // Commented out for future use - Title recording error handling
    // setIsRecordingTitle(false);
    setIsRecordingCaption(false);
    // lastResultIndexTitle.current = 0;
    lastResultIndexCaption.current = 0;
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        // Commented out for future use - Title recognition setup
        // recognitionTitle.current = new SpeechRecognition();
        // recognitionTitle.current.continuous = true;
        // recognitionTitle.current.interimResults = true;
        // recognitionTitle.current.lang = 'en';

        // recognitionTitle.current.onresult = (event: any) => {
        //   let finalTranscript = '';

        //   // Only process new results since last index
        //   for (let i = event.resultIndex; i < event.results.length; i++) {
        //     const transcript = event.results[i][0].transcript;
        //     if (event.results[i].isFinal) {
        //       finalTranscript += transcript + ' ';
        //     }
        //   }

        //   if (finalTranscript) {
        //     setTitle(prev => prev + finalTranscript);
        //   }
        // };
        
        // recognitionTitle.current.onstart = () => {
        //   lastResultIndexTitle.current = 0;
        // };

        recognitionCaption.current = new SpeechRecognition();
        recognitionCaption.current.continuous = true;
        recognitionCaption.current.interimResults = true;
        recognitionCaption.current.lang = 'en';

        recognitionCaption.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          // Process all results from the last known index
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              // Interim results - show in real-time
              interimTranscript += transcript;
            }
          }

          console.log('🌐 Web Speech Recognition Result:', {
            finalTranscript,
            interimTranscript,
            resultIndex: event.resultIndex,
            resultsLength: event.results.length,
          });

          // Update caption with real-time text
          setCaption(prev => {
            // Get the base text up to the last final result
            const baseText = prev.substring(0, lastResultIndexCaption.current);
            
            if (finalTranscript) {
              // Add final transcript to base and update the last index
              const newText = baseText + finalTranscript;
              lastResultIndexCaption.current = newText.length;
              console.log('✅ Web Final result - Updated lastIndex to:', lastResultIndexCaption.current);
              return newText;
            } else if (interimTranscript) {
              // Show interim results in real-time without updating last index
              console.log('⏳ Web Interim result - Showing:', interimTranscript);
              return baseText + interimTranscript;
            }
            
            return prev;
          });
        };
        
        recognitionCaption.current.onstart = () => {
          lastResultIndexCaption.current = 0;
        };
      }
    }

    return () => {
      // Commented out for future use - Title recognition cleanup
      // if (recognitionTitle.current) {
      //   recognitionTitle.current.stop();
      // }
      if (recognitionCaption.current) {
        recognitionCaption.current.stop();
      }
    };
  }, []);

  // Commented out for future use - toggleTitleRecording function
  /*
  const toggleTitleRecording = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!isRecordingTitle) {
      // Stop caption recording if it's active
      if (isRecordingCaption) {
        if (Platform.OS === 'web' && recognitionCaption.current) {
          recognitionCaption.current.stop();
        } else if (Platform.OS !== 'web') {
          await ExpoSpeechRecognitionModule.stop();
        }
        setIsRecordingCaption(false);
      }

      // For mobile platforms, request permission first
      if (Platform.OS !== 'web') {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          return;
        }

        try {
          const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
          if (!result.granted) {
            Alert.alert('Permission Required', 'Microphone permission is required for voice input.');
            return;
          }

          // iOS needs specific settings for reliable recognition
          const options = {
            lang: Platform.OS === 'ios' ? 'en-US' : undefined,
            interimResults: false,
            maxAlternatives: 1,
            continuous: Platform.OS === 'ios' ? false : true,
            requiresOnDeviceRecognition: Platform.OS === 'ios' ? true : false,
            addsPunctuation: true,
            contextualStrings: [],
          };
          
          await ExpoSpeechRecognitionModule.start(options);
          setIsRecordingTitle(true);
          lastResultIndexTitle.current = 0;
        } catch (error: any) {
          console.error('Error starting speech recognition:', error);
          const errorMsg = error?.message || 'Failed to start voice recognition';
          showNotification('error', errorMsg);
          setIsRecordingTitle(false);
        }
      } else {
        // Web speech recognition
        if (recognitionTitle.current) {
          try {
            lastResultIndexTitle.current = 0;
            recognitionTitle.current.start();
            setIsRecordingTitle(true);
          } catch (error: any) {
            console.error('Error starting speech recognition:', error);
            showNotification('error', 'Failed to start voice recognition. Please try again.');
            setIsRecordingTitle(false);
          }
        }
      }
    } else {
      // Stop recording
      if (Platform.OS === 'web' && recognitionTitle.current) {
        recognitionTitle.current.stop();
      } else if (Platform.OS !== 'web') {
        await ExpoSpeechRecognitionModule.stop();
      }
      setIsRecordingTitle(false);
      lastResultIndexTitle.current = 0;
    }
  };
  */

  const toggleCaptionRecording = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!isRecordingCaption) {
      // Commented out for future use - Stop title recording if it's active
      // if (isRecordingTitle) {
      //   if (Platform.OS === 'web' && recognitionTitle.current) {
      //     recognitionTitle.current.stop();
      //   } else if (Platform.OS !== 'web') {
      //     await ExpoSpeechRecognitionModule.stop();
      //   }
      //   setIsRecordingTitle(false);
      // }

      // For mobile platforms, request permission first
      if (Platform.OS !== 'web') {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          return;
        }

        try {
          const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
          if (!result.granted) {
            Alert.alert('Permission Required', 'Microphone permission is required for voice input.');
            return;
          }

          // Enable real-time transcription with interim results
          const options = {
            lang: Platform.OS === 'ios' ? 'en-US' : undefined,
            interimResults: true, // Enable real-time interim results
            maxAlternatives: 1,
            continuous: true, // Keep listening continuously
            requiresOnDeviceRecognition: Platform.OS === 'ios' ? true : false,
            addsPunctuation: true,
            contextualStrings: [],
          };
          
          console.log('🎙️ Starting mobile speech recognition with options:', options);
          await ExpoSpeechRecognitionModule.start(options);
          setIsRecordingCaption(true);
          lastResultIndexCaption.current = 0;
          console.log('✅ Mobile speech recognition started successfully');
        } catch (error: any) {
          console.error('❌ Error starting mobile speech recognition:', error);
          const errorMsg = error?.message || 'Failed to start voice recognition';
          showNotification('error', errorMsg);
          setIsRecordingCaption(false);
        }
      } else {
        // Web speech recognition
        if (recognitionCaption.current) {
          try {
            lastResultIndexCaption.current = 0;
            console.log('🎙️ Starting web speech recognition');
            recognitionCaption.current.start();
            setIsRecordingCaption(true);
            console.log('✅ Web speech recognition started successfully');
          } catch (error: any) {
            console.error('❌ Error starting web speech recognition:', error);
            showNotification('error', 'Failed to start voice recognition. Please try again.');
            setIsRecordingCaption(false);
          }
        }
      }
    } else {
      // Stop recording
      console.log('⏹️ Stopping speech recognition');
      if (Platform.OS === 'web' && recognitionCaption.current) {
        recognitionCaption.current.stop();
        console.log('✅ Web speech recognition stopped');
      } else if (Platform.OS !== 'web') {
        await ExpoSpeechRecognitionModule.stop();
        console.log('✅ Mobile speech recognition stopped');
      }
      setIsRecordingCaption(false);
      lastResultIndexCaption.current = 0;
      console.log('📝 Final caption length:', caption.length);
    }
  };

  const handleRegenerateCaption = async () => {
    if (!caption.trim()) {
      showNotification('error', 'Please enter a caption first');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsRegeneratingCaption(true);

    try {
      // Determine isReel based on contentType and postType
      const isReel = contentType === 'reel' || (contentType === 'post' && postType === 'carousel');

      const response = await fetch(CAPTION_RECREATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          captionpromt: caption.trim(),
          isReel: isReel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Regenerated caption response:', data);
        // Response is an array, get first item, then content[0].text
        if (data && Array.isArray(data) && data[0]?.content?.[0]?.text) {
          setCaption(data[0].content[0].text);
          showNotification('success', 'Caption regenerated successfully!');
        } else {
          showNotification('error', 'Failed to regenerate caption');
        }
      } else {
        showNotification('error', 'Failed to regenerate caption');
      }
    } catch (error) {
      console.error('Error regenerating caption:', error);
      showNotification('error', 'An error occurred while regenerating caption');
    } finally {
      setIsRegeneratingCaption(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(floatAnim1, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(floatAnim2, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(floatAnim3, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.back();
  };

  const handleToggle = (type: 'post' | 'reel' | 'story') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.spring(sliderAnim, {
      toValue: type === 'post' ? 0 : type === 'reel' ? 1 : 2,
      useNativeDriver: false,
      tension: 65,
      friction: 8,
    }).start();

    setContentType(type);
    // Commented out for future use - Reset title on content type change
    // setTitle('');
    setCaption('');
    setTags([]);
    setTagInput('');
    setUploadedVideos([]);
    setUploadedPhotos([]);
    setScheduleDate(null);
    setMediaOrder([]);
    // Commented out for future use - Reset selectedBannerId on content type change
    // setSelectedBannerId('agXkA3Dw0zNEbW2VBY'); // Reset to default
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 3) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Maintain insertion order so carousel submissions preserve sequence.
  const addMediaToOrder = (uris: string[], mode: 'append' | 'replace' = 'append') => {
    setMediaOrder(prev => {
      if (mode === 'replace') {
        return [...uris];
      }
      if (!uris.length) {
        return prev;
      }
      const next = [...prev];
      uris.forEach(uri => {
        if (!next.includes(uri)) {
          next.push(uri);
        }
      });
      return next;
    });
  };

  const removeMediaFromOrder = (uri: string) => {
    setMediaOrder(prev => prev.filter(item => item !== uri));
  };

  const swapMediaItems = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      setActiveDragIndex(null);
      setDropTargetIndex(null);
      return;
    }
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const updatedOrder = [...mediaOrder];
    const [movedItem] = updatedOrder.splice(fromIndex, 1);
    updatedOrder.splice(toIndex, 0, movedItem);
    
    setMediaOrder(updatedOrder);
    
    // Update individual arrays based on new order
    const newVideos: string[] = [];
    const newPhotos: string[] = [];
    
    updatedOrder.forEach(uri => {
      if (uploadedVideos.includes(uri)) {
        newVideos.push(uri);
      } else if (uploadedPhotos.includes(uri)) {
        newPhotos.push(uri);
      }
    });
    
    setUploadedVideos(newVideos);
    setUploadedPhotos(newPhotos);
    setActiveDragIndex(null);
    setDropTargetIndex(null);
  };

  const handleUploadFile = async (mediaType: 'photo' | 'video' | 'mixed') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      return;
    }

    let mediaTypes = ImagePicker.MediaTypeOptions.Images;
    if (mediaType === 'video') {
      mediaTypes = ImagePicker.MediaTypeOptions.Videos;
    } else if (mediaType === 'mixed') {
      mediaTypes = ImagePicker.MediaTypeOptions.All;
    }

    // For single post, only allow one image selection
    const isSinglePost = contentType === 'post' && postType === 'single';
    const isCarousel = contentType === 'post' && postType === 'carousel';
    const selectionLimit = isSinglePost ? 1 : 10;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: isSinglePost ? true : false,
      quality: 1,
      allowsMultipleSelection: !isSinglePost,
      selectionLimit: selectionLimit,
    });

    if (!result.canceled && result.assets && result.assets.length) {
      // For carousel with mixed media, separate videos and photos
      if (isCarousel && mediaType === 'mixed') {
        const videoUris: string[] = [];
        const photoUris: string[] = [];
        
        result.assets.forEach(asset => {
          if (asset.uri) {
            // Check if it's a video based on type or uri
            const isVideo = asset.type === 'video' || 
                          asset.uri.includes('.mp4') || 
                          asset.uri.includes('.mov') || 
                          asset.uri.includes('.avi') ||
                          asset.uri.includes('.mkv') ||
                          asset.uri.includes('.m4v');
            
            if (isVideo) {
              if (!videoUris.includes(asset.uri)) {
                videoUris.push(asset.uri);
              }
            } else {
              if (!photoUris.includes(asset.uri)) {
                photoUris.push(asset.uri);
              }
            }
          }
        });

        // Update videos
        if (videoUris.length > 0) {
          setUploadedVideos(prev => {
            const next = [...prev];
            videoUris.forEach(uri => {
              if (!next.includes(uri)) {
                next.push(uri);
              }
            });
            return next;
          });
        }

        // Update photos
        if (photoUris.length > 0) {
          setUploadedPhotos(prev => {
            const next = [...prev];
            photoUris.forEach(uri => {
              if (!next.includes(uri)) {
                next.push(uri);
              }
            });
            return next;
          });
        }

        // Add all to media order
        const allUris = [...videoUris, ...photoUris];
        addMediaToOrder(allUris, 'append');
        
        return;
      }

      const uris = result.assets.map(asset => asset.uri).filter(Boolean) as string[];
      const uniqueUris = Array.from(new Set(uris));

      // For single post, only keep the last selected image
      const finalUris = isSinglePost && mediaType === 'photo' ? [uniqueUris[uniqueUris.length - 1]] : uniqueUris;

      if (mediaType === 'video') {
        if (contentType === 'post') {
          setUploadedVideos(prev => {
            const next = [...prev];
            finalUris.forEach(uri => {
              if (!next.includes(uri)) {
                next.push(uri);
              }
            });
            return next;
          });
          addMediaToOrder(finalUris, 'append');
        } else {
          setUploadedVideos(finalUris);
          setUploadedPhotos([]);
          addMediaToOrder(finalUris, 'replace');
        }
      } else {
        // For single post, replace instead of append
        if (isSinglePost) {
          setUploadedPhotos(finalUris);
          addMediaToOrder(finalUris, 'replace');
        } else {
          setUploadedPhotos(prev => {
            const next = [...prev];
            finalUris.forEach(uri => {
              if (!next.includes(uri)) {
                next.push(uri);
              }
            });
            return next;
          });
          if (contentType === 'post') {
            addMediaToOrder(finalUris, 'append');
          } else {
            addMediaToOrder(finalUris, 'replace');
            setUploadedVideos([]);
          }
        }
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const currentDate = scheduleDate || new Date();
      currentDate.setFullYear(selectedDate.getFullYear());
      currentDate.setMonth(selectedDate.getMonth());
      currentDate.setDate(selectedDate.getDate());
      setScheduleDate(currentDate);
      if (Platform.OS === 'android') {
        setShowTimePicker(true);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const currentDate = scheduleDate || new Date();
      currentDate.setHours(selectedTime.getHours());
      currentDate.setMinutes(selectedTime.getMinutes());
      setScheduleDate(currentDate);
    }
  };

  const handleSchedulePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!scheduleDate) {
      const now = new Date();
      // Round to next 5-minute interval
      const minutes = Math.ceil(now.getMinutes() / 5) * 5;
      now.setMinutes(minutes);
      now.setSeconds(0);
      now.setMilliseconds(0);
      setTempDate(now);
      setScheduleDate(now);
    } else {
      setTempDate(new Date(scheduleDate));
    }
    
    if (Platform.OS === 'web') {
      setShowScheduleModal(true);
    } else {
      setShowDatePicker(true);
    }
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return 'Select date & time';
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleString('en-US', options);
  };

  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        times.push(`${h}:${m}`);
      }
    }
    return times;
  };

  const handleDateInputChange = (e: any) => {
    const dateStr = e.target.value;
    if (dateStr) {
      const newDate = new Date(dateStr);
      setTempDate(prev => {
        const updated = new Date(prev);
        updated.setFullYear(newDate.getFullYear());
        updated.setMonth(newDate.getMonth());
        updated.setDate(newDate.getDate());
        return updated;
      });
    }
  };

  const handleTimeSelect = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    setTempDate(prev => {
      const updated = new Date(prev);
      updated.setHours(hours);
      updated.setMinutes(minutes);
      updated.setSeconds(0);
      updated.setMilliseconds(0);
      return updated;
    });
  };

  const handleScheduleConfirm = () => {
    setScheduleDate(new Date(tempDate));
    setShowScheduleModal(false);
  };

  const handleScheduleCancel = () => {
    setShowScheduleModal(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTogglePlatform = (platformId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Check if it's a carousel post - only Instagram allowed for carousel
    const isCarousel = contentType === 'post' && postType === 'carousel';
    // Check if it's a story - TikTok and YouTube don't support stories
    const isStory = contentType === 'story';
    const disabledPlatforms = isCarousel ? ['youtube', 'tiktok', 'snapchat', 'twitter', 'facebook'] : isStory ? ['youtube', 'tiktok'] : [];
    
    // Don't allow toggling disabled platforms
    if (disabledPlatforms.includes(platformId)) {
      return;
    }
    
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };


  const handleCreate = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    if (isSubmitting) {
      return;
    }

    // Validation for required fields
    const hasUploadedMedia = mediaOrder.length > 0 || uploadedPhotos.length > 0 || uploadedVideos.length > 0;

    if (!hasUploadedMedia) {
      showNotification('error', 'Missing Media: Please upload a media file.');
      return;
    }

    // Commented out for future use - Title validation
    // if ((contentType === 'post' || contentType === 'story') && !title.trim()) {
    //   showNotification('error', 'Title Required: Please enter a title for your post.');
    //   return;
    // }

    const pendingCleanups: string[] = [];
    let resolvedMimeType: string | null = null;

    // Save post data for recovery
    const postData = {
      contentType,
      postType,
      caption,
      tags,
      scheduleDate: scheduleDate?.toISOString(),
      selectedPlatforms,
      uploadedVideos,
      uploadedPhotos,
      mediaOrder,
    };

    try {
      setIsSubmitting(true);

      // Save state as posting
      await savePostState('posting', postData);
      showPostNotification('posting', 'Posting in progress...', retryFailedPost);

      const storedUserId = await AsyncStorage.getItem('email');
      if (!storedUserId) {
        showNotification('error', 'Account Missing: Please sign in again.');
        return;
      }

      const formData = new FormData();

      const activeMediaOrder = mediaOrder.filter(uri => uploadedVideos.includes(uri) || uploadedPhotos.includes(uri));
      const combinedMediaUris = activeMediaOrder.length ? activeMediaOrder : [...uploadedVideos, ...uploadedPhotos];
      const primaryMediaUri = combinedMediaUris[0] ?? null;
      const mediaSourceLabel = combinedMediaUris.length
        ? combinedMediaUris.length > 1
          ? `local:carousel(${combinedMediaUris.length})`
          : `local:${combinedMediaUris[0]}`
        : 'none';

      const appendedMediaMeta: { index: number; uri: string; fileName: string; mimeType: string }[] = [];

      if (combinedMediaUris.length) {
        for (let index = 0; index < combinedMediaUris.length; index++) {
          const uri = combinedMediaUris[index];
          const fallbackMime = uploadedVideos.includes(uri) ? 'video/mp4' : 'image/jpeg';
          const { base64Data, mimeType, fileName, fileUri, cleanupUri, blob } = await convertUriToBase64(uri, fallbackMime);
          resolvedMimeType = resolvedMimeType ?? mimeType;
          if (cleanupUri) {
            pendingCleanups.push(cleanupUri);
          }
          if (Platform.OS === 'web') {
            if (blob) {
              const fileObject = typeof File !== 'undefined' ? new File([blob], fileName, { type: mimeType }) : blob;
              formData.append('mediaUrl', fileObject, fileName);
            } else {
              formData.append('mediaUrl', `data:${mimeType};base64,${base64Data}`);
            }
          } else if (fileUri) {
            formData.append('mediaUrl', {
              uri: fileUri,
              type: mimeType,
              name: fileName,
            } as any);
          } else {
            formData.append('mediaUrl', `data:${mimeType};base64,${base64Data}`);
          }
          appendedMediaMeta.push({ index, uri, fileName, mimeType });
        }

        if (appendedMediaMeta.length) {
          formData.append('mediaFileName', appendedMediaMeta[0].fileName);
          formData.append('mediaMimeType', appendedMediaMeta[0].mimeType);
        }
        if (appendedMediaMeta.length > 1) {
          formData.append('mediaCount', String(appendedMediaMeta.length));
          formData.append('carouselMediaMeta', JSON.stringify(appendedMediaMeta));
        }
      }

      const localizedSchedule = scheduleDate ? scheduleDate.toISOString() : 'Not scheduled';
      const tagSummary = tags.length ? tags.map(tag => `@${tag}`).join(', ') : 'None';
      const platformSummary = confirmedPosts.length ? confirmedPosts.join(', ') : 'Default selection';

      // Determine if this is a reel
      const hasUploadedVideo = appendedMediaMeta.some(item => item.mimeType.startsWith('video/'));
      const shouldUseReel = Boolean(
        contentType === 'reel' ||
        hasUploadedVideo ||
        (resolvedMimeType && resolvedMimeType.startsWith('video/'))
      );

      let titlePromptPayload, captionPromptPayload;

      // Commented out for future use - Set default empty title for prompts
      const title = '';

      if (contentType === 'story') {
        // Story-specific prompts (title only, no caption)
        titlePromptPayload = [
          {
            role: 'user',
            content: `You are a bilingual (English/Arabic) social media post title generation agent for hip-hop content. Your job is to generate high-performing, platform-ready post titles for Instagram and other platforms, using the most viral, authentic, and community-driven tone in both languages. Use ALL CAPS strategically for energy and emphasis. Blend infectious hip-hop hype with cultural authority. Mix street authenticity, modern slang, and professional presentation. Short, punchy, headline-style titles. Always sound like the most connected, in-the-know voice in the scene. Use strategic emoji (🔥💯⚡🎵🎤) only if it fits the style. Use Modern Standard Arabic mixed with contemporary Arabic social media language. Integrate English music industry terms and artist names. Use Arabic numerals and trending Arabic hashtags. Balance traditional Arabic with modern digital communication. Maintain cultural authenticity and accessibility. ENGLISH TITLE: Bold, attention-grabbing, under 60 characters. Include artist name and track or video type if relevant (artist name always in English). Use power words such as DROPS, RELEASES, PREMIERES, BREAKS RECORDS, and similar terms. Immediate impact and recognition. Example: NF'S NEW ALBUM HAS THE MOST PRE-SAVES OF ANY RAP ALBUM ON SPOTIFY. ARABIC TITLE: Direct translation of the English title with the same energy. Artist name always in English. Use traditional Arabic script. Example: NF الجديد يحقق أعلى عدد من الحجوزات المسبقة بين ألبومات الراب على سبوتيفاي. OUTPUT: Always output both English and Arabic titles clearly labeled. No additional text, explanations, or formatting is needed in the output. USER PROVIDED TITLE: ${title || 'Not provided'}`,
          },
        ];
        // Story doesn't need caption prompt
        captionPromptPayload = null;
      } else if (shouldUseReel) {
        // Reel-specific prompts
        titlePromptPayload = [
          {
            role: 'user',
            content: `GENERAL INSTRUCTIONS: You are a bilingual (English/Arabic) social media reel title generation agent. Your job is to generate high-performing, platform-ready reel titles for short-form video platforms (Instagram Reels, YouTube Shorts, TikTok, Facebook Reels, Snapchat Spotlight), using the most viral, authentic, and community-driven tone in both languages. TONE OF VOICE: Use ALL CAPS strategically for energy and emphasis Blend hype with authority and confidence Mix modern slang, contextual authenticity, and professional presentation Short, punchy, headline-style titles Always sound like the most connected, in-the-know voice in the space Use strategic emoji only if it fits the style ARABIC LANGUAGE ANALYSIS: Use Modern Standard Arabic (MSA) mixed with contemporary Arabic social media language Integrate relevant English names, brands, or terms dynamically derived from context Use Arabic numerals and trending Arabic hashtags Balance traditional Arabic with modern digital communication Maintain cultural authenticity and accessibility REEL TITLE STRUCTURE: ENGLISH TITLE: Hook-driven, under 100 characters, platform-neutral High curiosity/energy, immediate impact Relevant name, brand, or subject always in English and derived from context ARABIC TITLE: Direct reflection of the English title with the same energy Relevant name, brand, or subject always in English Use traditional Arabic script OUTPUT: Always output both English and Arabic titles, format the whole response as ENGLISH TITLE: CONTENT ARABIC TITLE: CONTENT clearly labeled. USER PROVIDED CONTEXT: User's Title Input = ${title || 'Not provided'}, User's Caption Input = ${caption || 'Not provided'}. Use this context to customize and enhance the generated titles.`,
          },
        ];

        captionPromptPayload = [
          {
            role: 'user',
            content: `GENERAL INSTRUCTIONS: You are a bilingual (English/Arabic) social media reel caption generation agent. Your job is to generate high-performing, platform-ready reel captions for Instagram Reels (and repurposed to YouTube Shorts, TikTok, Facebook Reels, Snapchat Spotlight), using the most viral, authentic, and community-driven tone in both languages.\n\nADDITIONAL RULES (IMPORTANT):\n- Do NOT include Arabic hashtags under any circumstances.\n- Do NOT include section labels such as:\n  - "## Arabic:" \n  - "## English:" \n  - "# Instagram Reel Caption - Bilingual (English/Arabic)"\n- Do NOT include any formatting headers or labels — only output the raw caption content.\n- Output only the English CTA, English caption, Arabic CTA, Arabic caption, and English hashtags.\n- No Arabic hashtags at all.\n\nTONE OF VOICE:\nBlend hype with cultural authority\nMix modern slang, contextual authenticity, and professional presentation\nShort, punchy, direct, and sometimes meme-like\nAlways sound like the most connected, in-the-know voice in the space\nUse strategic emoji for energy\nStart with a general call to action (e.g., Follow for more content like this. / تابع للمزيد من هذا المحتوى)\n\nARABIC LANGUAGE ANALYSIS:\nUse Modern Standard Arabic (MSA) mixed with contemporary Arabic social media language\nIntegrate relevant English names, brands, or entities dynamically derived from context\nUse Arabic numerals and trending Arabic hashtags (BUT FOLLOW RULE ABOVE: Arabic hashtags must NOT be included)\nBalance traditional Arabic with modern digital communication\nMaintain cultural authenticity and accessibility\n\nREEL CAPTION STRUCTURE:\nENGLISH CTA: Follow for more content like this.\nARABIC CTA: تابع للمزيد من هذا المحتوى\n\n[Space]\n\nENGLISH CAPTION:\nShort, punchy description of the content (1-2 lines, meme/viral style, direct, sometimes playful or meme-like, always in the same tone)\n\nARABIC CAPTION:\nDirect reflection of the English caption with the same energy\nRelevant primary name or entity always in English\n\nHASHTAGS:\nAlways include a hashtag of the primary name or entity (formatted like #ENTITYNAME)\nOptional: 1-2 broad, platform-neutral English hashtags only (e.g. #viral #trending)\nABSOLUTELY NO ARABIC HASHTAGS\n\nUSER PROVIDED CONTEXT:\nUser's Title Input = ${title || 'Not provided'}\nUser's Caption Input = ${caption || 'Not provided'}\nUse this context to customize and enhance the generated captions.\n\nOUTPUT:\nAlways output both English and Arabic captions without labels, without headers, and without Arabic hashtags. Only the actual caption content.`,
          },
        ];
      } else {
        // Post-specific prompts
        titlePromptPayload = [
          {
            role: 'user',
            content: `TASK: Generate a bilingual (English/Arabic) social media post title following the rules below. TONE OF VOICE: Use ALL CAPS strategically for energy and emphasis. Blend hype with authority and confidence. Mix modern slang, cultural relevance, and professional presentation. Keep titles short, punchy, and headline-style. Sound like the most connected voice in the space. Use emojis when appropriate (🔥💯⚡🎯📢). ARABIC LANGUAGE RULES: Use Modern Standard Arabic mixed with contemporary Arabic social media style. Include English names, brands, or terms dynamically derived from context when relevant. Maintain cultural authenticity and accessibility. POST TITLE STRUCTURE: ENGLISH TITLE must be bold, under 60 characters, include a relevant name, brand, or subject derived from the provided context, and use strong action words like DROPS, LAUNCHES, RELEASES, ANNOUNCES, GOES LIVE, BREAKS RECORDS. ARABIC TITLE must directly reflect the English title with matching energy and use traditional Arabic script. OUTPUT FORMAT: Provide only these two lines: ENGLISH TITLE: [title] ARABIC TITLE: [title]. CONTEXT: Content Type = ${contentType.toUpperCase()}, Working Title = ${title || 'Not provided'}, Caption Draft = ${caption || 'Not provided'}, Tags = ${tagSummary}, Scheduled For = ${localizedSchedule}, Platforms = ${platformSummary}. Generate one English title and one Arabic title.`,
          },
        ];

        captionPromptPayload = [
          {
            role: 'user',
            content: `GENERAL INSTRUCTIONS: You are a bilingual (English/Arabic) social media post caption generation agent. Generate high-performing, platform-ready post captions for Instagram and cross-platform repurposing, using a viral, authentic, community-driven tone in both languages. TONE OF VOICE: Blend hype with cultural authority, mix modern slang, contextual authenticity, and professional presentation, keep lines short, punchy, direct, and meme-like when helpful, always sound in-the-know, and use strategic emoji (🔥💯⚡🚀📢) for energy without leading with a call to action. ARABIC LANGUAGE ANALYSIS: Use Modern Standard Arabic mixed with contemporary Arabic social media language, integrate relevant English industry terms and names dynamically derived from context, use Arabic numerals and trending Arabic hashtags, balance traditional Arabic with modern digital communication, and maintain cultural authenticity and accessibility. POST CAPTION STRUCTURE: Provide two lines with no labels: first the English caption (1-2 punchy lines), second the Arabic caption mirroring the English tone and including relevant names in English. After that return a third line with space-separated hashtags that always include the primary name or entity as a hashtag (formatted like #ENTITYNAME) and optionally 1-2 general contextual hashtags (e.g. #update, #launch, #trending). CONTEXT: Content Type = ${contentType.toUpperCase()}, Working Title = ${title || 'Not provided'}, Caption Draft = ${caption || 'Not provided'}, Tags = ${tagSummary}, Scheduled For = ${localizedSchedule}, Platforms = ${platformSummary}. The audience should feel like they are getting exclusive access. Return only the three lines of output without additional labels or explanations.`,
          },
        ];
      }

      const shouldUseCarousel = contentType === 'post' && postType === 'carousel';
      
      // For carousel, use different field structure
      if (shouldUseCarousel) {
        // Carousel API uses captionPromt directly (not JSON), userTags array, and single Platforms field
        formData.append('captionPromt', caption.trim());
        formData.append('max_tokens', '1024');
        formData.append('isReel', 'false');
        formData.append('email', storedUserId);
        
        // Append tags as userTags array for carousel
        if (tags.length > 0) {
          tags.forEach((tag) => {
            formData.append('userTags', `@${tag}`);
          });
        }
        
        // For carousel, filter to only Instagram and send as singular Platforms field
        const carouselPlatforms = selectedPlatforms.filter(p => p === 'instagram');
        const carouselPlatform = carouselPlatforms.length > 0 ? carouselPlatforms[0] : 'instagram';
        formData.append('Platforms', carouselPlatform);
        
        // Add schedule information for carousel
        if (scheduleDate) {
          const scheduledFor = scheduleDate.toISOString().slice(0, 19);
          formData.append('scheduledFor', scheduledFor);
          formData.append('publishnow', 'false');
        } else {
          formData.append('publishnow', 'true');
        }
      } else {
        // Non-carousel: use existing structure
        formData.append('titlePromt', JSON.stringify(titlePromptPayload));
        if (captionPromptPayload) {
          formData.append('captionPromt', caption.trim());
        }
        formData.append('max_tokens', '1024');
        formData.append('email', storedUserId);
        
        // Append tags array for backend processing (not for story)
        if (tags.length > 0 && contentType !== 'story') {
          tags.forEach((tag) => {
            formData.append('tags', `@${tag}`);
          });
        }
        
        // Add schedule information
        if (scheduleDate) {
          const scheduledFor = scheduleDate.toISOString().slice(0, 19);
          formData.append('scheduledFor', scheduledFor);
          formData.append('publishnow', 'false');
        } else {
          formData.append('publishnow', 'true');
        }
        
        // Append each platform individually to create an array (using 'Platforms' to match backend)
        const filteredPlatforms = selectedPlatforms;
        const platformsToSend = filteredPlatforms.length == 1 ? [...filteredPlatforms,  ''] : filteredPlatforms
        platformsToSend.forEach((platform) => {
          formData.append('Platforms', platform);
        });
      }

      // For non-carousel submissions, add isReel and isCarousel flags
      if (!shouldUseCarousel) {
        formData.append('isReel', shouldUseReel ? 'true' : 'false');
        formData.append('isCarousel', 'false');
      }
      
      // Add bannerId for story
      if (contentType === 'story') {
        // Commented out for future use - Add selectedBannerId for story
        // formData.append('bannerId', selectedBannerId);
        formData.append('bannerId', 'agXkA3Dw0zNEbW2VBY'); // Use default banner
      }

      const targetEndpoint = contentType === 'story'
        ? CREATE_STORY_ENDPOINT
        : shouldUseCarousel
        ? CREATE_CAROUSEL_ENDPOINT
        : (shouldUseReel ? CREATE_REEL_ENDPOINT : CREATE_POST_ENDPOINT);

      

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Request failed. Please try again.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let responseBody: any = null;
      try {
        responseBody = await response.json();
      } catch (parseError) {
        responseBody = null;
      }

      // Show different notification based on publish type
      let notificationMessage = '';
      if (scheduleDate) {
        const options: Intl.DateTimeFormatOptions = {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        };
        const formattedDate = scheduleDate.toLocaleString('en-US', options);
        if (contentType === 'story') {
          notificationMessage = `Story is scheduled for ${formattedDate}`;
        } else {
          const contentTypeText = contentType === 'reel' ? 'reel' : 'post';
          notificationMessage = `Your ${contentTypeText} will be posted on ${formattedDate}`;
        }
      } else {
        if (contentType === 'story') {
          notificationMessage = 'Story is live';
        } else {
          const contentTypeText = contentType === 'reel' ? 'Reel' : 'Post';
          notificationMessage = `${contentTypeText} is Live Now! 🎉`;
        }
      }
      
      // Clear posting state immediately and show success notification
      await clearPostState();
      showPostNotification('success', notificationMessage);
      showNotification('success', notificationMessage);

      // Commented out for future use - Reset title after successful submission
      // setTitle('');
      setCaption('');
      setTags([]);
      setTagInput('');
      setUploadedVideos([]);
      setUploadedPhotos([]);
      setScheduleDate(null);
      setConfirmedPosts([]);
      setMediaOrder([]);
      setSelectedPlatforms([]);
    } catch (error) {
      console.log('Failed to create post');
      const errorMessage = error instanceof Error ? error.message : 'We were unable to submit your post. Please try again.';
      
      // Check if it's a network error
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      const displayMessage = isNetworkError 
        ? 'Network error. Your post will be retried automatically.' 
        : errorMessage;
      
      // Save failed state for retry
      await savePostState('failed', postData);
      showPostNotification('failed', 'Post failed. Tap to retry.', retryFailedPost);
      
      setIsSubmitting(false);
      showNotification('error', displayMessage);
    } finally {
      if (pendingCleanups.length && Platform.OS !== 'web') {
        for (const cleanupUri of pendingCleanups) {
          await FileSystem.deleteAsync(cleanupUri, { idempotent: true }).catch(() => undefined);
        }
      }
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowModal(false);
    setSelectedPosts([]);
  };

  const handleTogglePost = (id: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPosts(prev => {
      if (prev.includes(id)) {
        return prev.filter(postId => postId !== id);
      } else if (prev.length < 3) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setConfirmedPosts(selectedPosts);
    setShowModal(false);
    setSelectedPosts([]);
  };

  const float1Y = floatAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -15, 0],
  });

  const float2Y = floatAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -20, 0],
  });

  const float3Y = floatAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -10, 0],
  });

  const sliderPosition = sliderAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [4, (width - 32) / 3 + 4, ((width - 32) / 3) * 2 + 4],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Notification Component */}
      {notification && (
        <Animated.View 
          style={[
            styles.notification,
            notification.type === 'error' && styles.notificationError,
            notification.type === 'success' && styles.notificationSuccess,
            notification.type === 'info' && styles.notificationInfo,
            { 
              opacity: notificationOpacity,
              top: insets.top + 80,
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
            {notification.type === 'info' && (
              <ActivityIndicator color="#ffffff" size="small" style={styles.notificationSpinner} />
            )}
            <Text style={styles.notificationText}>{notification.message}</Text>
          </View>
        </Animated.View>
      )}
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
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
            style={styles.backButtonGradient}
            onPress={handleBack}
            activeOpacity={0.6}
          >
            <ArrowLeft color="#ffffff" size={18} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Create </Text>
          <Animated.Text style={[
            styles.pageTitleBold,
            {
              color: sliderAnim.interpolate({
                inputRange: [0, 1, 2],
                outputRange: ['#60a5fa', '#fbbf24', '#ec4899'],
              }),
            },
          ]}>
            {contentType === 'post' ? 'Post' : contentType === 'reel' ? 'Reel' : 'Story'}
          </Animated.Text>
        </View>


        <View style={styles.toggleContainer}>
          <View style={styles.toggleBackground}>
            <Animated.View style={[styles.toggleSlider, {
              left: sliderPosition,
            }]}>
              <LinearGradient
                colors={contentType === 'post' ? ['#60a5fa', '#3b82f6'] : contentType === 'reel' ? ['#fbbf24', '#f59e0b'] : ['#ec4899', '#db2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.toggleSliderInner}
              />
            </Animated.View>
            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() => handleToggle('post')}
              activeOpacity={0.8}
            >
              <ImageIcon color={contentType === 'post' ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)'} size={18} strokeWidth={2.5} />
              <Text style={[styles.toggleText, contentType === 'post' && styles.toggleTextActivePost]}>
                Post
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() => handleToggle('reel')}
              activeOpacity={0.8}
            >
              <Video color={contentType === 'reel' ? '#60a5fa' : 'rgba(255, 255, 255, 0.4)'} size={18} strokeWidth={2.5} />
              <Text style={[styles.toggleText, contentType === 'reel' && styles.toggleTextActiveReel]}>
                Reel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() => handleToggle('story')}
              activeOpacity={0.8}
            >
              <Plus color={contentType === 'story' ? '#3b82f6' : 'rgba(255, 255, 255, 0.4)'} size={18} strokeWidth={2.5} />
              <Text style={[styles.toggleText, contentType === 'story' && styles.toggleTextActiveStory]}>
                Story
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputSection}>
          {contentType === 'post' && (
            <LinearGradient
              colors={['#ec4899', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.postTypeCard}
            >
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelDark}>Post Type</Text>
                </View>
                <View style={styles.postTypeOptionsContainer}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.postTypeOption,
                      postType === 'single' && styles.postTypeOptionSelected,
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setPostType('single');
                    }}
                  >
                    <View style={styles.radioButton}>
                      {postType === 'single' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[
                      styles.postTypeLabel,
                      postType === 'single' && styles.postTypeLabelSelected,
                    ]}>
                      Single Post
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.postTypeOption,
                      postType === 'carousel' && styles.postTypeOptionSelected,
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setPostType('carousel');
                    }}
                  >
                    <View style={styles.radioButton}>
                      {postType === 'carousel' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[
                      styles.postTypeLabel,
                      postType === 'carousel' && styles.postTypeLabelSelected,
                    ]}>
                      Carousel Post
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          )}
          
          <LinearGradient
            colors={['#60a5fa', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.uploadCard}
          >
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.labelDark}>Upload Media</Text>
                <View style={styles.labelBadgeDark}>
                  <Text style={styles.labelBadgeTextDark}>Required</Text>
                </View>
              </View>
              {contentType === 'post' ? (
                <View style={styles.uploadButtonsContainer}>
                  {postType === 'carousel' ? (
                    <TouchableOpacity activeOpacity={0.7} style={styles.uploadButton} onPress={() => handleUploadFile('mixed')}>
                      <Upload color="#000000" size={20} strokeWidth={2.5} />
                      <Text style={styles.uploadButtonText}>Select Media (up to 10)</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity activeOpacity={0.7} style={styles.uploadButton} onPress={() => handleUploadFile('photo')}>
                      <ImageIcon color="#000000" size={20} strokeWidth={2.5} />
                      <Text style={styles.uploadButtonText}>Upload Photo (1 only)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : contentType === 'reel' ? (
                <TouchableOpacity activeOpacity={0.7} style={styles.uploadButton} onPress={() => handleUploadFile('video')}>
                  <Video color="#000000" size={20} strokeWidth={2.5} />
                  <Text style={styles.uploadButtonText}>Upload Video File</Text>
                </TouchableOpacity>
              ) : (contentType === 'story' ? (
                <>
                  <TouchableOpacity activeOpacity={0.7} style={styles.uploadButton} onPress={() => handleUploadFile('photo')}>
                    <ImageIcon color="#000000" size={20} strokeWidth={2.5} />
                    <Text style={styles.uploadButtonText}>Upload Photo</Text>
                  </TouchableOpacity>
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLineDark} />
                    <Text style={styles.dividerTextDark}>OR</Text>
                    <View style={styles.dividerLineDark} />
                  </View>
                  <TouchableOpacity activeOpacity={0.7} style={styles.uploadButton} onPress={() => handleUploadFile('video')}>
                    <Video color="#000000" size={20} strokeWidth={2.5} />
                    <Text style={styles.uploadButtonText}>Upload Video</Text>
                  </TouchableOpacity>
                  
                  {/* Commented out for future use - Story Style section */}
                  {/* <View style={styles.storyStyleSection}>
                    <Text style={styles.storyStyleHeading}>Story Style</Text>
                    <View style={styles.bannerPillsContainer}>
                      <TouchableOpacity 
                        activeOpacity={0.7} 
                        style={[styles.bannerPill, selectedBannerId === 'A37YJe5q03WXZmpvWK' && styles.bannerPillSelected]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setSelectedBannerId('A37YJe5q03WXZmpvWK');
                        }}
                      >
                        <Square color={selectedBannerId === 'A37YJe5q03WXZmpvWK' ? "#000000" : "rgba(0, 0, 0, 0.5)"} size={16} strokeWidth={2} strokeDasharray="2 2" />
                        <Text style={[styles.bannerPillText, selectedBannerId === 'A37YJe5q03WXZmpvWK' && styles.bannerPillTextSelected]}>Square</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        activeOpacity={0.7} 
                        style={[styles.bannerPill, selectedBannerId === 'E9YaWrZMql3YZnRd74' && styles.bannerPillSelected]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setSelectedBannerId('E9YaWrZMql3YZnRd74');
                        }}
                      >
                        <Maximize2 color={selectedBannerId === 'E9YaWrZMql3YZnRd74' ? "#000000" : "rgba(0, 0, 0, 0.5)"} size={16} strokeWidth={2} strokeDasharray="2 2" />
                        <Text style={[styles.bannerPillText, selectedBannerId === 'E9YaWrZMql3YZnRd74' && styles.bannerPillTextSelected]}>Portrait</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        activeOpacity={0.7} 
                        style={[styles.bannerPill, selectedBannerId === 'agXkA3Dw0zNEbW2VBY' && styles.bannerPillSelected]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setSelectedBannerId('agXkA3Dw0zNEbW2VBY');
                        }}
                      >
                        <Layout color={selectedBannerId === 'agXkA3Dw0zNEbW2VBY' ? "#000000" : "rgba(0, 0, 0, 0.5)"} size={16} strokeWidth={2} strokeDasharray="2 2" />
                        <Text style={[styles.bannerPillText, selectedBannerId === 'agXkA3Dw0zNEbW2VBY' && styles.bannerPillTextSelected]}>Default</Text>
                      </TouchableOpacity>
                    </View>
                  </View> */}
                </>
              ) : (
                <View style={styles.uploadButtonsContainer}>
                  <TouchableOpacity activeOpacity={0.7} style={styles.uploadButton} onPress={() => handleUploadFile('photo')}>
                    <ImageIcon color="#000000" size={20} strokeWidth={2.5} />
                    <Text style={styles.uploadButtonText}>Upload Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} style={styles.uploadButton} onPress={() => handleUploadFile('video')}>
                    <Video color="#000000" size={20} strokeWidth={2.5} />
                    <Text style={styles.uploadButtonText}>Upload Video</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {(uploadedVideos.length > 0 || uploadedPhotos.length > 0) && (
                <View style={styles.uploadedFilesContainer}>
                  {mediaOrder.map((uri, index) => {
                    const isVideo = uploadedVideos.includes(uri);
                    const isCarouselMode = contentType === 'post' && postType === 'carousel';
                    const isDragging = activeDragIndex === index;
                    const isDropTarget = dropTargetIndex === index;
                    
                    const handlePress = () => {
                      if (!isCarouselMode || mediaOrder.length <= 1) return;
                      
                      // If currently in drag mode (another item is selected)
                      if (activeDragIndex !== null && activeDragIndex !== index) {
                        // This is the drop target - perform swap
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }
                        swapMediaItems(activeDragIndex, index);
                        return;
                      }
                      
                      // If this item is already selected, deselect it
                      if (activeDragIndex === index) {
                        setActiveDragIndex(null);
                        setDropTargetIndex(null);
                        return;
                      }
                    };
                    
                    const handleLongPress = () => {
                      if (!isCarouselMode || mediaOrder.length <= 1) return;
                      
                      // Start drag mode
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }
                      setActiveDragIndex(index);
                      setDropTargetIndex(null);
                    };
                    
                    return (
                      <Pressable
                        key={uri}
                        onPress={handlePress}
                        onLongPress={handleLongPress}
                        delayLongPress={1000}
                        style={[
                          styles.uploadedFileItem,
                          isDragging && styles.uploadedFileItemDragging,
                          isDropTarget && styles.uploadedFileItemDropTarget
                        ]}
                      >
                        <Image source={{ uri }} style={styles.uploadedImage} />
                        
                        <TouchableOpacity
                          style={styles.uploadedRemoveButton}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            if (isVideo) {
                              setUploadedVideos(prev => prev.filter(item => item !== uri));
                            } else {
                              setUploadedPhotos(prev => prev.filter(item => item !== uri));
                            }
                            removeMediaFromOrder(uri);
                          }}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X color="#ffffff" size={18} strokeWidth={2.5} />
                        </TouchableOpacity>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Commented out for future use - Media Link section */}
            {/* {contentType !== 'story' && (
              <>
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLineDark} />
                  <Text style={styles.dividerTextDark}>OR</Text>
                  <View style={styles.dividerLineDark} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.labelDark}>Paste Media Link</Text>
                  <View style={styles.glassInputWrapperDark}>
                    <TextInput
                      style={styles.inputDark}
                      placeholder="https://..."
                      placeholderTextColor="rgba(0, 0, 0, 0.4)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={false}
                    />
                  </View>
                </View>
              </>
            )} */}
          </LinearGradient>

          {/* Commented out for future use - Title field */}
          {/* <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inputCard}
          >
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.labelDark}>Title</Text>
                <View style={styles.labelBadgeDark}>
                  <Text style={styles.labelBadgeTextDark}>Required</Text>
                </View>
              </View>
              <View style={styles.glassInputWrapperDark}>
                <View style={styles.inputWithMicInside}>
                  <TextInput
                    style={styles.inputDarkWithMic}
                    placeholder="Enter title..."
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    value={title}
                    onChangeText={setTitle}
                  />
                  <TouchableOpacity
                    onPress={toggleTitleRecording}
                    activeOpacity={0.7}
                    style={[styles.micButtonInside, isRecordingTitle && styles.micButtonActiveInside]}
                  >
                    {isRecordingTitle ? (
                      <AnimatedWave size={18} color="#ffffff" />
                    ) : (
                      <Mic color={isRecordingTitle ? "#ffffff" : "#000000"} size={18} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient> */}

          {contentType !== 'story' && (
            <LinearGradient
              colors={['#fbbf24', '#f59e0b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inputCard}
            >
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelDark}>Caption</Text>
                </View>
                <View style={styles.glassInputWrapperDark}>
                  <View style={styles.inputWithMicInside}>
                    <TextInput
                      style={[styles.inputDarkWithMic, styles.textArea, styles.inputWithAIButton]}
                      placeholder="Write your caption..."
                      placeholderTextColor="rgba(0, 0, 0, 0.4)"
                      value={caption}
                      onChangeText={setCaption}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                    />
                    <TouchableOpacity
                      onPress={handleRegenerateCaption}
                      activeOpacity={0.7}
                      disabled={isRegeneratingCaption}
                      style={[styles.aiButtonInside, styles.aiButtonCaption]}
                    >
                      {isRegeneratingCaption ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Sparkles color="#ffffff" size={18} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={toggleCaptionRecording}
                      activeOpacity={0.7}
                      style={[styles.micButtonInside, isRecordingCaption && styles.micButtonActiveInside, styles.micButtonCaption]}
                    >
                      {isRecordingCaption ? (
                        <AnimatedWave size={18} color="#ffffff" />
                      ) : (
                        <Mic color={isRecordingCaption ? "#ffffff" : "#000000"} size={18} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </LinearGradient>
          )}

          {contentType !== 'story' && (
            <LinearGradient
              colors={['#a3e635', '#84cc16']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tagsCard}
            >
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.labelDark}>UserTag</Text>
                <View style={styles.labelBadgeOptionalDark}>
                  <Text style={styles.labelBadgeTextOptionalDark}>Optional</Text>
                </View>
              </View>
              <View style={styles.tagInputContainer}>
                <View style={styles.glassTagInputDark}>
                  <Text style={styles.atSymbol}>@</Text>
                  <TextInput
                    style={styles.tagInputFieldDark}
                    placeholder="Add a tag..."
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                    editable={tags.length < 3}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleAddTag}
                  activeOpacity={0.7}
                  style={[styles.addTagButtonDark, tags.length >= 3 && styles.addTagButtonDisabled]}
                  disabled={tags.length >= 3}
                >
                  <Text style={styles.addTagButtonTextDark}>Add</Text>
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View style={styles.addedTagsContainer}>
                  {tags.map((tag) => (
                    <View key={tag} style={styles.addedTag}>
                      <View style={styles.addedTagLeft}>
                        <Check color="#000000" size={16} strokeWidth={3} />
                        <Text style={styles.addedTagText}>@{tag}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveTag(tag)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X color="#000000" size={16} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </LinearGradient>
          )}

          <LinearGradient
            colors={['#fb923c', '#f97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scheduleCard}
          >
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.labelDark}>Schedule</Text>
                <View style={styles.labelBadgeOptionalDark}>
                  <Text style={styles.labelBadgeTextOptionalDark}>Optional</Text>
                </View>
              </View>
              <View style={styles.scheduleInputContainer}>
                <TouchableOpacity activeOpacity={0.7} style={styles.scheduleButtonDark} onPress={handleSchedulePress}>
                  <Calendar color="#000000" size={18} strokeWidth={2} />
                  <Text style={styles.scheduleButtonTextDark}>
                    {formatDateTime(scheduleDate)}
                  </Text>
                </TouchableOpacity>
                {scheduleDate && (
                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    style={styles.clearScheduleButton} 
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setScheduleDate(null);
                    }}
                  >
                    <X color="#ef4444" size={18} strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.postOnCard}
          >
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.labelDark}>Post On</Text>
              </View>
              <View style={styles.platformsGrid}>
                {SOCIAL_PLATFORMS.filter(platform => connectedPlatforms.includes(platform.id)).map((platform) => {
                  const isCarousel = contentType === 'post' && postType === 'carousel';
                  const isStory = contentType === 'story';
                  const isPost = contentType === 'post';
                  const isDisabled = (isCarousel && platform.id !== 'instagram') || (isStory && (platform.id === 'youtube' || platform.id === 'tiktok')) || (isPost && platform.id === 'youtube');
                  
                  return (
                    <TouchableOpacity
                      key={platform.id}
                      activeOpacity={isDisabled ? 1 : 0.7}
                      onPress={() => handleTogglePlatform(platform.id)}
                      style={[
                        styles.platformCheckbox,
                        selectedPlatforms.includes(platform.id) && styles.platformCheckboxSelected,
                        isDisabled && styles.platformCheckboxDisabled,
                      ]}
                      disabled={isDisabled}
                    >
                      <View style={styles.platformCheckboxContent}>
                        <View style={styles.checkboxIndicator}>
                          {selectedPlatforms.includes(platform.id) && (
                            <Check color="#8b5cf6" size={16} strokeWidth={3} />
                          )}
                        </View>
                        <Image
                          source={{ uri: platform.icon }}
                          style={[styles.platformIcon, isDisabled && styles.platformIconDisabled]}
                        />
                        <Text style={[
                          styles.platformName,
                          selectedPlatforms.includes(platform.id) && styles.platformNameSelected,
                          isDisabled && styles.platformNameDisabled,
                        ]}>
                          {platform.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </LinearGradient>

          <TouchableOpacity
            style={[
              styles.createButtonWrapper,
              // Commented out for future use - Title validation in button disabled condition
              // (((contentType === 'post' || contentType === 'story') && !title) || isSubmitting) && styles.createButtonDisabled,
              isSubmitting && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            activeOpacity={0.8}
            // Commented out for future use - Title validation in button disabled prop
            // disabled={isSubmitting || ((contentType === 'post' || contentType === 'story') && !title)}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={contentType === 'post'
                ? ['#60a5fa', '#3b82f6']
                : contentType === 'reel'
                ? ['#fbbf24', '#f59e0b']
                : ['#ec4899', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createButtonGradient}
            >
              <View style={styles.createButtonInner}>
                {isSubmitting && (
                  <ActivityIndicator color="#ffffff" size="small" style={styles.createButtonSpinner} />
                )}
                <Text style={styles.createButtonText}>
                  {isSubmitting ? 'Submitting...' : contentType === 'post' ? 'Submit Post' : contentType === 'reel' ? 'Submit Reel' : 'Submit Story'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Custom Schedule Modal - All Platforms */}
      {(showScheduleModal || (Platform.OS === 'ios' && showDatePicker)) && (
        <Modal
          visible={showScheduleModal || showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <TouchableOpacity 
            style={styles.modalOverlaySchedule}
            activeOpacity={1}
            onPress={Platform.OS === 'ios' ? () => setShowDatePicker(false) : handleScheduleCancel}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.scheduleModalContent}
            >
              <View style={styles.scheduleModalHeader}>
                <Text style={styles.scheduleModalTitle}>Schedule Post</Text>
                <TouchableOpacity 
                  onPress={Platform.OS === 'ios' ? () => setShowDatePicker(false) : handleScheduleCancel} 
                  style={styles.scheduleCloseButton}
                >
                  <X color="#ffffff" size={24} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.scheduleModalBody}>
                {Platform.OS === 'ios' ? (
                  <View style={styles.pickersContainer}>
                    <DateTimePicker
                      value={scheduleDate || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      textColor="#ffffff"
                      style={styles.datePicker}
                    />
                    <DateTimePicker
                      value={scheduleDate || new Date()}
                      mode="time"
                      display="spinner"
                      onChange={handleTimeChange}
                      textColor="#ffffff"
                      style={styles.timePicker}
                    />
                  </View>
                ) : (
                  <>
                    <View style={styles.dateTimeRow}>
                      <View style={styles.dateInputWrapper}>
                        <Text style={styles.inputLabel}>Date</Text>
                        <input
                          type="date"
                          value={tempDate.toISOString().split('T')[0]}
                          onChange={handleDateInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '15px',
                            borderRadius: '12px',
                            border: '2px solid #3b82f6',
                            backgroundColor: '#0a0a0a',
                            color: '#ffffff',
                            fontFamily: 'Archivo',
                          }}
                        />
                      </View>

                      <View style={styles.timeInputWrapper}>
                        <Text style={styles.inputLabel}>Time</Text>
                        <input
                          type="time"
                          value={`${tempDate.getHours().toString().padStart(2, '0')}:${tempDate.getMinutes().toString().padStart(2, '0')}`}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const roundedMinutes = Math.round(minutes / 5) * 5;
                            setTempDate(prev => {
                              const updated = new Date(prev);
                              updated.setHours(hours);
                              updated.setMinutes(roundedMinutes);
                              updated.setSeconds(0);
                              updated.setMilliseconds(0);
                              return updated;
                            });
                          }}
                          step="300"
                          style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '15px',
                            borderRadius: '12px',
                            border: '2px solid #3b82f6',
                            backgroundColor: '#0a0a0a',
                            color: '#ffffff',
                            fontFamily: 'Archivo',
                          }}
                        />
                      </View>
                    </View>

                    <View style={styles.previewDisplay}>
                      <Text style={styles.previewLabel}>Scheduled for:</Text>
                      <Text style={styles.previewValue}>{formatDateTime(tempDate)}</Text>
                    </View>

                    <View style={styles.scheduleModalActions}>
                      <TouchableOpacity
                        style={styles.scheduleCancelButton}
                        onPress={handleScheduleCancel}
                      >
                        <Text style={styles.scheduleCancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.scheduleConfirmButton}
                        onPress={handleScheduleConfirm}
                      >
                        <LinearGradient
                          colors={['#fb923c', '#f97316']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.scheduleConfirmGradient}
                        >
                          <Text style={styles.scheduleConfirmButtonText}>Confirm</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={scheduleDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={scheduleDate || new Date()}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
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
  backButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
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
    color: '#ffffff',
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  toggleContainer: {
    marginBottom: 24,
  },
  toggleBackground: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleSlider: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '31%',
    borderRadius: 20,
  },
  toggleSliderInner: {
    flex: 1,
    borderRadius: 20,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  toggleText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.4,
  },
  toggleTextActivePost: {
    color: '#fbbf24',
  },
  toggleTextActiveReel: {
    color: '#60a5fa',
  },
  toggleTextActiveStory: {
    color: '#3b82f6',
  },
  inputSection: {
    gap: 20,
  },
  inputCard: {
    borderRadius: 32,
    padding: 24,
    gap: 24,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  uploadCard: {
    borderRadius: 32,
    padding: 24,
    gap: 20,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  tagsCard: {
    borderRadius: 32,
    padding: 24,
    shadowColor: '#a3e635',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  scheduleCard: {
    borderRadius: 32,
    padding: 24,
    shadowColor: '#fb923c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  postOnCard: {
    borderRadius: 32,
    padding: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  postTypeCard: {
    borderRadius: 32,
    padding: 24,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  postTypeOptionsContainer: {
    gap: 12,
  },
  postTypeOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postTypeOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ec4899',
  },
  postTypeLabel: {
    flex: 1,
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  postTypeLabelSelected: {
    color: '#000000',
  },
  platformsGrid: {
    gap: 12,
  },
  platformCheckbox: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    overflow: 'hidden',
  },
  platformCheckboxSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  platformCheckboxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  checkboxIndicator: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  platformIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  platformName: {
    flex: 1,
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  platformNameSelected: {
    color: '#000000',
  },
  platformCheckboxDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.5,
  },
  platformIconDisabled: {
    opacity: 0.4,
  },
  platformNameDisabled: {
    color: 'rgba(0, 0, 0, 0.4)',
  },
  inputGroup: {
    gap: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.4,
  },
  labelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labelBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Archivo-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelBadgeOptional: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labelBadgeTextOptional: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontFamily: 'Archivo-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  glassInputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    minHeight: 140,
    paddingTop: 18,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Archivo-Bold',
    letterSpacing: 2,
  },
  uploadButtonsContainer: {
    gap: 10,
  },
  uploadButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  uploadButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  storyStyleSection: {
    marginTop: 20,
  },
  storyStyleHeading: {
    color: '#000000',
    fontSize: 15,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  bannerPillsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  bannerPill: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  bannerPillSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  bannerPillText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 14,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.2,
  },
  bannerPillTextSelected: {
    color: '#000000',
  },
  labelDark: {
    color: '#000000',
    fontSize: 17,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.4,
  },
  labelBadgeDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labelBadgeTextDark: {
    color: '#000000',
    fontSize: 11,
    fontFamily: 'Archivo-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelBadgeOptionalDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labelBadgeTextOptionalDark: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 11,
    fontFamily: 'Archivo-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  glassInputWrapperDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  inputWithMicInside: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputDarkWithMic: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingRight: 56,
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  micButtonInside: {
    position: 'absolute',
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActiveInside: {
    backgroundColor: '#ef4444',
  },
  micButtonCaption: {
    top: 12,
  },
  aiButtonInside: {
    position: 'absolute',
    right: 56,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiButtonCaption: {
    top: 12,
  },
  aiButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  inputWithAIButton: {
    paddingRight: 100,
  },
  inputDark: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  scheduleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scheduleButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    flex: 1,
  },
  scheduleButtonTextDark: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  clearScheduleButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dividerLineDark: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  dividerTextDark: {
    color: '#000000',
    fontSize: 13,
    fontFamily: 'Archivo-Bold',
    letterSpacing: 2,
  },
  glassTagInputDark: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  atSymbol: {
    paddingLeft: 20,
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
  },
  tagInputFieldDark: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 18,
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  addTagButtonDisabled: {
    opacity: 0.5,
  },
  addedTagsContainer: {
    gap: 12,
  },
  addedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addedTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addedTagText: {
    color: '#000000',
    fontSize: 15,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  addTagButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  addTagButtonTextDark: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  glassTagInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tagInputField: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  addTagButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addTagButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tagText: {
    color: '#000000',
    fontSize: 15,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  scheduleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scheduleButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  platformsSection: {
    gap: 16,
  },
  platformsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformsTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.4,
  },
  platformsBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  platformsBadgeText: {
    color: '#60a5fa',
    fontSize: 12,
    fontFamily: 'Archivo-Bold',
    letterSpacing: 0.5,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformChip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  platformChipInactive: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  platformChipText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  platformChipTextActive: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  createButtonWrapper: {
    marginTop: 12,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonGradient: {
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  uploadedFilesContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  uploadedFileItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'visible',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  uploadedFilePreview: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  uploadedRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    borderRadius: 14,
    padding: 6,
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadedFileItemDragging: {
    opacity: 0.6,
    transform: [{ scale: 1.1 }],
    borderColor: '#ec4899',
    borderWidth: 3,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  uploadedFileItemDropTarget: {
    borderColor: '#10b981',
    borderWidth: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  dragHandleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    zIndex: 5,
  },
  dragHandleIcon: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 520,
  },
  pickersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalCancelText: {
    color: '#000000',
    fontSize: 17,
    fontFamily: 'Inter-Regular',
  },
  modalTitle: {
    color: '#000000',
    fontSize: 17,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.4,
  },
  modalDoneText: {
    color: '#3b82f6',
    fontSize: 17,
    fontFamily: 'Archivo-Bold',
  },
  datePicker: {
    flex: 1,
    width: '100%',
  },
  timePicker: {
    flex: 1,
    width: '100%',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.4,
  },
  createButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonSpinner: {
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
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
  selectBox: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectBoxGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  selectLabel: {
    color: '#60a5fa',
    fontSize: 12,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  selectedPostsPreview: {
    marginBottom: 24,
  },
  previewTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  previewScroll: {
    gap: 12,
    paddingRight: 16,
  },
  previewCard: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewThumbnail: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(96, 165, 250, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
  },
  selectModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  selectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  selectModalTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontFamily: 'Inter-Thin',
    letterSpacing: -1,
    lineHeight: 36,
  },
  selectModalSubtitle: {
    color: '#fb923c',
    fontSize: 32,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -1,
    lineHeight: 36,
    marginTop: -4,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectCountBadge: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectCountBadgeInner: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  selectCountText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.2,
  },
  selectModalScroll: {
    flex: 1,
  },
  selectModalScrollContent: {
    padding: 20,
    gap: 16,
  },
  selectModalItem: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  selectModalItemSelected: {
    backgroundColor: '#1a1a1a',
  },
  selectModalItemImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  selectModalItemImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  checkmarkCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectModalItemContent: {
    padding: 16,
    gap: 8,
  },
  selectModalItemPlatformBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectModalItemPlatformIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  selectModalItemTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  selectModalItemSource: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
  },
  selectModalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  persistentNotification: {
    position: 'absolute',
    right: 16,
    left: 16,
    zIndex: 10000,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 9,
  },
  persistentNotificationPosting: {
    backgroundColor: '#3b82f6',
  },
  persistentNotificationSuccess: {
    backgroundColor: '#10b981',
  },
  persistentNotificationFailed: {
    backgroundColor: '#ef4444',
  },
  persistentNotificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  persistentNotificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  persistentNotificationSpinner: {
    marginRight: 0,
  },
  persistentNotificationIconSuccess: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  persistentNotificationIconError: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  persistentNotificationText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Archivo-SemiBold',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  persistentNotificationClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
  notificationInfo: {
    backgroundColor: '#3b82f6',
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
  notificationSpinner: {
    marginRight: 0,
  },
  notificationText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Archivo-SemiBold',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  modalOverlaySchedule: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  scheduleModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '50%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  scheduleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  scheduleModalTitle: {
    fontSize: 20,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  scheduleCloseButton: {
    padding: 4,
  },
  scheduleModalBody: {
    flex: 1,
    padding: 20,
    gap: 12,
    overflow: 'hidden',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  timeInputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Archivo-SemiBold',
    color: '#ffffff',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  previewDisplay: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 2,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: 'Archivo-Medium',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: -0.2,
  },
  previewValue: {
    fontSize: 15,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  scheduleModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scheduleCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleCancelButtonText: {
    fontSize: 16,
    fontFamily: 'Archivo-SemiBold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  scheduleConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scheduleConfirmGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleConfirmButtonText: {
    fontSize: 16,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
});
