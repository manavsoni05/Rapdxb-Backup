# RAPDXB - Employee Management System

A modern Employee Management System built with React Native, Expo, and Supabase.

## 🚀 Features

- **User Authentication** - Sign up and sign in functionality
- **Social Feed** - Community engagement and posts
- **Employee Profiles** - Profile management with platform connections
- **Statistics Dashboard** - Analytics and insights
- **Multi-platform Support** - iOS, Android, and Web

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (optional, but recommended)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/manav-ig/Rapdxb-Backup.git
   cd Rapdxb-Backup
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (if needed)
   - Create a `.env` file in the root directory
   - Add your Supabase credentials and other environment variables

## 🏃 Running the Project

### Start Development Server
```bash
npm start
```
or
```bash
npm run dev
```

This will start the Expo development server. You can then:
- Press `a` to open in Android emulator
- Press `i` to open in iOS simulator
- Press `w` to open in web browser
- Scan the QR code with Expo Go app on your mobile device

### Other Available Scripts

- **Type Checking**
  ```bash
  npm run typecheck
  ```

- **Linting**
  ```bash
  npm run lint
  ```

- **Build for Web**
  ```bash
  npm run build:web
  ```

## 📱 Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Backend**: Supabase
- **Language**: TypeScript
- **UI Components**: Lucide React Native Icons
- **State Management**: React Hooks

## 📁 Project Structure

```
RAPDXB-V1/
├── app/                    # App screens and navigation
│   ├── (tabs)/            # Tab-based screens
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Landing page
│   ├── sign-in.tsx        # Sign in screen
│   └── sign-up.tsx        # Sign up screen
├── assets/                # Images and static assets
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   └── supabase.ts       # Supabase client setup
├── supabase/             # Database migrations
│   └── migrations/       # SQL migration files
└── package.json          # Project dependencies
```

## 🔧 Configuration

### Supabase Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in the `supabase/migrations` folder
3. Update your Supabase credentials in `lib/supabase.ts` or environment variables

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and confidential.

## 👤 Author

**Manav Soni**
- GitHub: [@manav-ig](https://github.com/manav-ig)

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**Note**: Make sure to keep your environment variables and sensitive credentials secure and never commit them to the repository.
