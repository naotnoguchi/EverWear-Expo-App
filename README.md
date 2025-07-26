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

   Update the `.env` file with your Supabase credentials to connect to your backend.

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

## Development Commands

### Development Build

開発ビルドを使用してアプリを起動する場合：

```bash
npx expo start --dev-client --clear
```

- `--dev-client`: 開発ビルドを使用してアプリを起動します
- `--clear`: キャッシュをクリアしてから起動します（キャッシュ関連の問題を解決する際に有用）

### EAS Build for Development

開発用のネイティブバイナリをビルドする場合：

#### iOS Development Build
```bash
eas build --profile development --platform ios
```

#### Android Development Build
```bash
eas build --profile development --platform android
```

これらのコマンドは開発用のネイティブアプリをビルドし、デバイスやシミュレーターでテストできるようになります。

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Supabase Integration

This app is designed to work with [Supabase](https://supabase.com/) as the backend database.

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

## ブランドマスタの更新方法

本リポジトリではブランドマスタを **CSV で管理** します。ファイルは `data/brands.csv` に配置されており、カラムは以下の順序です。

```csv
name,name_hiragana,name_english,search_terms
```

`search_terms` は PostgreSQL の `text[]` 型に合わせて `"{term1,term2,...}"` 形式で記述してください。

### Supabase ダッシュボードでの投入手順
1. Supabase プロジェクトを開き **Table Editor → brands** を選択。
2. 右上の **Insert from CSV** をクリック。
3. `data/brands.csv` をアップロードし、マッピングを確認して実行します。
4. UUID の `id` 列は **自動生成** されるので CSV には含めません。

### psql / CLI での投入（オプション）
ローカルや CI から投入する場合は以下のコマンドを利用できます。

```bash
psql "$SUPABASE_DB_URL" -c "\copy public.brands (name, name_hiragana, name_english, search_terms) FROM 'data/brands.csv' DELIMITER ',' CSV HEADER;"
```

### 追加・修正方法
- 既存ブランドを変更する場合は **同じ name** をキーとして行を更新してください。
- 新規ブランドを追加したら CSV をコミットし、再度上記手順でインポートします（`name` が `UNIQUE` 制約により重複しない限り差分でINSERTされます）。
