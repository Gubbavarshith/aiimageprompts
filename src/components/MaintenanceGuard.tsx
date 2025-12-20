import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isAdminEmail, getMockSession } from '@/lib/authHelpers'
import { supabase } from '@/lib/supabaseClient'

interface MaintenanceGuardProps {
    children: React.ReactNode
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
    const location = useLocation()
    const navigate = useNavigate()

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
                return
            }

            // 2. Allow access to admin routes and login
            if (location.pathname.startsWith('/admin') || location.pathname === '/auth') {
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
                    return
                }
            } catch (err) {
                console.error('Error in getUser:', err)
                // Continue with mock session check
            }

            // Try Mock Session
            const mockSession = getMockSession()
            if (mockSession?.email && isAdminEmail(mockSession.email)) {
                return
            }

            // 4. Redirect to maintenance page if not admin
            if (location.pathname !== '/maintenance') {
                navigate('/maintenance')
            }
        }

        checkMaintenance()
    }, [location.pathname, navigate])

    // Don't block first paint - render children immediately
    // Maintenance redirect happens async after initial render
    return <>{children}</>
}
