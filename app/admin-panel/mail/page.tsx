'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { MailSidebar, type MailFolder } from '@/components/mail/mail-sidebar'
import { MailList, type MailListItem } from '@/components/mail/mail-list'
import {
  MailViewer,
  type MailViewerData,
  type Attachment,
} from '@/components/mail/mail-viewer'
import { isHtmlContentUrl } from '@/lib/mail/email-html-utils'
import type { UserOption } from '@/components/mail/user-picker'
import type { AttachmentMetadata } from '@/components/mail/attachment-manager'
import { MailComposer } from '@/components/mail/mail-composer'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePermission } from '@/lib/hooks/use-rbac'
import { SCOPES, PERMISSIONS } from '@/lib/db/schema'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type ViewMode = 'list' | 'compose' | 'view'

export default function MailPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [activeFolder, setActiveFolder] = useState<MailFolder>('sent')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [composeDraftId, setComposeDraftId] = useState<string | undefined>()
  const [forwardFromData, setForwardFromData] = useState<{
    id: string
    from: UserOption
    subject: string
    body: string
    htmlBody?: string
    attachments?: AttachmentMetadata[]
  } | null>(null)
  const [isForwarding, setIsForwarding] = useState(false)

  const { data: canAccessMail, isLoading: isLoadingMailAccess } = usePermission(
    SCOPES.MAIL,
    PERMISSIONS.ACCESS
  )

  // Fetch sent emails
  const { data: sentEmailsData, isLoading: isLoadingSent } = useQuery({
    ...trpc.mail.listSent.queryOptions({
      page: 1,
      limit: 50,
      search: searchQuery || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isDraft:
        activeFolder === 'drafts'
          ? true
          : activeFolder === 'trash'
            ? undefined
            : false,
      trashOnly: activeFolder === 'trash' ? true : undefined,
    }),
    enabled: canAccessMail === true,
  })

  // Get email details (view mode)
  const { data: emailDetails } = useQuery({
    ...trpc.mail.getById.queryOptions({
      id: selectedMailId!,
      includeDeleted: activeFolder === 'trash',
    }),
    enabled: !!selectedMailId && viewMode === 'view',
  })

  // Get draft details (compose mode - editing draft)
  const { data: draftDetails } = useQuery({
    ...trpc.mail.getById.queryOptions({
      id: composeDraftId!,
      includeDeleted: false,
    }),
    enabled: !!composeDraftId && viewMode === 'compose' && !forwardFromData,
  })

  const markAsReadMutation = useMutation(
    trpc.mail.markAsRead.mutationOptions({
      onSuccess: () => {
        toast.success('E-posta okundu olarak işaretlendi')
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.mail.delete.mutationOptions({
      onSuccess: () => {
        toast.success('E-posta silindi')
        void queryClient.invalidateQueries({
          queryKey: trpc.mail.listSent.queryKey(),
        })
        setViewMode('list')
        setSelectedMailId(null)
      },
    })
  )

  const restoreMutation = useMutation(
    trpc.mail.restore.mutationOptions({
      onSuccess: () => {
        toast.success('E-posta geri getirildi')
        void queryClient.invalidateQueries({
          queryKey: trpc.mail.listSent.queryKey(),
        })
        setViewMode('list')
        setSelectedMailId(null)
      },
    })
  )

  if (isLoadingMailAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!canAccessMail) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="border-0 shadow-none">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Erişim Reddedildi</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Bu sayfaya erişmek için MAIL kapsamında erişim iznine
                ihtiyacınız vardır.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Prepare mail list items
  const mailListItems: MailListItem[] = []

  if (sentEmailsData) {
    mailListItems.push(
      ...sentEmailsData.data.map((email) => ({
        id: email.id,
        subject: email.subject,
        from: email.senderEmail || '',
        fromName: email.senderName || undefined,
        to: email.recipientEmails || [],
        date: new Date(email.createdAt),
        isRead: email.isRead,
        hasAttachments:
          Array.isArray(email.attachments) && email.attachments.length > 0,
        preview: isHtmlContentUrl(email.htmlContent ?? '')
          ? (email.textContent ?? 'E-posta içeriği')
              .replace(/<[^>]*>/g, '')
              .substring(0, 100)
          : (email.htmlContent ?? '').replace(/<[^>]*>/g, '').substring(0, 100),
      }))
    )
  }

  const handleMailSelect = (id: string) => {
    if (activeFolder === 'drafts') {
      setComposeDraftId(id)
      setViewMode('compose')
      setSelectedMailId(null)
    } else {
      setSelectedMailId(id)
      setViewMode('view')
    }
  }

  const handleNewMail = () => {
    setComposeDraftId(undefined)
    setViewMode('compose')
  }

  const handleReply = () => {
    // TODO: Implement reply functionality
    toast.info('Yanıtla özelliği yakında eklenecek')
  }

  const handleForward = async () => {
    if (!viewerData) return
    setIsForwarding(true)
    try {
      const email = viewerData.from
      const [namePart, ...lastParts] = (
        viewerData.fromName ||
        email.split('@')[0] ||
        email
      ).split(' ')
      const fromUser: UserOption = {
        id: `manual-${email}`,
        name: namePart || email,
        lastName: lastParts.join(' ') || '',
        email: email,
        isManual: true,
      }
      let htmlBody: string | undefined
      const rawHtml = viewerData.htmlContent
      if (rawHtml && isHtmlContentUrl(rawHtml)) {
        const url = rawHtml.startsWith('/') ? rawHtml : `/${rawHtml}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('HTML yüklenemedi')
        htmlBody = await res.text()
      } else {
        htmlBody = rawHtml
      }
      const attachments: AttachmentMetadata[] = (viewerData.attachments || [])
        .filter((a) => !a.isInline)
        .map((a) => ({
          fileName: a.fileName,
          originalName: a.originalName,
          path: a.path,
          size: a.size,
          mimeType: a.mimeType,
          url: a.url ?? (a.fileId ? `/api/files/${a.fileId}/view` : undefined),
          fileId: a.fileId,
        }))
      setForwardFromData({
        id: viewerData.id,
        from: fromUser,
        subject: viewerData.subject,
        body: viewerData.textContent || '',
        htmlBody,
        attachments: attachments.length > 0 ? attachments : undefined,
      })
      setViewMode('compose')
      setSelectedMailId(null)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Yönlendirme hazırlanamadı'
      )
    } finally {
      setIsForwarding(false)
    }
  }

  const handleDelete = () => {
    if (!selectedMailId) return
    deleteMutation.mutate({
      id: selectedMailId,
    })
  }

  const handleRestore = () => {
    if (!selectedMailId) return
    restoreMutation.mutate({
      id: selectedMailId,
    })
  }

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate({
      id,
      isRead: true,
    })
  }

  // Convert draft details to MailComposer initialData
  const draftInitialData = (() => {
    if (!draftDetails?.data || forwardFromData) return undefined
    const e = draftDetails.data
    const toUserOption = (email: string): UserOption => ({
      id: `manual-${email}`,
      name: email.split('@')[0] || email,
      lastName: '',
      email: email,
      isManual: true,
    })
    const toList = (arr: string[] | null | undefined) =>
      (arr ?? []).map(toUserOption)
    const rawAttachments =
      (e.attachments as Array<{
        fileName?: string
        originalName?: string
        path?: string
        size?: number
        mimeType?: string
        url?: string
        fileId?: string
        isInline?: boolean
        cid?: string
        bucket?: string
      }>) ?? []
    const mapToAttachment = (
      a: (typeof rawAttachments)[0]
    ): AttachmentMetadata & { isInline?: boolean; cid?: string } => ({
      fileName: a.fileName ?? '',
      originalName: a.originalName ?? a.fileName ?? '',
      path: a.path ?? '',
      size: a.size ?? 0,
      mimeType: a.mimeType ?? 'application/octet-stream',
      url: a.url ?? (a.fileId ? `/api/files/${a.fileId}/view` : undefined),
      fileId: a.fileId,
      ...(a.isInline && { isInline: true, cid: a.cid }),
    })
    const attachments = rawAttachments.map(mapToAttachment)
    return {
      id: e.id,
      to: toList(e.recipientEmails),
      cc: toList(e.ccEmails),
      bcc: toList(e.bccEmails),
      subject: e.subject ?? '',
      body: e.textContent ?? '',
      htmlBody: e.htmlContent ?? undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    }
  })()

  // Prepare viewer data
  let viewerData: MailViewerData | null = null
  if (emailDetails && selectedMailId) {
    const email = emailDetails.data
    viewerData = {
      id: email.id,
      subject: email.subject,
      from: email.senderEmail || '',
      fromName: email.senderName || undefined,
      to: email.recipientEmails || [],
      cc: email.ccEmails ?? undefined,
      bcc: email.bccEmails ?? undefined,
      date: new Date(email.createdAt),
      htmlContent: email.htmlContent || undefined,
      textContent: email.textContent || undefined,
      attachments: (email.attachments as Attachment[]) || [],
      attachmentPath: email.attachmentPath ?? undefined,
    }
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <MailSidebar
            activeFolder={activeFolder}
            onFolderChange={(folder) => {
              setActiveFolder(folder)
              setViewMode('list')
              setSelectedMailId(null)
              setComposeDraftId(undefined)
            }}
            onNewMail={handleNewMail}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'compose' ? (
            composeDraftId && !draftInitialData && !forwardFromData ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MailComposer
                initialData={draftInitialData}
                forwardFrom={forwardFromData ?? undefined}
                onSent={() => {
                  setViewMode('list')
                  setComposeDraftId(undefined)
                  setForwardFromData(null)
                  setActiveFolder('sent')
                }}
                onCancel={() => {
                  setViewMode('list')
                  setComposeDraftId(undefined)
                  setForwardFromData(null)
                }}
                onDraftSaved={(draftId) => {
                  setActiveFolder('drafts')
                  setViewMode('list')
                  void queryClient.invalidateQueries({
                    queryKey: trpc.mail.listSent.queryKey(),
                  })
                  void queryClient.invalidateQueries({
                    queryKey: trpc.mail.getById.queryKey({ id: draftId }),
                  })
                  setComposeDraftId(undefined)
                  setForwardFromData(null)
                }}
              />
            )
          ) : viewMode === 'view' && viewerData ? (
            <MailViewer
              mail={viewerData}
              onReply={handleReply}
              onForward={handleForward}
              onDelete={handleDelete}
              onRestore={handleRestore}
              isFromTrash={activeFolder === 'trash'}
              isForwarding={isForwarding}
            />
          ) : (
            <MailList
              items={mailListItems}
              selectedId={selectedMailId || undefined}
              onSelect={handleMailSelect}
              onMarkAsRead={
                activeFolder === 'drafts' ? undefined : handleMarkAsRead
              }
              onDelete={
                activeFolder === 'sent' || activeFolder === 'drafts'
                  ? (id) => deleteMutation.mutate({ id })
                  : undefined
              }
              isLoading={isLoadingSent}
              isDraftFolder={activeFolder === 'drafts'}
              emptyMessage={
                activeFolder === 'drafts'
                  ? 'Taslak bulunamadı'
                  : activeFolder === 'trash'
                    ? 'Silinen e-posta yok'
                    : undefined
              }
              emptySubtitle={
                activeFolder === 'trash'
                  ? 'Silinen e-postalar burada listelenecektir.'
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
