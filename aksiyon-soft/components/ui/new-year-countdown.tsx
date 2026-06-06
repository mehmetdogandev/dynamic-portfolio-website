'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

type CountdownTime = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

type NewYearCountdownProps = {
  targetDate: Date
}

function getTimeDiff(targetDate: Date): CountdownTime {
  const now = Date.now()
  const target = targetDate.getTime()
  const diff = target - now

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export function NewYearCountdown({ targetDate }: NewYearCountdownProps) {
  const [time, setTime] = useState<CountdownTime>(() => getTimeDiff(targetDate))

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeDiff(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  const isFinished =
    time.days === 0 &&
    time.hours === 0 &&
    time.minutes === 0 &&
    time.seconds === 0

  return (
    <Card className="border-gold/60 bg-linear-to-r from-christmasGreen to-christmasRed text-snow shadow-md">
      <CardContent className="py-4 px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Yılbaşı Geri Sayım
            </p>
            <p className="text-sm text-snow/90">Yeni yıla kalan süre:</p>
          </div>
          {isFinished ? (
            <div className="text-center md:text-right">
              <p className="text-lg font-bold text-gold">Mutlu Yıllar! </p>
              <p className="text-xs text-snow/80">
                Yeni yılınız başarı ve mutluluk getirsin.
              </p>
            </div>
          ) : (
            <div className="flex justify-center gap-2 text-center md:justify-end">
              {Object.entries(time).map(([key, value]) => (
                <div
                  key={key}
                  className="min-w-[60px] rounded-lg bg-black/10 px-2 py-2 backdrop-blur-sm"
                >
                  <div className="text-lg font-bold leading-none">
                    {value.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-snow/80">
                    {key}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default NewYearCountdown
