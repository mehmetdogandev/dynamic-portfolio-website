/**
 * User Preferences Router
 *
 * Bildirim sesi ayarları ürün genelinde sabit (varsayılan); kullanıcı tarafından değiştirilemez.
 */

import { router, protectedProcedure } from '../index'
import { userPreferences } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const DEFAULT_NOTIFICATION_SOUND_ENABLED = true
const DEFAULT_NOTIFICATION_SOUND_VOLUME = 0.5

export const userPreferencesRouter = router({
  /**
   * Bildirim sesi tercihleri her zaman varsayılan değerleri döndürür (sabit).
   * İlk erişimde satır yoksa oluşturulur (gelecekteki tercih alanları için).
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const existing = await ctx.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, ctx.session.user.id))
      .limit(1)

    if (existing.length === 0) {
      await ctx.db.insert(userPreferences).values({
        userId: ctx.session.user.id,
        notificationSoundEnabled: DEFAULT_NOTIFICATION_SOUND_ENABLED,
        notificationSoundVolume: DEFAULT_NOTIFICATION_SOUND_VOLUME.toFixed(2),
      })
    }

    return {
      notificationSoundEnabled: DEFAULT_NOTIFICATION_SOUND_ENABLED,
      notificationSoundVolume: DEFAULT_NOTIFICATION_SOUND_VOLUME,
    }
  }),
})
