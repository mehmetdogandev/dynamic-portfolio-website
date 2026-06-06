import { NextRequest, NextResponse } from 'next/server'
import { parseChannel } from '@/lib/radio-mobile/channels'
import {
  verifyApiKeyForChannel,
  extractApiKeyFromRequest,
} from '@/lib/radio-mobile/api-key-auth'
import { getNextVersionForChannel } from '@/lib/radio-mobile/version'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channel = parseChannel(searchParams.get('channel'))
    const majorRaw = searchParams.get('major')
    const major = majorRaw ? Number.parseInt(majorRaw, 10) : NaN

    if (!channel) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }
    if (!Number.isInteger(major) || major < 0) {
      return NextResponse.json({ error: 'Invalid major' }, { status: 400 })
    }

    const apiKey = extractApiKeyFromRequest(request)
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }
    const auth = await verifyApiKeyForChannel(apiKey, channel)
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const next = await getNextVersionForChannel(channel, major)
    return NextResponse.json(next)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
