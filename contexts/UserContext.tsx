import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';

interface UserContextType {
  fullName: string;
  email: string;
  profileImage: string;
  appLogo: string;
  socialMediaImages: {
    instagram: string;
    tiktok: string;
    youtube: string;
    snapchat: string;
    twitter: string;
    facebook: string;
  };
  setFullName: (name: string) => void;
  setEmail: (email: string) => void;
  setProfileImage: (url: string) => void;
  refreshUserData: () => Promise<void>;
  preloadImages: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_PROFILE_IMAGE = 'https://i.imgur.com/vhILBC1.png';
const DEFAULT_APP_LOGO = 'https://i.imgur.com/vhILBC1.png';

const SOCIAL_MEDIA_IMAGES = {
  instagram: 'https://i.imgur.com/vkcuEzE.png',
  tiktok: 'https://i.imgur.com/K2FKVUP.png',
  youtube: 'https://i.imgur.com/8H35ptZ.png',
  snapchat: 'https://i.imgur.com/XF3FRka.png',
  twitter: 'https://i.imgur.com/fPOjKNr.png',
  facebook: 'https://i.imgur.com/zfY36en.png',
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [fullName, setFullNameState] = useState('RAPDXB');
  const [email, setEmailState] = useState('');
  const [profileImage, setProfileImageState] = useState(DEFAULT_PROFILE_IMAGE);
  const [appLogo] = useState(DEFAULT_APP_LOGO);
  const [socialMediaImages] = useState(SOCIAL_MEDIA_IMAGES);

  // Preload all images for better performance
  const preloadImages = () => {
    const imagesToPreload = [
      DEFAULT_APP_LOGO,
      ...Object.values(SOCIAL_MEDIA_IMAGES),
    ];

    imagesToPreload.forEach((imageUrl) => {
      Image.prefetch(imageUrl).catch(() => {
        // Silently handle prefetch errors
      });
    });
  };

  // Load user data from AsyncStorage
  const loadUserData = async () => {
    try {
      const [storedFullName, storedEmail] = await Promise.all([
        AsyncStorage.getItem('fullName'),
        AsyncStorage.getItem('email'),
      ]);

      if (storedFullName) {
        setFullNameState(storedFullName);
      }
      if (storedEmail) {
        setEmailState(storedEmail);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // Initialize on mount
  useEffect(() => {
    loadUserData();
    preloadImages();
  }, []);

  const setFullName = (name: string) => {
    setFullNameState(name);
    AsyncStorage.setItem('fullName', name).catch(() => {});
  };

  const setEmail = (newEmail: string) => {
    setEmailState(newEmail);
    AsyncStorage.setItem('email', newEmail).catch(() => {});
  };

  const setProfileImage = (url: string) => {
    setProfileImageState(url);
    AsyncStorage.setItem('instagramProfileUrl', url).catch(() => {});
    // Preload the new image
    Image.prefetch(url).catch(() => {});
  };

  const refreshUserData = async () => {
    await loadUserData();
  };

  const value = {
    fullName,
    email,
    profileImage,
    appLogo,
    socialMediaImages,
    setFullName,
    setEmail,
    setProfileImage,
    refreshUserData,
    preloadImages,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
