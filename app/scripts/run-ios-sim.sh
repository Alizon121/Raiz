#!/usr/bin/env bash
# Manual iOS Simulator build/install/launch, working around one remaining
# issue: `xcodebuild -destination id=<uuid>` (what `npx expo run:ios` uses
# internally) cannot resolve ANY concrete simulator as a destination on this
# Xcode install, even though `xcrun simctl` and `xcrun xctrace` both see the
# same devices fine. Survives reboot, DerivedData/Xcode/CoreSimulator cache
# clears, `expo prebuild --clean`, and a Command Line Tools version fix.
# Root cause not identified; if `expo run:ios` starts working normally
# again, delete this script and go back to it.
#
# Workaround: build against the *generic* "platform=iOS Simulator"
# destination instead of a concrete device ID — that one has always
# resolved correctly — then install/launch onto a specific booted device
# via simctl directly. ARCHS is forced to arm64 (this Mac's native
# simulator architecture); without a concrete destination telling Xcode the
# target's real architecture, it silently defaults to x86_64.
#
# Usage: ./scripts/run-ios-sim.sh ["Device Name"]
# Defaults to "iPhone 17 Pro" if no device name is given.

set -euo pipefail
cd "$(dirname "$0")/.."

DEVICE_NAME="${1:-iPhone 17 Pro}"
BUNDLE_ID="com.raiz.app"

DEVICE_UDID=$(xcrun simctl list devices available -j \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data['devices'].items():
    for d in devices:
        if d['name'] == '$DEVICE_NAME':
            print(d['udid'])
            sys.exit(0)
")

if [ -z "$DEVICE_UDID" ]; then
  echo "No available simulator named \"$DEVICE_NAME\" found. Run 'xcrun simctl list devices available' to see options."
  exit 1
fi

echo "Building for iOS Simulator (native arm64)..."
xcodebuild \
  -workspace ios/Raiz.xcworkspace \
  -scheme Raiz \
  -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  ONLY_ACTIVE_ARCH=NO ARCHS=arm64 EXCLUDED_ARCHS=x86_64 \
  build

APP_PATH="$HOME/Library/Developer/Xcode/DerivedData/Raiz-"*"/Build/Products/Debug-iphonesimulator/Raiz.app"
APP_PATH=$(ls -d $APP_PATH | head -1)
if [ ! -d "$APP_PATH" ]; then
  echo "Build succeeded but Raiz.app wasn't found under DerivedData"
  exit 1
fi

echo "Booting $DEVICE_NAME ($DEVICE_UDID) if needed..."
xcrun simctl boot "$DEVICE_UDID" 2>/dev/null || true
open -a Simulator --args -CurrentDeviceUDID "$DEVICE_UDID"
sleep 2

echo "Installing..."
xcrun simctl install "$DEVICE_UDID" "$APP_PATH"

echo "Launching..."
xcrun simctl launch "$DEVICE_UDID" "$BUNDLE_ID"

echo "Done. Run 'npx expo start' separately to connect Metro if it isn't already running."
