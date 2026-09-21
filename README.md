# Resume Studio

A private, offline first resume builder made with React Native. Create resumes from modern templates, preview them, export PDFs, and keep your data on your device.

## Features

- Offline resume editing
- ATS and modern CV templates
- PDF preview and export
- Light and dark themes
- Local backup
- Android banner ads

## Requirements

- Node.js 22.11 or newer
- Yarn
- Android Studio and an Android emulator or device
- macOS and Xcode for iOS

Follow the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) once before running the app.

## Install

Clone the repository, open its folder, and install packages:

```sh
yarn install
```

For iOS, also install CocoaPods:

```sh
bundle install
cd ios && bundle exec pod install && cd ..
```

## Run locally

Start Metro in the first terminal:

```sh
yarn start
```

Open another terminal and run Android:

```sh
yarn android
```

Or run iOS on macOS:

```sh
yarn ios
```

Development builds use Google's test banner ad. A physical device needs an internet connection for the ad to appear.

## Useful commands

```sh
yarn start:reset   # Restart Metro and clear its cache
yarn test          # Run tests
yarn lint          # Check the code
```

All resume data is stored locally. No account is required.
