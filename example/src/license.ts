/**
 * Demo FP1 licenses — same keys as FaceFullSDK Android / iOS Apps.
 * Bound to applicationId / bundle id below. Request a new key if you change the id.
 */
import { Platform } from 'react-native';


/** Android + iOS demo applicationId / bundle id */
export const ANDROID_APPLICATION_ID = 'com.identixia.facefullsdk';
export const IOS_BUNDLE_ID = 'com.identixia.facefullsdk.app';


const ANDROID_LICENSE =
  'pyyR2AEC1ukKXHPvFEJc7n3XQTxu7i15UMa0Gg65MyMORIwAAAAxVI/cg+5mpfT3l2VNs2wtpMKEmIu++Rly0Bym00AyS2NZCQnPaRLaCpgOy1ziXXohzz3JsNBJIXSl4kpdOiOo9v/Uxby6dr5WIeH9rVNBLnwoUPpT0Xms40X1PvqGC5SUdrGE74IbBdL/z+ZXfE4SZBLjcwD0IxRhYn0inmQTyg3PhN+D5vXgeIZ78GcAMGUCMBP9GZMSPInn9VidjWcnHcadmzJFoBaDExwLZzgRTbFShIN0Tz+IaI9tDhcLRzVDVgIxAKHjXdR2cVMPvq/loBKsXP/IrzS2PhaT7S4R7hCIDhcencff0Cj/fWUsgp7pbg2Tjg==';


const IOS_LICENSE =
  'pyyR2AECd7NktgWWlVP8ImkaP1P/nulC/uMDceQ+6jUJAowAAAA3jnfoP+DbLmSXqYhXimHAnxBJoGQH7YciqLT9QqNmCTVib3QkdtZlcx0+//dfsLaVqXFjLt6T/ieWNrGwuP+MvoR8LTRCmwwlz5o2fbWsuEhtOB7HDkPxRjKtAWlzQOqFJKcMkdHZYVeSaGZ2jwtEm03nDh80xOCdJgVLXPgETs1OPIko3osiVzyQY2gAMGYCMQDxeY02O6AV8w2lGgmxHK9jKZbaTXqpLlyFKSOmyxwu4UTn70me2AdflZkH/YLeCM0CMQCWHX5WeEw/BnMxBisdVnr6vwMcsbh02jCHZOfpFSXoF8Vosy0P9aqA/FQWyaRrKdw=';


export function demoLicense(): string {
  return Platform.OS === 'ios' ? IOS_LICENSE : ANDROID_LICENSE;
}
