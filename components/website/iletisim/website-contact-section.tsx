'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTRPC } from '@/lib/trpc/client'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WebsitePostcardCard } from '@/components/website/shared/website-postcard-card'
import { cn } from '@/lib/utils'
import { WEBSITE_IMAGES } from '@/lib/website/content/images'
import { Loader2, Mail, MapPin, Phone } from 'lucide-react'

function publicTrim(v: string | undefined) {
  return v?.trim() || undefined
}

export function WebsiteContactSection() {
  const trpc = useTRPC()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('')
  const [feedback, setFeedback] = useState<
    { kind: 'success' } | { kind: 'error'; msg: string } | null
  >(null)

  const publicEmail =
    publicTrim(process.env.NEXT_PUBLIC_WEBSITE_CONTACT_EMAIL) ??
    'mehmetdogan.dev@gmail.com'
  const publicPhone = publicTrim(process.env.NEXT_PUBLIC_WEBSITE_CONTACT_PHONE)
  const publicAddress =
    publicTrim(process.env.NEXT_PUBLIC_WEBSITE_ADDRESS) ?? 'Türkiye'
  const phoneHref = publicPhone ? publicPhone.replace(/[^\d+]/g, '') : ''

  const submit = useMutation(trpc.website.submitContact.mutationOptions())

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    try {
      await submit.mutateAsync({
        name,
        email,
        phone: phone || undefined,
        message,
        company: company || undefined,
      })
      setFeedback({ kind: 'success' })
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
      setCompany('')
    } catch (err) {
      const msg =
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message?: string }).message === 'string'
          ? (err as { message: string }).message
          : 'Gönderim yapılamadı.'
      setFeedback({ kind: 'error', msg })
    }
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border border-border/50',
        'shadow-sm sm:rounded-3xl'
      )}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={WEBSITE_IMAGES.contactSide}
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="(min-width: 1280px) 1152px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/88 to-background/25" />
      </div>

      <div className="relative z-[1] w-full p-5 sm:p-7 lg:grid lg:grid-cols-12 lg:gap-10 lg:p-10">
        <aside className="mb-8 space-y-6 border-border/50 pb-2 lg:col-span-5 lg:mb-0 lg:border-b-0 lg:border-r lg:pr-8">
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            Kapsam, teklif ve destek talepleriniz için formu doldurun.
            İsterseniz aşağıdaki kanallardan da bize ulaşabilirsiniz. Mesajlar
            kayıt altındadır; ortalama yanıt süremiz iş günlerinde 1–2 gün.
          </p>
          <ul className="space-y-0 divide-y divide-border/50">
            <li>
              <a
                href={`mailto:${publicEmail}`}
                className="text-foreground/90 hover:text-primary group -mx-1 flex items-start gap-3 rounded-lg px-1 py-2.5 text-sm transition-colors"
              >
                <span className="bg-card text-primary group-hover:bg-primary/10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60">
                  <Mail className="size-4" />
                </span>
                <span>
                  <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    E-posta
                  </span>
                  <span className="mt-0.5 block font-medium">
                    {publicEmail}
                  </span>
                </span>
              </a>
            </li>
            {publicPhone ? (
              <li>
                <a
                  href={phoneHref ? `tel:${phoneHref}` : '#'}
                  className="text-foreground/90 hover:text-primary group -mx-1 flex items-start gap-3 rounded-lg px-1 py-2.5 text-sm transition-colors"
                >
                  <span className="bg-card text-primary group-hover:bg-primary/10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60">
                    <Phone className="size-4" />
                  </span>
                  <span>
                    <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Telefon
                    </span>
                    <span className="mt-0.5 block font-medium">
                      {publicPhone}
                    </span>
                  </span>
                </a>
              </li>
            ) : null}
            <li>
              <div className="text-foreground/90 -mx-1 flex items-start gap-3 rounded-lg px-1 py-2.5 text-sm">
                <span className="bg-card text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60">
                  <MapPin className="size-4" />
                </span>
                <span>
                  <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Bölge
                  </span>
                  <span className="mt-0.5 block font-medium">
                    {publicAddress}
                  </span>
                </span>
              </div>
            </li>
          </ul>
        </aside>

        <div className="lg:col-span-7">
          <form
            onSubmit={onSubmit}
            className={cn(
              'bg-card/85 rounded-xl border border-border/60 p-5 shadow-sm backdrop-blur sm:p-6',
              'ring-primary/5 ring-1'
            )}
          >
            <p
              className="text-foreground/90 text-xs font-semibold tracking-wider uppercase"
              id="contact-form-label"
            >
              Mesaj formu
            </p>
            <p
              className="text-muted-foreground mt-1.5 text-sm"
              id="contact-form-hint"
            >
              Zorunlu alanlar işaretlenir; yanıt için e-postanızı doğrulayın.
            </p>

            <div className="sr-only" aria-hidden>
              <Label htmlFor="website-company">Şirket</Label>
              <Input
                id="website-company"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div
              className="mt-6 space-y-4"
              role="group"
              aria-labelledby="contact-form-label"
              aria-describedby="contact-form-hint"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="website-name">Ad Soyad</Label>
                  <Input
                    id="website-name"
                    name="name"
                    required
                    maxLength={200}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website-email">E-posta</Label>
                  <Input
                    id="website-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website-phone">Telefon (isteğe bağlı)</Label>
                <Input
                  id="website-phone"
                  name="phone"
                  type="tel"
                  maxLength={50}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  className="h-11"
                  placeholder="+90 5xx xxx xx xx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website-message">Mesajınız</Label>
                <Textarea
                  id="website-message"
                  name="message"
                  required
                  rows={5}
                  maxLength={8000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[9rem] resize-y"
                  placeholder="Kapsam, zaman veya beklentilerinizi kısaca yazın…"
                />
              </div>
            </div>

            <div className="border-border/50 mt-6 border-t pt-5">
              <Button
                type="submit"
                size="lg"
                disabled={submit.isPending}
                className="w-full font-semibold"
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gönderiliyor
                  </>
                ) : (
                  'Gönder'
                )}
              </Button>
            </div>
          </form>

          {feedback?.kind === 'success' && (
            <div className="mt-5">
              <WebsitePostcardCard title="Teşekkürler" variant="success">
                Mesajınız bize ulaştı. Bilgilerinizi aldığınıza dair bir e-posta
                gönderdik; en kısa sürede sizinle iletişime geçeceğiz.
              </WebsitePostcardCard>
            </div>
          )}
          {feedback?.kind === 'error' && (
            <div className="mt-5">
              <WebsitePostcardCard title="Gönderilemedi" variant="error">
                {feedback.msg}
              </WebsitePostcardCard>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
