import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { publicProcedure, router } from '../index'
import {
  sendWebsiteContactFlow,
  sendWebsiteVisitNotification,
} from '@/lib/mail/website-mail'
import {
  checkWebsiteContactRateLimit,
  shouldSendVisitNotification,
} from '@/lib/website/rate-limit'

const CONTACT_MAX_PER_DAY = 5

function getRequestIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const real = headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

const submitContactInput = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(320).trim(),
  phone: z.string().max(50).optional(),
  message: z.string().min(1).max(8000).trim(),
  /** Honeypot: must be empty. */
  company: z.string().max(200).optional(),
})

export const websiteRouter = router({
  submitContact: publicProcedure
    .input(submitContactInput)
    .mutation(async ({ input, ctx }) => {
      if (input.company && input.company.trim().length > 0) {
        return { ok: true as const, ignored: true as const }
      }

      const ip = getRequestIp(ctx.headers)
      if (!checkWebsiteContactRateLimit(ip, CONTACT_MAX_PER_DAY)) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message:
            'Çok fazla deneme. Lütfen daha sonra tekrar deneyin veya bizi arayın.',
        })
      }

      try {
        await sendWebsiteContactFlow({
          name: input.name,
          email: input.email,
          phone: input.phone,
          message: input.message,
        })
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Gönderim başarısız. Lütfen daha sonra tekrar deneyin.',
          cause: e,
        })
      }

      return { ok: true as const, ignored: false as const }
    }),

  recordVisit: publicProcedure.mutation(async ({ ctx }) => {
    const ip = getRequestIp(ctx.headers)
    const userAgent = ctx.headers.get('user-agent') ?? ''

    if (!shouldSendVisitNotification(ip)) {
      return { ok: true as const, notified: false as const }
    }

    try {
      await sendWebsiteVisitNotification({ ip, userAgent })
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ziyaret kaydedilemedi.',
        cause: e,
      })
    }

    return { ok: true as const, notified: true as const }
  }),
})
