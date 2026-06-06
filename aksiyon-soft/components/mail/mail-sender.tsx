'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

const formSchema = z.object({
  to: z.string().min(1, 'Alıcı zorunludur'),
  cc: z.string().optional(),
  subject: z.string().min(1, 'Konu zorunludur'),
  body: z.string().min(1, 'İçerik zorunludur'),
})

export function MailSender() {
  const trpc = useTRPC()
  const [isSending, setIsSending] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: '',
      cc: '',
      subject: '',
      body: '',
    },
  })

  const sendMutation = useMutation(
    trpc.mail.send.mutationOptions({
      onSettled: () => {
        setIsSending(false)
      },
      onSuccess: () => {
        form.reset()
      },
      onMutate: () => {
        setIsSending(true)
      },
    })
  )

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Convert comma-separated strings to arrays
    const toList = values.to
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean)
    const ccList = values.cc
      ? values.cc
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean)
      : undefined

    sendMutation.mutate({
      to: toList,
      cc: ccList,
      subject: values.subject,
      body: values.body,
      htmlBody: values.body,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alıcılar</FormLabel>
              <FormControl>
                <Input
                  placeholder="ornek@email.com, diger@email.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CC</FormLabel>
              <FormControl>
                <Input placeholder="cc@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İçerik</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="E-posta içeriğini buraya yazın..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Gönder
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
