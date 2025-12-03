# Project Context & Handoff Document

Copy and paste this entire document into a new Claude chat to continue working on this project with full context.

---

## Project Overview

This is a **social media analytics dashboard** built with **Expo (React Native)** for cross-platform mobile development. The app displays social media metrics, followers, likes, and growth analytics across multiple platforms.

**Project Type:** Expo Router app (SDK 54)
**Platform:** Web-first (native APIs require platform checks)
**Database:** Supabase (configured but no tables/migrations yet)

---

## Current Features Implemented

### 1. **Tab-Based Navigation**
- Custom tab bar with 5 tabs: Communication (index), Feed, Post (center button), Stats, Settings
- Animated swipe gestures between tabs using `react-native-reanimated` and `react-native-gesture-handler`
- Custom SVG icons with gradient backgrounds
- Elevated center "Post" button with white background
- Dark theme (#000000 background, #1a1a1a tab bar)

### 2. **Home Screen (Main Dashboard)**
Location: `app/(tabs)/home.tsx`

**Key Features:**
- Header with logo, notification bell (with unread indicator), and profile image
- Greeting section: "Hello, RAPDXB" with verified badge
- Interactive notification popup system with:
  - Glass morphism design
  - Three notification types (upload, heart, website) with gradient icons
  - Read/unread state management
  - Dismissable overlay
  - Haptic feedback on interactions

**Analytics Cards:**
- **Purple Card (Followers):** 56.1K followers, gradient background, custom corner radius
- **Yellow Card (Likes):** 903K likes, custom SVG clip path for unique shape
- **Blue Card (Social Analytics):**
  - Bar chart showing Instagram vs Others performance (Aug, Sep, Oct)
  - Animated bars using `react-native-reanimated`
  - Auto-scrolling platform carousel (Instagram, TikTok, YouTube, Snapchat, Twitter, Facebook)
  - Platform cards show follower and like counts
- **Green Circle Card:** Posting hours (7-9PM)
- **Orange Card:** 13.4% growth with animated SVG path and moving orb

**Technical Implementation:**
- Pull-to-refresh functionality
- Complex animations with `Animated` API
- SVG patterns, gradients, and custom shapes
- Background images with opacity overlays
- Scroll view with bottom padding for tab bar clearance

### 3. **Secondary Screens**
All secondary screens share consistent styling:
- Header with back button, title, and placeholder for symmetry
- Dark theme (#000000 background)
- Back button navigates to home
- Haptic feedback on button press (platform-aware)

**Screens:**
- **Community** (`app/(tabs)/community.tsx`) - Placeholder screen
- **Feed** (`app/(tabs)/feed.tsx`) - Notifications list with colored icon badges
- **Post** (`app/(tabs)/post.tsx`) - Create post placeholder
- **Stats** (`app/(tabs)/stats.tsx`) - Placeholder screen
- **Settings** (`app/(tabs)/settings.tsx`) - Placeholder screen
- **Account** (`app/(tabs)/account.tsx`) - Placeholder screen

### 4. **Typography & Fonts**
Using Google Fonts via `@expo-google-fonts`:
- **Inter:** Thin (100), Light (300), Regular (400), Medium (500), SemiBold (600)
- **Archivo:** Bold (700) for headings/titles

Font loading with splash screen management in `app/_layout.tsx`

### 5. **Design System**
- **Color Palette:**
  - Background: `#000000`
  - Tab bar: `#1a1a1a`
  - Purple: `#8b5cf6` → `#7c3aed`
  - Yellow: `#fbbf24` → `#f59e0b`
  - Blue: `#60a5fa` → `#3b82f6`
  - Green: `#a3e635` → `#84cc16`
  - Orange: `#fb923c` → `#f97316`
- **Border Radius:** Consistent 24px, 28px, 38px for cards
- **Icons:** Lucide React Native with custom SVG icons
- **Spacing:** Clean, modern spacing with gap utilities

---

## Technical Architecture

### File Structure
```
app/
├── _layout.tsx              # Root layout with fonts, Stack nav
├── index.tsx                # Redirects to /(tabs)/home
├── (tabs)/
│   ├── _layout.tsx          # Tab bar configuration & swipe gestures
│   ├── home.tsx             # Main dashboard (1132 lines)
│   ├── index.tsx            # Communication tab placeholder
│   ├── feed.tsx             # Notifications feed
│   ├── post.tsx             # Create post screen
│   ├── community.tsx        # Community screen
│   ├── stats.tsx            # Stats screen
│   ├── settings.tsx         # Settings screen
│   └── account.tsx          # Account screen
hooks/
└── useFrameworkReady.ts     # CRITICAL: Framework initialization hook
```

### Key Dependencies
- `expo-router` (6.0.12) - File-based routing
- `react-native-reanimated` (4.1.1) - Advanced animations
- `react-native-gesture-handler` (2.28.0) - Gesture system
- `expo-linear-gradient` - Gradient backgrounds
- `lucide-react-native` - Icon system
- `react-native-svg` - SVG rendering
- `expo-haptics` - Haptic feedback (platform-aware)
- `@supabase/supabase-js` - Database (not yet implemented)

### Environment Variables
Located in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[key provided]
```

---

## Database Status

**Supabase is configured but not yet used:**
- No tables created
- No migrations applied
- Connection credentials are in `.env`
- Ready for implementation when needed

---

## Design Patterns & Conventions

### Platform-Specific Code
Always use platform checks for native-only features:
```typescript
if (Platform.OS !== 'web') {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
```

### Navigation
- Use `router.replace()` for tab switching (prevents stack buildup)
- Use `router.push()` for secondary screens
- Home is the default route via redirect in `app/index.tsx`

### Styling
- All styles use `StyleSheet.create()`
- No inline styles
- Consistent use of `useSafeAreaInsets()` for status bar padding
- Colors use rgba for transparency

### Animation Patterns
- Bar charts: Sequential animation with delays
- Scrolling: Continuous loop with reset
- Orb movement: Interpolated path coordinates
- All animations use `useNativeDriver` when possible

---

## Known Behaviors

1. **Tab Bar Swipe Gesture:**
   - Swipe left/right to navigate between tabs
   - 30px threshold for activation
   - Visual feedback with translateX animation
   - Haptic feedback on navigation

2. **Notification System:**
   - Bell icon shows red dot when unread notifications exist
   - Clicking notification marks it as read (opacity changes)
   - Modal overlay dismisses popup
   - Notifications reset on pull-to-refresh

3. **Auto-Scrolling Banner:**
   - Platform cards scroll continuously in blue analytics card
   - Duplicated content for seamless loop
   - 20-second cycle duration

---

## Next Steps / TODOs

**Potential features to implement:**
1. Connect real data from Supabase database
2. Implement authentication system
3. Build out Create Post functionality (camera integration?)
4. Add real-time data fetching/updates
5. Implement Stats screen with detailed analytics
6. Build Settings screen (theme, notifications, account)
7. Community features (comments, interactions)
8. Profile/Account management
9. Data export functionality
10. Push notifications integration

---

## Important Notes

⚠️ **CRITICAL:** Never remove or modify the `useFrameworkReady()` hook in `app/_layout.tsx` - it's required for the framework to function properly.

⚠️ **Platform Target:** This is a web-first project. Native-only APIs require platform checks.

⚠️ **Image Sources:** All images use direct URLs (Imgur hosting). Consider moving to assets or CDN for production.

⚠️ **Hardcoded Data:** All metrics, followers, likes, and platform data are currently hardcoded. Ready for database integration.

---

## Complete Image Asset URLs

**Critical:** All images must use these exact URLs for the app to look identical:

### Header Images
- **Logo:** `https://i.imgur.com/Qyjvjv0.png` (48x48)
- **Profile Image:** `https://i.imgur.com/vhILBC1.png` (48x48, circular)
- **Verified Badge:** `https://i.imgur.com/5rF4a1S.png` (28x28)

### Card Background Images
- **Purple/Yellow/Green Card Pattern:** `https://i.imgur.com/3k5Bxer.png` (210x210, opacity 0.3-0.4)
- **Blue Card Pattern:** `https://i.imgur.com/Y4IXN1r.png` (full card size, opacity 0.3)
- **Green Card Pattern:** `https://i.imgur.com/O9spy4H.png` (320x320, opacity 0.3)

### Platform Icons (14x14 in scrolling banner)
- **Instagram:** `https://i.imgur.com/vkcuEzE.png`
- **TikTok:** `https://i.imgur.com/K2FKVUP.png`
- **YouTube:** `https://i.imgur.com/8H35ptZ.png`
- **Snapchat:** `https://i.imgur.com/XF3FRka.png`
- **Twitter:** `https://i.imgur.com/fPOjKNr.png`
- **Facebook:** `https://i.imgur.com/zfY36en.png`

### Platform Data (Exact Values)
```javascript
const PLATFORM_DATA = [
  { name: 'Instagram', followers: '21.6K', likes: '743K', icon: 'https://i.imgur.com/vkcuEzE.png', color: '#E1306C' },
  { name: 'TikTok', followers: '18.3K', likes: '146K', icon: 'https://i.imgur.com/K2FKVUP.png', color: '#000000' },
  { name: 'YouTube', followers: '3.7K', likes: '4.5K', icon: 'https://i.imgur.com/8H35ptZ.png', color: '#FF0000' },
  { name: 'Snapchat', followers: '8.7K', likes: '2.3K', icon: 'https://i.imgur.com/XF3FRka.png', color: '#FFFC00' },
  { name: 'Twitter', followers: '1.2K', likes: '3.4K', icon: 'https://i.imgur.com/fPOjKNr.png', color: '#1DA1F2' },
  { name: 'Facebook', followers: '2.6K', likes: '3.1K', icon: 'https://i.imgur.com/zfY36en.png', color: '#1877F2' },
];
```

---

## Complete SVG Icons (Custom Tab Bar)

### Communication Icon (Tab 1)
```jsx
<Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <Path
    d="M18.5 16C20.433 16 22 13.0899 22 9.5C22 5.91015 20.433 3 18.5 3M18.5 16C16.567 16 15 13.0899 15 9.5C15 5.91015 16.567 3 18.5 3M18.5 16L5.44354 13.6261C4.51605 13.4575 4.05231 13.3731 3.67733 13.189C2.91447 12.8142 2.34636 12.1335 2.11414 11.3159C2 10.914 2 10.4427 2 9.5C2 8.5573 2 8.08595 2.11414 7.68407C2.34636 6.86649 2.91447 6.18577 3.67733 5.81105C4.05231 5.62685 4.51605 5.54254 5.44354 5.3739L18.5 3M5 14L5.39386 19.514C5.43126 20.0376 5.44996 20.2995 5.56387 20.4979C5.66417 20.6726 5.81489 20.8129 5.99629 20.9005C6.20232 21 6.46481 21 6.98979 21H8.7722C9.37234 21 9.67242 21 9.89451 20.8803C10.0897 20.7751 10.2443 20.6081 10.3342 20.4055C10.4365 20.1749 10.4135 19.8757 10.3675 19.2773L10 14.5"
    stroke={focused ? '#1a1a1a' : '#ffffff'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
```

### Feed Icon (Tab 2)
```jsx
<Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <Path
    d="M12 20H5.2C4.07989 20 3.51984 20 3.09202 19.782C2.71569 19.5903 2.40973 19.2843 2.21799 18.908C2 18.4802 2 17.9201 2 16.8V7.2C2 6.07989 2 5.51984 2.21799 5.09202C2.40973 4.71569 2.71569 4.40973 3.09202 4.21799C3.51984 4 4.07989 4 5.2 4H5.6C7.84021 4 8.96031 4 9.81596 4.43597C10.5686 4.81947 11.1805 5.43139 11.564 6.18404C12 7.03968 12 8.15979 12 10.4M12 20V10.4M12 20H18.8C19.9201 20 20.4802 20 20.908 19.782C21.2843 19.5903 21.5903 19.2843 21.782 18.908C22 18.4802 22 17.9201 22 16.8V7.2C22 6.07989 22 5.51984 21.782 5.09202C21.5903 4.71569 21.2843 4.40973 20.908 4.21799C20.4802 4 19.9201 4 18.8 4H18.4C16.1598 4 15.0397 4 14.184 4.43597C13.4314 4.81947 12.8195 5.43139 12.436 6.18404C12 7.03968 12 8.15979 12 10.4"
    stroke={focused ? '#1a1a1a' : '#ffffff'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
```

### Post Icon (Center Button)
```jsx
<Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
  <Path
    d="M16 12L12 8M12 8L8 12M12 8V17.2C12 18.5907 12 19.2861 12.5505 20.0646C12.9163 20.5819 13.9694 21.2203 14.5972 21.3054C15.5421 21.4334 15.9009 21.2462 16.6186 20.8719C19.8167 19.2036 22 15.8568 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 15.7014 4.01099 18.9331 7 20.6622"
    stroke="#1a1a1a"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
```

### Analytics Icon (Tab 4)
```jsx
<Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <Path
    d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3M20 8L16.0811 12.1827C15.9326 12.3412 15.8584 12.4204 15.7688 12.4614C15.6897 12.4976 15.6026 12.5125 15.516 12.5047C15.4179 12.4958 15.3215 12.4458 15.1287 12.3457L11.8713 10.6543C11.6785 10.5542 11.5821 10.5042 11.484 10.4953C11.3974 10.4875 11.3103 10.5024 11.2312 10.5386C11.1416 10.5796 11.0674 10.6588 10.9189 10.8173L7 15"
    stroke={focused ? '#1a1a1a' : '#ffffff'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
```

### Account Icon (Tab 5)
```jsx
<Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <Path
    d="M22 21V19C22 17.1362 20.7252 15.5701 19 15.126M15.5 3.29076C16.9659 3.88415 18 5.32131 18 7C18 8.67869 16.9659 10.1159 15.5 10.7092M17 21C17 19.1362 17 18.2044 16.6955 17.4693C16.2895 16.4892 15.5108 15.7105 14.5307 15.3045C13.7956 15 12.8638 15 11 15H8C6.13623 15 5.20435 15 4.46927 15.3045C3.48915 15.7105 2.71046 16.4892 2.30448 17.4693C2 18.2044 2 19.1362 2 21M13.5 7C13.5 9.20914 11.7091 11 9.5 11C7.29086 11 5.5 9.20914 5.5 7C5.5 4.79086 7.29086 3 9.5 3C11.7091 3 13.5 4.79086 13.5 7Z"
    stroke={focused ? '#1a1a1a' : '#ffffff'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
```

---

## Notification Icons (Home Screen Popup)

### Heart Icon
```jsx
<Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
  <Path
    fillRule="evenodd"
    clipRule="evenodd"
    d="M11.9932 5.13581C9.9938 2.7984 6.65975 2.16964 4.15469 4.31001C1.64964 6.45038 1.29697 10.029 3.2642 12.5604C4.89982 14.6651 9.84977 19.1041 11.4721 20.5408C11.6536 20.7016 11.7444 20.7819 11.8502 20.8135C11.9426 20.8411 12.0437 20.8411 12.1361 20.8135C12.2419 20.7819 12.3327 20.7016 12.5142 20.5408C14.1365 19.1041 19.0865 14.6651 20.7221 12.5604C22.6893 10.029 22.3797 6.42787 19.8316 4.31001C17.2835 2.19216 13.9925 2.7984 11.9932 5.13581Z"
    stroke="#ffffff"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
```

### Website Icon
```jsx
<Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
  <Path
    d="M22 9H2M2 7.8L2 16.2C2 17.8802 2 18.7202 2.32698 19.362C2.6146 19.9265 3.07354 20.3854 3.63803 20.673C4.27976 21 5.11984 21 6.8 21H17.2C18.8802 21 19.7202 21 20.362 20.673C20.9265 20.3854 21.3854 19.9265 21.673 19.362C22 18.7202 22 17.8802 22 16.2V7.8C22 6.11984 22 5.27977 21.673 4.63803C21.3854 4.07354 20.9265 3.6146 20.362 3.32698C19.7202 3 18.8802 3 17.2 3L6.8 3C5.11984 3 4.27976 3 3.63803 3.32698C3.07354 3.6146 2.6146 4.07354 2.32698 4.63803C2 5.27976 2 6.11984 2 7.8Z"
    stroke="#ffffff"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
```

### Upload Icon
```jsx
<Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
  <Path
    d="M21 12V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V12M16 7L12 3M12 3L8 7M12 3V15"
    stroke="#ffffff"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
```

### Notification Gradients
- **Upload:** `['#8b5cf6', '#7c3aed']` (purple)
- **Heart:** `['#fbbf24', '#f59e0b']` (yellow)
- **Website:** `['#10b981', '#059669']` (green)

---

## Exact Data Values & Chart Configuration

### Dashboard Metrics
- **Total Followers:** 56.1k
- **Total Likes:** 903K
- **Growth Rate:** 13.4%
- **Optimal Posting Hours:** 7-9PM
- **User Name:** RAPDXB (with verified badge)

### Bar Chart Data (Blue Analytics Card)
```javascript
const MONTHLY_DATA = [
  { month: 'Aug', instagram: 82, others: 45 },
  { month: 'Sep', instagram: 68, others: 58 },
  { month: 'Oct', instagram: 91, others: 38 },
];
```

**Chart Specifications:**
- Y-axis labels: 4M, 3M, 2M, 1M
- Instagram bars: White (#ffffff) with glow, opacity 1.0
- Other bars: White (#ffffff), opacity 0.35
- Bar width: 12px
- Bar gap: 3px
- Chart height: 120px
- Animation: Sequential with 150ms delay between months

### Orange Card Growth Path (SVG)
```jsx
<Path
  d="M0,75 Q15,55 25,55 Q35,55 45,75 Q55,95 65,75 Q75,55 85,35 Q92,20 100,5 Q105,0 110,-2 Q115,-3 120,-3"
  stroke="#a855f7"
  strokeWidth="3"
  fill="none"
  strokeLinecap="round"
  strokeLinejoin="round"
/>
```

**Animated Orb Coordinates (30 keyframes):**
- X: [0, 3, 6, 9, 12, 15, 18, 21, 24, 25, 28, 31, 35, 39, 43, 47, 51, 55, 59, 63, 67, 72, 77, 83, 90, 100, 105, 110, 115, 120]
- Y: [75, 73, 70, 67, 63, 60, 58, 56.5, 55.5, 55, 55.2, 56, 58, 62, 68, 75, 80, 83, 84, 83, 79, 72, 62, 48, 30, 5, 0, -2, -3, -3]
- Duration: 3000ms loop

### Yellow Card SVG Clip Path
```jsx
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
```

### Notification Data
```javascript
const notifications = [
  { id: 1, text: 'Just Posted To All Socials', read: false, icon: 'upload', time: '2m ago', gradient: ['#8b5cf6', '#7c3aed'] },
  { id: 2, text: 'You Just Hit 10k Likes', read: false, icon: 'heart', time: '1h ago', gradient: ['#fbbf24', '#f59e0b'] },
  { id: 3, text: 'Just Posted To Website', read: false, icon: 'website', time: '3h ago', gradient: ['#10b981', '#059669'] },
];
```

---

## Complete Lucide Icon Usage

All imported from `lucide-react-native`:

### Home Screen
- `Bell` - Notification icon (18px, strokeWidth 1.5)
- `MapPin` - (imported but not actively used)
- `Moon` - (imported but not actively used)
- `Flame` - (imported but not actively used)
- `ChartBar as BarChart` - Analytics header icon (21px, strokeWidth 2.5)
- `X` - Close button in notification popup (20px, strokeWidth 2.5)

### Secondary Screens
- `ArrowLeft` - Back button on all secondary screens (24px, strokeWidth 2)
- `CheckCircle` - Feed screen success notifications (28px, strokeWidth 2.5)
- `AlertTriangle` - Feed screen warning notifications (28px, strokeWidth 2.5)
- `AlertCircle` - Feed screen info/error notifications (28px, strokeWidth 2.5)
- `X` - Feed screen close buttons (20px, strokeWidth 2)

---

## Card Dimensions & Layout

### Top Row (145px height)
- **Purple Card:** 145x145px
  - Border radius: TL 0, TR 38, BL 38, BR 38
  - Gradient: #8b5cf6 → #7c3aed
  - Content: Bottom-aligned

- **Yellow Card:** Flex 1 x 145px
  - Custom SVG shape (rotated 180°)
  - Gradient: #fbbf24 → #f59e0b
  - Content: Bottom-aligned

### Blue Card (270px height)
- Width: 100%
- Border radius: 38px all corners
- Gradient: #60a5fa → #3b82f6
- Sections:
  - Analytics header: 21px icon + "Social Analytics" text
  - Bar chart: 120px height
  - Platform banner: 36px height with auto-scroll

### Bottom Row (160px height)
- **Green Card:** 160x160px
  - Border radius: 80px (perfect circle)
  - Gradient: #a3e635 → #84cc16
  - Content: Center-aligned

- **Orange Card:** Flex 1 x 160px
  - Border radius: TL 38, TR 38, BL 38, BR 0
  - Gradient: #fb923c → #f97316
  - Contains: Diagonal line pattern + animated SVG path + moving orb
  - Content: Top-aligned

---

## Tab Bar Specifications

### Layout
- Height: 80px (56px bar + 24px padding)
- Background: #1a1a1a with 28px border radius
- Position: Absolute bottom with 12px horizontal padding
- Shadow: 0px 4px, opacity 0.5, radius 16px, elevation 12

### Tab Icons
- Outer container: 48x48px, border radius 24px
- Inner gradient: 44x44px, border radius 22px
- Icon size: 24x24px
- Stroke width: 1.8px
- Colors: White (#ffffff) default, Dark (#1a1a1a) when focused

### Center Post Button
- Size: 64x64px, border radius 32px
- Background: #ffffff
- Margin top: -32px (elevated above bar)
- Icon: 26x26px, stroke width 2px, color #1a1a1a
- Shadow: 0px 6px, opacity 0.5, radius 16px, elevation 14

### Swipe Gesture
- Active offset: ±15px horizontal
- Fail offset: ±25px vertical
- Threshold: 30px
- Translation multiplier: 0.5
- Spring config: damping 15, stiffness 150

---

## Font Specifications

### Inter Family
```javascript
'Inter-Thin': Inter_100Thin,
'Inter-Light': Inter_300Light,
'Inter-Regular': Inter_400Regular,
'Inter-Medium': Inter_500Medium,
'Inter-SemiBold': Inter_600SemiBold,
```

### Archivo Family
```javascript
'Archivo-Bold': Archivo_700Bold,
```

### Typography Scale
- **Greeting (Hello):** 44px, Inter-Thin, -1.2 letter spacing
- **Greeting (Name):** 44px, Archivo-Bold, -1.2 letter spacing
- **Card Values:** 34px, Inter-SemiBold, -1 letter spacing
- **Card Labels:** 14px, Inter-Regular, -0.2 letter spacing
- **Page Titles:** 20px, Archivo-Bold, -0.5 letter spacing
- **Analytics Title:** 19.5px, Archivo-Bold, -0.3 letter spacing
- **Notification Title:** 24px, Archivo-Bold, -0.5 letter spacing
- **Notification Text:** 14px, Inter-Medium
- **Platform Name:** 9px, Inter-Bold, -0.2 letter spacing
- **Metrics:** 7.5px, Inter-SemiBold

---

## Animation Timings

- **Bar chart entry:** 1200ms per bar, 150ms stagger
- **Scrolling banner:** 20000ms continuous loop
- **Orb movement:** 3000ms loop with instant reset
- **Swipe gesture:** Spring animation (damping 15, stiffness 150)
- **Pull to refresh:** 1000ms delay

---

## Complete package.json Dependencies

```json
{
  "name": "bolt-expo-starter",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "EXPO_NO_TELEMETRY=1 expo start",
    "build:web": "expo export --platform web",
    "lint": "expo lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@expo-google-fonts/archivo": "^0.4.2",
    "@expo-google-fonts/inter": "^0.4.2",
    "@expo/vector-icons": "^15.0.2",
    "@lucide/lab": "^0.1.2",
    "@react-navigation/bottom-tabs": "^7.2.0",
    "@react-navigation/native": "^7.0.14",
    "@supabase/supabase-js": "^2.58.0",
    "expo": "54.0.13",
    "expo-blur": "~15.0.7",
    "expo-camera": "~17.0.8",
    "expo-constants": "~18.0.9",
    "expo-font": "~14.0.8",
    "expo-haptics": "~15.0.7",
    "expo-linear-gradient": "~15.0.7",
    "expo-linking": "~8.0.8",
    "expo-router": "6.0.12",
    "expo-splash-screen": "~31.0.10",
    "expo-status-bar": "~3.0.8",
    "expo-symbols": "~1.0.7",
    "expo-system-ui": "~6.0.7",
    "expo-web-browser": "15.0.8",
    "lucide-react-native": "^0.544.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.4",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-svg": "15.12.1",
    "react-native-url-polyfill": "^2.0.0",
    "react-native-web": "^0.21.0",
    "react-native-webview": "13.15.0",
    "react-native-worklets": "0.5.1"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~19.1.10",
    "typescript": "~5.9.2"
  }
}
```

---

## Critical Implementation Patterns

### Root Layout Pattern (_layout.tsx)
```typescript
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady(); // CRITICAL - DO NOT REMOVE

  const [fontsLoaded, fontError] = useFonts({
    // ... font mappings
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
```

### Tab Icon Component Pattern
```typescript
function IconComponent({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.tabIconOuter, focused && styles.tabIconOuterFocused]}>
      <LinearGradient
        colors={focused ? ['#ffffff', '#e5e5e5'] : ['#404040', '#2a2a2a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tabIconGradient}>
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="..."
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
```

### Animated Circle Component (for SVG animations)
```typescript
import Svg, { Circle } from 'react-native-svg';
import { Animated } from 'react-native';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Usage in component:
<AnimatedCircle
  cx={animation.interpolate({ inputRange: [...], outputRange: [...] })}
  cy={animation.interpolate({ inputRange: [...], outputRange: [...] })}
  r="6"
  fill="url(#orbGlow)"
/>
```

### Platform-Aware Haptics Pattern
```typescript
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const handlePress = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  // Continue with action
};
```

### Navigation Pattern
```typescript
import { router } from 'expo-router';

// For tab switching (prevents stack buildup):
router.replace('/(tabs)/home');

// For secondary screens (allows back navigation):
router.push('/(tabs)/account');
```

### Safe Area Pattern
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Content */}
    </View>
  );
}
```

---

## State Management Examples

### Notification State (Home Screen)
```typescript
const [showNotifications, setShowNotifications] = useState(false);
const [notifications, setNotifications] = useState([
  { id: 1, text: '...', read: false, icon: 'upload', time: '2m ago', gradient: ['#8b5cf6', '#7c3aed'] },
  // ... more notifications
]);

const handleNotificationPress = (id: number) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  setNotifications(prev =>
    prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
  );
};

const hasUnreadNotifications = notifications.some(n => !n.read);
```

### Pull to Refresh Pattern
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = () => {
  setRefreshing(true);
  // Reset data
  setNotifications([/* fresh data */]);
  setTimeout(() => {
    setRefreshing(false);
  }, 1000);
};

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#ffffff"
      colors={['#ffffff']}
    />
  }
>
  {/* Content */}
</ScrollView>
```

---

## How to Continue Development

1. **Start a new chat** and paste this entire document
2. Tell Claude what feature you want to work on next
3. Claude will have full context of the project structure, design system, and implementation details
4. Continue building with consistent patterns and conventions

---

## Quick Reference

**Run dev server:** `npm run dev`
**Test types:** `npm run typecheck`
**Build for web:** `npm run build:web`

**Main colors:** Purple (#8b5cf6), Yellow (#fbbf24), Blue (#60a5fa), Green (#a3e635), Orange (#fb923c)

**Key screens:** Home (main dashboard), Feed (notifications), Post (create), Stats, Settings

**Database:** Supabase ready but not yet used

**Total Image URLs:** 9 unique (3 header, 3 card backgrounds, 6 platform icons)
