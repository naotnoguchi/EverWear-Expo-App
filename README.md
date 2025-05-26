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

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
