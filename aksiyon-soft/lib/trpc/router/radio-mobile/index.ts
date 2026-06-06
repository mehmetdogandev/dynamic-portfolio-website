import { router } from '../../index'
import { androidReleaseRouter } from './android-release'
import { androidDebugRouter } from './android-debug'
import { iosReleaseRouter } from './ios-release'
import { iosDebugRouter } from './ios-debug'
import { radioMobileApiKeyRouter } from './api-key'

export const radioMobileRouter = router({
  androidRelease: androidReleaseRouter,
  androidDebug: androidDebugRouter,
  iosRelease: iosReleaseRouter,
  iosDebug: iosDebugRouter,
  apiKey: radioMobileApiKeyRouter,
})
