#!/bin/bash
# Re-sign nested Mach-Os inside embedded Face Recognition frameworks.
# Xcode Code Sign On Copy seals onnxruntime.framework/onnxruntime, but the
# engine/ProcessingBlock dlopens libonnxruntime.dylib — an ad-hoc or vendor
# seal there is rejected on device ("code signature invalid").
set -euo pipefail

if [ "${PLATFORM_NAME:-}" = "iphonesimulator" ]; then
  exit 0
fi

IDENTITY="${EXPANDED_CODE_SIGN_IDENTITY:-}"
if [ -z "${IDENTITY}" ] || [ "${IDENTITY}" = "-" ]; then
  echo "warning: EXPANDED_CODE_SIGN_IDENTITY unset; skipping nested framework codesign" >&2
  exit 0
fi

DEST="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}"
if [ ! -d "${DEST}" ]; then
  echo "error: missing Frameworks folder: ${DEST}" >&2
  exit 1
fi

sign_file() {
  local path="$1"
  if [ -f "${path}" ] && [ ! -L "${path}" ]; then
    echo "Signing nested $(basename "${path}")"
    /usr/bin/codesign --force --sign "${IDENTITY}" --timestamp=none "${path}"
  fi
}

sign_fw() {
  local fw="$1"
  [ -d "${fw}" ] || return 0
  sign_file "${fw}/libonnxruntime.dylib"
  sign_file "${fw}/onnxruntime"
  sign_file "${fw}/FaceRecognitionEngine"
  sign_file "${fw}/FaceLivenessEngine"
  sign_file "${fw}/libfacerec.dylib"
  sign_file "${fw}/facerec"
  sign_file "${fw}/facefullsdk"
  sign_file "${fw}/facelivenesssdk"
  echo "Signing $(basename "${fw}")"
  /usr/bin/codesign --force --sign "${IDENTITY}" --timestamp=none "${fw}"
}

signed=0
for name in facefullsdk facelivenesssdk FaceRecognitionEngine FaceLivenessEngine onnxruntime; do
  fw="${DEST}/${name}.framework"
  if [ -d "${fw}" ]; then
    sign_fw "${fw}"
    signed=1
  fi
done

if [ "${signed}" -eq 0 ]; then
  echo "error: no Face SDK frameworks found in ${DEST}" >&2
  exit 1
fi

