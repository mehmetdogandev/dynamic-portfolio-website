import 'server-only'

import { trpc } from '@/lib/trpc/server'
import type { WebsiteBlogPost } from '@/lib/website/types'

export async function getPublicBlogPosts(): Promise<WebsiteBlogPost[]> {
  return trpc.blog.listPublic()
}
