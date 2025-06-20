# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up environment variables (optional for development)

   Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

   By default, the app uses mock data for development. When you're ready to connect to a real Supabase backend, update the `.env` file with your Supabase credentials and set `EXPO_PUBLIC_USE_MOCK_DATA` to `false`.

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Supabase Integration

This app is designed to work with [Supabase](https://supabase.com/) as the backend database. During development, it uses mock data by default, but you can connect it to a real Supabase backend when you're ready.

### Database Schema

The database schema is defined in the `db/schema.sql` file. It includes the following tables:

- `users`: Connects with Supabase Auth
- `clothing_items`: Stores information about clothing items
- `wear_history`: Records when items are worn
- `wash_history`: Records when items are washed
- `brands`: Stores brand information
- `badge_definitions`: Stores badge metadata (name, description, image, etc.)
- `badge_conditions`: Stores conditions for earning badges
- `user_badges`: Records which badges users have earned and when

### Setting up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com/)
2. Run the SQL commands in `db/schema.sql` in the Supabase SQL editor
3. Get your Supabase URL and anon key from the project settings
4. Update your `.env` file with these values
5. Set `EXPO_PUBLIC_USE_MOCK_DATA` to `false` in your `.env` file

### Development with Mock Data

During development, the app uses mock data by default. This allows you to develop without setting up a Supabase backend. The mock data is defined in `services/mockData.ts` and the mock services are in `services/mockClothingService.ts`.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
- [Supabase documentation](https://supabase.com/docs): Learn about Supabase and how to use it with your app.

## iOS TestFlight Distribution Guide

The following steps describe how to generate a production **.ipa** file and distribute it to TestFlight using EAS Build. These are the exact steps we used for the first TestFlight release (subscription feature enabled).

### 1. Prerequisites

* Apple Developer Program enrolment and App Store Connect app record are complete.
* RevenueCat project is set up and the App Store product IDs & Offering are configured.
* A 1024×1024 PNG app icon is present at `assets/images/icon.png`.

### 2. Register environment variables on Expo (EAS) dashboard

1. Navigate to **Project → Environment Variables** and click **Upload .env** (or **New variable**).
2. Add the following keys with **Secret** visibility and select the **production** environment:

   ```env
   EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS=your_ios_public_api_key
   EXPO_PUBLIC_REVENUE_CAT_API_KEY_ANDROID=your_android_public_api_key
   ```

> These keys are injected at build time – do **not** commit them to the repository.

### 3. Update `eas.json`

Our `production` profile is already configured like this:

```jsonc
{
  "production": {
    "autoIncrement": true,
    "ios": {
      "simulator": false
    },
    "environment": "production"
  }
}
```

`autoIncrement` bumps the build number automatically. `environment` ensures the env-vars from step 2 are injected.

### 4. Build the iOS binary

```bash
# optional: npm install -g eas-cli    # update to latest
eas build --profile production --platform ios   # add --non-interactive in CI
```

* The first build triggers automatic creation of the distribution certificate and provisioning profile.
* Build artefact (IPA) URL will be shown when the cloud job finishes.

### 5. Submit to TestFlight

```bash
eas submit --profile production --platform ios
```

If you prefer the App Store Connect web UI, you can download the IPA and upload it manually via **Transporter** or the browser.

### 6. App Store Connect actions

1. Select the new build in **TestFlight → Internal Testing**, then add yourself as a tester and install.
2. Confirm that:
   * RevenueCat subscription purchase/restore works in the sandbox.
   * Basic app flows operate on real devices (iOS 17/16, etc.).
3. When ready, promote the build for external testing or submit for review.

> For future releases repeat steps 4-6. Only the `autoIncrement` build number and version change (if needed) should be updated.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
