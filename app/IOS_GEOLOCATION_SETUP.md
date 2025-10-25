# iOS Geolocation Setup

## Required Permissions in Info.plist

After running `npx cap sync`, add the following keys to `ios/App/App/Info.plist`:

```xml
<!-- Geolocation permissions -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Alter utilise votre position pour trouver des personnes compatibles près de vous.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Alter utilise votre position pour améliorer votre expérience et vous proposer des profils à proximité.</string>
```

## Manual Steps

1. Open the iOS project in Xcode:
   ```bash
   npx cap open ios
   ```

2. Navigate to the `Info.plist` file in Xcode

3. Add the location permission keys listed above

4. Build and run the app

## Alternative: Edit Info.plist directly

You can also edit the file at `ios/App/App/Info.plist` directly with a text editor after running `npx cap sync`.

## Testing

To test geolocation in the iOS simulator:
1. Debug > Location > Custom Location
2. Enter a latitude and longitude (e.g., Paris: 48.8566, 2.3522)
3. Test the onboarding city selection
