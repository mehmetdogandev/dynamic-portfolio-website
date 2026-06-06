import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { blogCategory } from '@/lib/db/schema'

type SeedBlogType = {
  key: string
  name: string
  slug: string
  description: string
  parentKey: string | null
}

const BLOG_TYPE_ROWS: SeedBlogType[] = [
  {
    key: 'engineering',
    name: 'Mühendislik',
    slug: 'muhendislik',
    description: 'Teknik notlar, geliştirme süreçleri ve mimari yaklaşımlar.',
    parentKey: null,
  },
  {
    key: 'security',
    name: 'Güvenlik',
    slug: 'guvenlik',
    description: 'Yetkilendirme, veri güvenliği ve erişim politikaları.',
    parentKey: null,
  },
  {
    key: 'announcements',
    name: 'Duyuru',
    slug: 'duyuru',
    description: 'Platform güncellemeleri ve ürün duyuruları.',
    parentKey: null,
  },
  {
    key: 'integrations',
    name: 'Entegrasyon',
    slug: 'entegrasyon',
    description: 'Kurumsal entegrasyon tecrübeleri ve teslimat pratikleri.',
    parentKey: 'engineering',
  },
]

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(blogCategory)
    .where(isNull(blogCategory.deletedAt))
  if ((row?.n ?? 0) > 0) {
    console.log('Skip blog-type seed: blog_category table is not empty')
    return
  }

  const idByKey = new Map<string, string>()
  for (const [index, item] of BLOG_TYPE_ROWS.entries()) {
    const parentCategoryId = item.parentKey
      ? (idByKey.get(item.parentKey) ?? null)
      : null
    if (item.parentKey && !parentCategoryId) {
      continue
    }

    const [inserted] = await db
      .insert(blogCategory)
      .values({
        name: item.name,
        slug: item.slug,
        description: item.description,
        parentCategoryId,
        sortOrder: index,
      })
      .returning({ id: blogCategory.id })
    if (inserted) {
      idByKey.set(item.key, inserted.id)
    }
  }
}
