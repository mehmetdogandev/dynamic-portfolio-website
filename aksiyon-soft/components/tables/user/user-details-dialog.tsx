'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Shield, Mail, Calendar, User } from 'lucide-react'
import { UserWithRoles } from '@/components/tables/user/user-data-table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface UserDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserWithRoles | null
}

export function UserDetailsDialog({
  open,
  onOpenChange,
  user,
}: UserDetailsDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" max-h-[55vh] lg:overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center">
            <div className="flex items-center space-x-2 justify-center">
              <User className="h-5 w-5 font-bold" />
              <span className="text-lg font-bold flex items-center justify-center">
                {user.name} {user.lastName}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-center flex items-center justify-center">
            Kullanıcının bilgileri ve rol atamaları
          </DialogDescription>
        </DialogHeader>

        <Accordion type="multiple" defaultValue={['basic-info']}>
          <AccordionItem value="basic-info">
            <AccordionTrigger value="basic-info">
              <div className="text-lg flex items-center space-x-2">
                <span>Temel Bilgiler</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ad Soyad:</span>
                <span className="text-sm font-medium">
                  {user.name} {user.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">E-posta:</span>
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
              </div>
              {user.username && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Kullanıcı Adı:</span>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {user.username}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kayıt Tarihi:</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="roles">
            <AccordionTrigger value="roles">
              <div className="text-lg flex items-center space-x-2">
                <span>Roller</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {user.roles && user.roles.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role) => {
                      if (!role.scope) return null
                      return (
                        <Badge
                          key={role.id}
                          variant={'secondary'}
                          className="flex items-center space-x-1"
                        >
                          <span className="text-[12px]">{role.name}</span>
                          <span className="text-[9px] opacity-70">
                            ({role.scope})
                          </span>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Bu kullanıcıya henüz rol atanmamış
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kullanıcıyı düzenleyerek rol atayabilirsiniz
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  )
}
