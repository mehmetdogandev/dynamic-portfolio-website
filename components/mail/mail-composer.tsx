'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTRPC } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Loader2, Send, Save } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { UserPicker, type UserOption } from './user-picker'
import {
  AttachmentManager,
  type AttachmentMetadata,
} from './attachment-manager'
import {
  EmailRichTextEditor,
  type EmailRichTextEditorRef,
  type InlineImageMetadata,
} from './email-rich-text-editor'
import { EmailToolbar } from './email-toolbar'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const formSchema = z.object({
  to: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        lastName: z.string(),
        email: z.string(),
      })
    )
    .min(1, 'En az bir alıcı gereklidir'),
  cc: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        lastName: z.string(),
        email: z.string(),
      })
    )
    .optional(),
  bcc: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        lastName: z.string(),
        email: z.string(),
      })
    )
    .optional(),
  subject: z.string().min(1, 'Konu gereklidir'),
  body: z.string().min(1, 'İçerik gereklidir'),
  htmlBody: z.string().optional(),
})

interface MailComposerProps {
  initialData?: {
    id?: string
    to?: UserOption[]
    cc?: UserOption[]
    bcc?: UserOption[]
    subject?: string
    body?: string
    htmlBody?: string
    attachments?: AttachmentMetadata[]
  }
  replyTo?: {
    id: string
    from: UserOption
    subject: string
    body: string
    htmlBody?: string
    attachments?: AttachmentMetadata[]
  }
  forwardFrom?: {
    id: string
    from: UserOption
    subject: string
    body: string
    htmlBody?: string
    attachments?: AttachmentMetadata[]
  }
  onSent?: () => void
  onCancel?: () => void
  onDraftSaved?: (draftId: string) => void
}

export function MailComposer({
  initialData,
  replyTo,
  forwardFrom,
  onSent,
  onCancel,
  onDraftSaved,
}: MailComposerProps) {
  const trpc = useTRPC()
  const editorRef = useRef<EmailRichTextEditorRef | null>(null)
  const regularAttachments = (initialData?.attachments || []).filter(
    (a): a is AttachmentMetadata =>
      !(a as AttachmentMetadata & { isInline?: boolean }).isInline
  )
  const [attachments, setAttachments] =
    useState<AttachmentMetadata[]>(regularAttachments)
  const [inlineImages, setInlineImages] = useState<InlineImageMetadata[]>([])

  // Load inline images from initial data (draft)
  useEffect(() => {
    if (initialData?.htmlBody) {
      // Extract inline images from HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = initialData.htmlBody
      const images = tempDiv.querySelectorAll('img[data-cid]')
      const loadedImages: InlineImageMetadata[] = []

      images.forEach((img) => {
        const cid = img.getAttribute('data-cid')
        const previewUrl =
          img.getAttribute('data-preview-url') || img.getAttribute('src') || ''

        if (cid && previewUrl) {
          // Try to find in attachments (saved as inline images)
          type AttachmentWithInline = AttachmentMetadata & {
            cid?: string
            isInline?: boolean
            fileId?: string
            url?: string
            bucket?: string
          }

          const attachment = initialData.attachments?.find(
            (att): att is AttachmentWithInline => {
              const attWithInline = att as AttachmentWithInline
              return (
                attWithInline.cid === cid || attWithInline.isInline === true
              )
            }
          )

          if (attachment && attachment.isInline) {
            loadedImages.push({
              cid: cid,
              fileName: attachment.fileName,
              originalName: attachment.originalName,
              path: attachment.path,
              size: attachment.size,
              mimeType: attachment.mimeType,
              fileId: attachment.fileId,
              url: attachment.url || previewUrl,
              bucket: attachment.bucket,
            })
          } else if (previewUrl.startsWith('/api/files/')) {
            // Extract fileId from preview URL
            const fileIdMatch = previewUrl.match(/\/api\/files\/([^/]+)\/view/)
            const fileId = fileIdMatch ? fileIdMatch[1] : undefined

            loadedImages.push({
              cid: cid,
              fileName: '',
              originalName: '',
              path: '',
              size: 0,
              mimeType: 'image/jpeg',
              fileId: fileId,
              url: previewUrl,
            })
          }
        }
      })

      if (loadedImages.length > 0) {
        setInlineImages(loadedImages)
      }
    }
  }, [initialData])
  const [showCC, setShowCC] = useState(!!initialData?.cc?.length)
  const [showBCC, setShowBCC] = useState(!!initialData?.bcc?.length)
  const [viewMode, setViewMode] = useState<'rich' | 'html'>('rich')

  // Prepare initial values based on reply/forward
  const getInitialValues = () => {
    if (replyTo) {
      // Reply: Add "Re:" prefix, set to original sender, quote original content
      const subject = replyTo.subject.startsWith('Re:')
        ? replyTo.subject
        : `Re: ${replyTo.subject}`

      const quotedBody = `\n\n--- Orijinal Mesaj ---\nGönderen: ${replyTo.from.name} ${replyTo.from.lastName}\nTarih: ${new Date().toLocaleString('tr-TR')}\nKonu: ${replyTo.subject}\n\n${replyTo.body}`

      const quotedHtmlBody = replyTo.htmlBody
        ? `<div style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 10px; color: #666;">
            <p><strong>--- Orijinal Mesaj ---</strong></p>
            <p><strong>Gönderen:</strong> ${replyTo.from.name} ${replyTo.from.lastName}</p>
            <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
            <p><strong>Konu:</strong> ${replyTo.subject}</p>
            <div>${replyTo.htmlBody}</div>
          </div>`
        : undefined

      return {
        to: [replyTo.from],
        cc: [],
        bcc: [],
        subject,
        body: quotedBody,
        htmlBody: quotedHtmlBody,
      }
    } else if (forwardFrom) {
      // Forward: Add "Fwd:" prefix, include original content and attachments
      const subject = forwardFrom.subject.startsWith('Fwd:')
        ? forwardFrom.subject
        : `Fwd: ${forwardFrom.subject}`

      const forwardedBody = `\n\n--- İletilen Mesaj ---\nGönderen: ${forwardFrom.from.name} ${forwardFrom.from.lastName}\nTarih: ${new Date().toLocaleString('tr-TR')}\nKonu: ${forwardFrom.subject}\n\n${forwardFrom.body}`

      const forwardedHtmlBody = forwardFrom.htmlBody
        ? `<div style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 10px; color: #666;">
            <p><strong>--- İletilen Mesaj ---</strong></p>
            <p><strong>Gönderen:</strong> ${forwardFrom.from.name} ${forwardFrom.from.lastName}</p>
            <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
            <p><strong>Konu:</strong> ${forwardFrom.subject}</p>
            <div>${forwardFrom.htmlBody}</div>
          </div>`
        : undefined

      return {
        to: [],
        cc: [],
        bcc: [],
        subject,
        body: forwardedBody,
        htmlBody: forwardedHtmlBody,
      }
    } else {
      // Normal compose or draft
      return {
        to: initialData?.to || [],
        cc: initialData?.cc || [],
        bcc: initialData?.bcc || [],
        subject: initialData?.subject || '',
        body: initialData?.body || '',
        htmlBody: initialData?.htmlBody || '',
      }
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
  })

  // Set attachments if forwarding or loading draft (exclude inline - those go to inlineImages)
  useEffect(() => {
    if (forwardFrom?.attachments && forwardFrom.attachments.length > 0) {
      setAttachments(forwardFrom.attachments)
    } else if (initialData?.attachments) {
      const regular = initialData.attachments.filter(
        (a): a is AttachmentMetadata =>
          !(a as AttachmentMetadata & { isInline?: boolean }).isInline
      )
      setAttachments(regular)
    }
  }, [forwardFrom, initialData])

  const sendMutation = useMutation(
    trpc.mail.send.mutationOptions({
      onSuccess: () => {
        toast.success('E-posta başarıyla gönderildi')
        form.reset()
        setAttachments([])
        onSent?.()
      },
      onError: (error) => {
        toast.error(error.message || 'E-posta gönderilemedi')
      },
    })
  )

  const saveDraftMutation = useMutation(
    trpc.mail.saveDraft.mutationOptions({
      onSuccess: (result) => {
        toast.success('Taslak kaydedildi')
        onDraftSaved?.(result.id)
      },
      onError: (error) => {
        toast.error(error.message || 'Taslak kaydedilemedi')
      },
    })
  )

  function onSubmit(values: z.infer<typeof formSchema>) {
    const toEmails = values.to.map((u) => u.email)
    const ccEmails = values.cc?.map((u) => u.email)
    const bccEmails = values.bcc?.map((u) => u.email)

    // Convert previewUrl to cid: format in HTML for email sending
    let htmlBody = values.htmlBody || values.body
    const imagesToSend: InlineImageMetadata[] = []

    if (htmlBody && inlineImages.length > 0) {
      // Create a temporary DOM element to parse and modify HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlBody

      // Find all img tags and replace previewUrl with cid:
      const images = tempDiv.querySelectorAll('img')
      images.forEach((img) => {
        const cid = img.getAttribute('data-cid')
        const src = img.getAttribute('src') || ''

        // If image has a CID, replace src with cid: format
        if (cid) {
          // Find the inline image metadata
          const inlineImage = inlineImages.find((img) => img.cid === cid)

          if (inlineImage) {
            // Add to images to send
            imagesToSend.push(inlineImage)

            // Replace src with cid: format
            img.setAttribute('src', `cid:${cid}`)

            // Remove preview-url attribute if exists
            img.removeAttribute('data-preview-url')
          } else {
            // Try to find by preview URL
            const previewUrl = img.getAttribute('data-preview-url') || src
            const foundImage = inlineImages.find(
              (img) =>
                img.fileId &&
                (previewUrl.includes(img.fileId) ||
                  previewUrl.includes(img.path) ||
                  img.url === previewUrl)
            )

            if (foundImage) {
              imagesToSend.push(foundImage)
              img.setAttribute('src', `cid:${foundImage.cid}`)
              img.setAttribute('data-cid', foundImage.cid)
              img.removeAttribute('data-preview-url')
            }
          }
        } else {
          // Try to find image by preview URL
          const previewUrl = img.getAttribute('data-preview-url') || src
          if (previewUrl && previewUrl.startsWith('/api/files/')) {
            const foundImage = inlineImages.find(
              (img) =>
                img.fileId &&
                (previewUrl.includes(img.fileId) ||
                  previewUrl.includes(img.path) ||
                  img.url === previewUrl)
            )

            if (foundImage) {
              imagesToSend.push(foundImage)
              img.setAttribute('src', `cid:${foundImage.cid}`)
              img.setAttribute('data-cid', foundImage.cid)
              img.removeAttribute('data-preview-url')
            }
          }
        }
      })

      htmlBody = tempDiv.innerHTML
    }

    sendMutation.mutate({
      to: toEmails,
      cc: ccEmails,
      bcc: bccEmails,
      subject: values.subject,
      body: values.body,
      htmlBody: htmlBody,
      attachments: attachments.length > 0 ? attachments : undefined,
      inlineImages: imagesToSend.length > 0 ? imagesToSend : undefined,
      threadId: initialData?.id || replyTo?.id || forwardFrom?.id,
      inReplyTo: replyTo?.id,
    })
  }

  function handleSaveDraft() {
    const values = form.getValues()
    const toEmails = values.to.map((u) => u.email)
    const ccEmails = values.cc?.map((u) => u.email)
    const bccEmails = values.bcc?.map((u) => u.email)

    // Extract inline images from HTML to save with draft
    const draftInlineImages: InlineImageMetadata[] = []
    if (values.htmlBody && inlineImages.length > 0) {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = values.htmlBody
      const images = tempDiv.querySelectorAll('img')

      images.forEach((img) => {
        const cid = img.getAttribute('data-cid')
        if (cid) {
          const inlineImage = inlineImages.find((img) => img.cid === cid)
          if (inlineImage) {
            draftInlineImages.push(inlineImage)
          }
        }
      })
    }

    saveDraftMutation.mutate({
      id: initialData?.id,
      to: toEmails,
      cc: ccEmails,
      bcc: bccEmails,
      subject: values.subject,
      body: values.body,
      htmlBody: values.htmlBody || values.body,
      attachments: attachments.length > 0 ? attachments : undefined,
      inlineImages:
        draftInlineImages.length > 0 ? draftInlineImages : undefined,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Recipients */}
          <FormField
            control={form.control}
            name="to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kime</FormLabel>
                <FormControl>
                  <UserPicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Alıcı seçin..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CC */}
          {showCC && (
            <FormField
              control={form.control}
              name="cc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CC</FormLabel>
                  <FormControl>
                    <UserPicker
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="CC alıcıları seçin..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* BCC */}
          {showBCC && (
            <FormField
              control={form.control}
              name="bcc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BCC</FormLabel>
                  <FormControl>
                    <UserPicker
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="BCC alıcıları seçin..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Show CC/BCC buttons */}
          <div className="flex gap-2">
            {!showCC && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCC(true)}
              >
                CC Ekle
              </Button>
            )}
            {!showBCC && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowBCC(true)}
              >
                BCC Ekle
              </Button>
            )}
          </div>

          {/* Subject */}
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Konu</FormLabel>
                <FormControl>
                  <Input placeholder="E-posta konusu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Attachments */}
          <AttachmentManager
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />

          {/* Content */}
          <FormField
            control={form.control}
            name="htmlBody"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İçerik</FormLabel>
                <FormControl>
                  <Tabs
                    value={viewMode}
                    onValueChange={(v) => setViewMode(v as 'rich' | 'html')}
                  >
                    <TabsList>
                      <TabsTrigger value="rich">Zengin Metin</TabsTrigger>
                      <TabsTrigger value="html">HTML</TabsTrigger>
                    </TabsList>
                    <TabsContent value="rich">
                      <div className="border rounded-lg overflow-hidden">
                        <EmailToolbar editorRef={editorRef} />
                        <EmailRichTextEditor
                          ref={editorRef}
                          value={field.value || ''}
                          onChange={(html, images) => {
                            field.onChange(html)
                            form.setValue('body', stripHtml(html))
                            setInlineImages(images)
                          }}
                          placeholder="E-posta içeriğini buraya yazın..."
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="html">
                      <textarea
                        className="w-full min-h-[300px] p-4 border rounded-lg font-mono text-sm"
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value)
                          form.setValue('body', stripHtml(e.target.value))
                        }}
                        placeholder="HTML içeriği..."
                      />
                    </TabsContent>
                  </Tabs>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="border-t p-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
            >
              {saveDraftMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Taslak Kaydet
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                İptal
              </Button>
            )}
          </div>
          <Button type="submit" disabled={sendMutation.isPending}>
            {sendMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Gönder
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function stripHtml(html: string): string {
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
