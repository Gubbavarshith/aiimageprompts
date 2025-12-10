import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isAdminEmail, getMockSession } from '@/lib/authHelpers'
import { supabase } from '@/lib/supabaseClient'

interface MaintenanceGuardProps {
    children: React.ReactNode
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        const checkMaintenance = async () => {
            // 1. Check if maintenance mode is enabled
            let isMaintenanceMode = localStorage.getItem('site_maintenance_mode') === 'true'
            const maintenanceEndTime = localStorage.getItem('site_maintenance_end_time')

            // Check if maintenance time has expired
            if (isMaintenanceMode && maintenanceEndTime) {
                const endTime = parseInt(maintenanceEndTime, 10)
                if (Date.now() > endTime) {
                    localStorage.setItem('site_maintenance_mode', 'false')
                    localStorage.removeItem('site_maintenance_end_time')
                    isMaintenanceMode = false
                }
            }

            if (!isMaintenanceMode) {
                setIsChecking(false)
                return
            }

            // 2. Allow access to admin routes and login
            if (location.pathname.startsWith('/admin') || location.pathname === '/auth') {
                setIsChecking(false)
                return
            }

            // 3. Check if user is admin (Supabase or Mock)
            // Try Supabase first
            try {
                const { data: { user }, error } = await supabase.auth.getUser()
                if (error) {
                    console.error('Error getting user:', error)
                    // Continue with mock session check
                } else if (user?.email && isAdminEmail(user.email)) {
                    setIsChecking(false)
                    return
                }
            } catch (err) {
                console.error('Error in getUser:', err)
                // Continue with mock session check
            }

            // Try Mock Session
            const mockSession = getMockSession()
            if (mockSession?.email && isAdminEmail(mockSession.email)) {
                setIsChecking(false)
                return
            }

            // 4. Redirect to maintenance page if not admin
            if (location.pathname !== '/maintenance') {
                navigate('/maintenance')
            }
            setIsChecking(false)
        }

        checkMaintenance()
    }, [location.pathname, navigate])

    if (isChecking) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
