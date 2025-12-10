import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { WrenchScrewdriverIcon, ClockIcon } from '@heroicons/react/24/outline'
import { intervalToDuration, type Duration } from 'date-fns'

export default function MaintenancePage() {
    const [timeLeft, setTimeLeft] = useState<Duration | null>(null)
    const [endTime, setEndTime] = useState<number | null>(null)

    const [headline, setHeadline] = useState('Under Maintenance')
    const [message, setMessage] = useState("We're currently improving our website to serve you better. We'll be back shortly!")

    const [showTimer, setShowTimer] = useState(true)

    useEffect(() => {
        // In a real app, this would come from an API
        const storedEndTime = localStorage.getItem('site_maintenance_end_time')
        const storedHeadline = localStorage.getItem('site_maintenance_headline')
        const storedMessage = localStorage.getItem('site_maintenance_message')
        const storedShowTimer = localStorage.getItem('site_maintenance_show_timer')

        if (storedEndTime) {
            setEndTime(parseInt(storedEndTime, 10))
        }
        if (storedHeadline) setHeadline(storedHeadline)
        if (storedMessage) setMessage(storedMessage)
        if (storedShowTimer !== null) setShowTimer(storedShowTimer === 'true')
    }, [])

    useEffect(() => {
        // Check maintenance status every 5 seconds
        const statusCheck = setInterval(() => {
            const isMaintenanceMode = localStorage.getItem('site_maintenance_mode') === 'true'
            if (!isMaintenanceMode) {
                window.location.href = '/'
            }
        }, 5000)

        if (!endTime) {
            return () => clearInterval(statusCheck)
        }

        const timer = setInterval(() => {
            const now = Date.now()
            if (now >= endTime) {
                setTimeLeft(null)
                clearInterval(timer)

                // Disable maintenance mode automatically
                localStorage.setItem('site_maintenance_mode', 'false')
                localStorage.removeItem('site_maintenance_end_time')

                window.location.href = '/'
            } else {
                setTimeLeft(intervalToDuration({ start: now, end: endTime }))
            }
        }, 1000)

        return () => {
            clearInterval(timer)
            clearInterval(statusCheck)
        }
    }, [endTime])

    const formatTimeValue = (val?: number) => val?.toString().padStart(2, '0') || '00'

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] text-white relative overflow-hidden p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 w-full h-full">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#09090b]/50 to-[#09090b]" />
            </div>

            <div className="relative z-10 max-w-lg w-full text-center space-y-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 mx-auto bg-[#FFDE1A]/10 rounded-3xl flex items-center justify-center border border-[#FFDE1A]/20"
                >
                    <WrenchScrewdriverIcon className="w-12 h-12 text-[#FFDE1A]" />
                </motion.div>

                <div className="space-y-4">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-5xl font-bold tracking-tight"
                    >
                        {headline}
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-zinc-400 text-lg"
                    >
                        {message}
                    </motion.p>
                </div>

                {showTimer && timeLeft && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
                    >
                        <div className="flex items-center justify-center gap-2 text-[#FFDE1A] mb-4">
                            <ClockIcon className="w-5 h-5" />
                            <span className="font-medium uppercase tracking-wider text-sm">Estimated Return</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <div className="text-3xl font-bold font-mono">{formatTimeValue(timeLeft.days)}</div>
                                <div className="text-xs text-zinc-500 uppercase tracking-wider">Days</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-3xl font-bold font-mono">{formatTimeValue(timeLeft.hours)}</div>
                                <div className="text-xs text-zinc-500 uppercase tracking-wider">Hours</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-3xl font-bold font-mono">{formatTimeValue(timeLeft.minutes)}</div>
                                <div className="text-xs text-zinc-500 uppercase tracking-wider">Mins</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-3xl font-bold font-mono">{formatTimeValue(timeLeft.seconds)}</div>
                                <div className="text-xs text-zinc-500 uppercase tracking-wider">Secs</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
