<div align="center">
<img alt="Identixia" src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/brand/logo.png" width="320"/>

<a href="https://identixia.com"><img src="https://img.shields.io/badge/Website-0F766E?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Website" /></a>
<a href="https://docs.identixia.com"><img src="https://img.shields.io/badge/Docs-0F766E?style=for-the-badge&logo=gitbook&logoColor=white" alt="Docs" /></a>
<a href="https://huggingface.co/Identixia"><img src="https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" alt="Hugging Face" /></a>
<a href="https://hub.docker.com/u/identixia"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Hub" /></a>
<a href="https://playground.identixia.com/"><img src="https://img.shields.io/badge/Playground-0F766E?style=for-the-badge&logo=cloudplayground&logoColor=white" alt="Playground" /></a>
</div>

<div align="center">

# <img src="https://cdn.simpleicons.org/react/61DAFB" width="32" height="32" alt="" /> Face Recognition and Liveness Detection SDK for React Native — Plugin and Sample App | Identixia

</div>

Integrate **face recognition and liveness detection** with the **Identixia React Native SDK**. This repository provides a React Native plugin for Android and iOS for face detection, face template extraction, and face matching. Face templates are numerical representations used to compare faces. Enroll faces in a local gallery and search for a match with one-to-many (1:N) identification. Passive liveness, also called presentation attack detection (PAD), and deepfake detection are available when licensed. The combined authenticity result is REAL only when both checks pass.

Use the sample as a starting point for biometric identity verification, face-based access control, and customer onboarding. Processing runs on the device; images are not sent to the Identixia cloud.

Package: `face-recognition-sdk`. Demo modes: **Enroll · Identify · Capture · Attribute**.

<p><img src="https://img.shields.io/badge/On-device-0F766E?style=flat-square" alt="On-device" /> <img src="https://img.shields.io/badge/1%3AN%20identification-0F766E?style=flat-square" alt="1%3AN%20identification" /> <img src="https://img.shields.io/badge/Passive%20liveness-0F766E?style=flat-square" alt="Passive%20liveness" /> <img src="https://img.shields.io/badge/Android%20%2B%20iOS-0F766E?style=flat-square" alt="Android%20%2B%20iOS" /> <img src="https://img.shields.io/badge/Plugin-5A6573?style=flat-square" alt="Plugin" /></p>

> For setup, integration, and API guides, see the [Face Recognition and Liveness Detection SDK documentation for React Native](https://docs.identixia.com/developers/face-sdk/react-native). This page covers the sample repository.

## <img src="https://api.iconify.design/lucide/clipboard-list.svg?color=%230F766E" width="24" height="24" alt="" /> SDK overview

The sample includes a demo license. Your own application requires a key issued for its application identifier.

| Topic | Basic information |
| --- | --- |
| **Product** | On-device **face recognition** React Native plugin |
| **Modes** | Enroll · Identify (1:N) · Capture · Attribute |
| **API** | Detect · templates · identify · optional passive liveness |
| **Runtime** | Download the `runtime` Release from [Releases](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-React-Native/releases/tag/runtime) |
| **Demo id** | `com.identixia.facefullsdk` |
| **Tools** | Yarn · physical arm64 Android / iPhone (not Expo Go) |
| **UI** | Four demo modes become available after SDK initialization completes |
| **Privacy** | Templates stay on device — no Identixia cloud |

---

## <img src="https://api.iconify.design/lucide/terminal.svg?color=%230F766E" width="24" height="24" alt="" /> Quick start

Choose the instructions for your device below. Run the Android and iOS steps separately; iOS builds require a Mac.

### <img src="https://img.shields.io/badge/-1-0F766E?style=for-the-badge" alt="" /> Clone

```bash
git clone https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-React-Native.git
cd FaceRecognition-LivenessDetection-React-Native
```

Download [`libfacefullsdk.rar`](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-Android/releases/tag/runtime) from the [FaceRecognition-LivenessDetection-Android Releases](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-Android/releases/tag/runtime). Extract it into `example/android/libfacefullsdk/`. The files should sit in that folder, not inside an extra directory.

Download [`facefull.zip`](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-iOS/releases/tag/runtime) from the [FaceRecognition-LivenessDetection-iOS Releases](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-iOS/releases/tag/runtime). Unzip it into `ios/Frameworks/`. The files should sit in that folder, not inside an extra directory.

### Android

Use **Yarn**. Expo Go cannot load this native engine. Use a physical **arm64** Android phone with USB debugging on.

From the repository root:

```bash
yarn
cd example
yarn android
```

### iOS

Use a Mac with Xcode, CocoaPods, and a physical **iPhone**. Expo Go cannot load this native engine. Do not use the Simulator for the camera sample.

From the repository root:

```bash
yarn
cd example/ios && pod install && cd ..
yarn ios --device
```

### <img src="https://img.shields.io/badge/-2-0F766E?style=for-the-badge" alt="" /> Activate / license

1. Copy the id of your own app. On Android this is the application id. On iOS this is the bundle id. The sample id is `com.identixia.facefullsdk`, `com.identixia.facefullsdk.app`.
2. Email that id and the product name to [contact@identixia.com](mailto:contact@identixia.com).
3. Replace the demo key in `example/src/license.ts` with the key you receive.
4. Rebuild, then continue with the next step.

### <img src="https://img.shields.io/badge/-3-0F766E?style=for-the-badge" alt="" /> First capture

Wait for the Home screen to show **Ready**, then open **Enroll**, **Identify**, **Capture**, or **Attribute**.

---

## <img src="https://api.iconify.design/lucide/list-checks.svg?color=%230F766E" width="24" height="24" alt="" /> Features

| Capability | What it does |
| --- | --- |
| <img src="https://api.iconify.design/lucide/user-plus.svg?color=%230F766E" width="16" height="16" alt="" /> Enroll | Save numerical representations of captured faces in a gallery on the device |
| <img src="https://api.iconify.design/lucide/users.svg?color=%230F766E" width="16" height="16" alt="" /> Identify (1:N) | Compare a captured face with all saved faces to find the closest match (one-to-many identification) |
| <img src="https://api.iconify.design/lucide/aperture.svg?color=%230F766E" width="16" height="16" alt="" /> Capture | Guided still capture with quality feedback |
| <img src="https://api.iconify.design/lucide/sliders.svg?color=%230F766E" width="16" height="16" alt="" /> Attribute | Estimate age, gender, and facial expression when these features are enabled |
| <img src="https://api.iconify.design/lucide/shield.svg?color=%230F766E" width="16" height="16" alt="" /> Passive liveness | Optional face PAD + deepfake when licensed; authenticity REAL only if both pass |
| <img src="https://api.iconify.design/lucide/fingerprint.svg?color=%230F766E" width="16" height="16" alt="" /> Templates | Create face templates and compare them to measure similarity |

## <img src="https://api.iconify.design/lucide/pc-case.svg?color=%230F766E" width="24" height="24" alt="" /> System requirements

| | |
| --- | --- |
| Devices | Physical **arm64** Android and/or **iPhone** |
| Package | `face-recognition-sdk` |
| Runtimes | Local example engines, or the `v1.0.0` GitHub Release when they are missing |

---

## <img src="https://api.iconify.design/lucide/package.svg?color=%230F766E" width="24" height="24" alt="" /> SDK installation

Download the runtime zip from GitHub Releases when the native library is not already in the sample folders.

- `example/android/libfacefullsdk/facefullsdk.aar`
- `ios/Frameworks/`

For your own app, add `face-recognition-sdk` as a dependency from this repository and pin it to the `v1.0.0` tag. Use your package manager’s GitHub dependency syntax. Avoid dependencies on local folders when distributing the app.

Android: keep `packaging { jniLibs { useLegacyPackaging = true } }` so `libFaceRecognitionEngine.so` is extracted for `nativeInitEngine`.

---

## <img src="https://api.iconify.design/lucide/rocket.svg?color=%230F766E" width="24" height="24" alt="" /> Run

Start in the repository root and follow the commands for your target platform. These commands are also listed in [Quick start](#-quick-start).

**Android** — Yarn, physical arm64 phone. Not Expo Go:

```bash
yarn
cd example
yarn android
```

**iOS** — Mac, Xcode, CocoaPods, physical iPhone. Not Expo Go and not the Simulator:

```bash
yarn
cd example/ios && pod install && cd ..
yarn ios --device
```

---

## <img src="https://api.iconify.design/lucide/key-round.svg?color=%230F766E" width="24" height="24" alt="" /> SDK license and activation

1. Run the sample with the bundled key and the sample id below.
2. For your own app, email [contact@identixia.com](mailto:contact@identixia.com) with the platform, your application id or bundle id, and the features you need.
3. Put the key you receive in the same place as the demo key.
4. Rebuild. Activation runs before SDK init. If it fails, the key does not match that id.

Sample id:

- `com.identixia.facefullsdk`
- `com.identixia.facefullsdk.app`

Set the key, then activate:

https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-React-Native/blob/f0cdcae9074c942978b15bff3c5aef2e1f1e38e4/example/src/license.ts#L13-L21

https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-React-Native/blob/f0cdcae9074c942978b15bff3c5aef2e1f1e38e4/example/src/SdkContext.tsx#L88-L88

## <img src="https://api.iconify.design/lucide/images.svg?color=%230F766E" width="24" height="24" alt="" /> Screenshots

<p align="center">
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/home.png" width="160" alt="Face recognition home — detect, attribute, quality, landmarks, match, liveness, enroll, identity" />
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/capture.png" width="160" alt="Identity camera — move closer" />
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/enroll.png" width="160" alt="Enroll result" />
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/identify.png" width="160" alt="1:N identify result" />
</p>
<p align="center">
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/detect.png" width="160" alt="Face detect result" />
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/attribute.png" width="160" alt="Face attribute result" />
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/attribute-quality.png" width="160" alt="Image quality result" />
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/landmarks.png" width="160" alt="68-point landmarks" />
</p>
<p align="center">
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/match.png" width="160" alt="1:1 match result" />
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/attribute-liveness.png" width="160" alt="Liveness result" />
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/settings.png" width="160" alt="Settings — camera, landmarks, thresholds" />
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/face-recognition/android/about.png" width="160" alt="About, license, and application id" />
</p>

## <img src="https://api.iconify.design/lucide/braces.svg?color=%230F766E" width="24" height="24" alt="" /> API

The following SDK methods are used by the sample and can also be called from your application.

| API | Purpose |
| --- | --- |
| `activate(license)` then `init()` | Activate the license, then initialize the engine. Run these calls in order on one background thread. |
| `getLicenseStatus()` | Check the license status and enabled features before opening the camera. |
| `detect` / `faceAttribute` / `landmarks` | Detect faces in an image and return facial attributes and landmark coordinates. |
| `templateExtraction` / `similarity` | Create a numerical representation of a face and compare two faces to obtain a similarity score. |
| `enroll` / `bestMatch` | Save faces in a local gallery and search it for the closest match. |
| `liveness` / `deepfake` | Run presentation attack detection and deepfake checks. Report REAL only when both pass. |

Keep camera preview updates on the UI thread. Run SDK operations sequentially on a single background thread; the engine does not support simultaneous calls.

---

## <img src="https://api.iconify.design/lucide/layers.svg?color=%230F766E" width="24" height="24" alt="" /> SDKs for other platforms

| | Platform | Repo |
| --- | --- | --- |
| <img src="https://cdn.simpleicons.org/android/3DDC84" width="18" height="18" alt="" /> | Android | [FaceRecognition-LivenessDetection-Android](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-Android) |
| <img src="https://cdn.simpleicons.org/apple/000000" width="18" height="18" alt="" /> | iOS | [FaceRecognition-LivenessDetection-iOS](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-iOS) |
| <img src="https://cdn.simpleicons.org/flutter/02569B" width="18" height="18" alt="" /> | Flutter | [FaceRecognition-LivenessDetection-Flutter](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-Flutter) |
| <img src="https://cdn.simpleicons.org/react/61DAFB" width="18" height="18" alt="" /> | React Native | [FaceRecognition-LivenessDetection-React-Native](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-React-Native) |
| <img src="https://cdn.simpleicons.org/ionic/3880FF" width="18" height="18" alt="" /> | Ionic Capacitor | [FaceRecognition-LivenessDetection-Ionic-Capacitor](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-Ionic-Capacitor) |
| <img src="https://cdn.simpleicons.org/apachecordova/E8E8E8" width="18" height="18" alt="" /> | Ionic Cordova | [FaceRecognition-LivenessDetection-Ionic-Cordova](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-Ionic-Cordova) |
| <img src="https://cdn.simpleicons.org/windows/0078D4" width="18" height="18" alt="" /> | Windows | [FaceRecognition-LivenessDetection-Windows](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-Windows) |
| <img src="https://cdn.simpleicons.org/docker/2496ED" width="18" height="18" alt="" /> | Linux / Docker | [FaceRecognition-LivenessDetection-Docker](https://github.com/identixia-IDV/FaceRecognition-LivenessDetection-Docker) |

---

## <img src="https://api.iconify.design/lucide/mail.svg?color=%230F766E" width="24" height="24" alt="" /> Contact

<div align="center">

<a href="mailto:contact@identixia.com"><img alt="Email contact@identixia.com" src="https://img.shields.io/badge/Email-contact%40identixia.com-0F766E?style=for-the-badge&logo=gmail&logoColor=white" /></a>
<a href="https://wa.me/17018854218"><img alt="WhatsApp +1 (701) 885-4218" src="https://img.shields.io/badge/WhatsApp-%2B1_(701)_885--4218-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" /></a>
<a href="https://t.me/identixia"><img alt="Telegram @identixia" src="https://img.shields.io/badge/Telegram-%40identixia-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" /></a>

</div>

---
