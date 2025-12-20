import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LockClosedIcon, GlobeAltIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabaseClient'
import { getRatingSettings, setRatingSettings } from '@/lib/services/ratings'

const TABS = [
  { id: 'general', label: 'General', icon: GlobeAltIcon },
  { id: 'account', label: 'Account', icon: UserCircleIcon },
  { id: 'security', label: 'Security', icon: LockClosedIcon },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()

  // Account settings state
  const [displayName, setDisplayName] = useState(() =>
    localStorage.getItem('settings_displayName') || 'Admin User'
  )
  const [avatarUrl, setAvatarUrl] = useState(() =>
    localStorage.getItem('settings_avatarUrl') || ''
  )
  const [email, setEmail] = useState('admin@example.com')

  // Security settings state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Maintenance settings state
  const [maintenanceMode, setMaintenanceMode] = useState(() =>
    localStorage.getItem('site_maintenance_mode') === 'true'
  )
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)

  // Maintenance Modal State
  const [maintenanceType, setMaintenanceType] = useState<'duration' | 'scheduled'>('duration')
  const [durationDays, setDurationDays] = useState('0')
  const [durationHours, setDurationHours] = useState('1')
  const [durationMinutes, setDurationMinutes] = useState('0')
  const [durationSeconds, setDurationSeconds] = useState('0')
  const [showTimerOnPage, setShowTimerOnPage] = useState(true)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [maintenanceHeadline, setMaintenanceHeadline] = useState('Under Maintenance')
  const [maintenanceMessage, setMaintenanceMessage] = useState("We're currently improving our website to serve you better. We'll be back shortly!")

  // Rating settings
  const [requireLoginForRatings, setRequireLoginForRatings] = useState(true)

  // Load user info from Supabase
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setEmail(user.email)
        }
      } catch (error) {
        console.error('Error loading user info:', error)
      }
    }
    getUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setEmail(session.user.email)
      }
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  // Load rating settings
  useEffect(() => {
    getRatingSettings()
      .then(settings => {
        setRequireLoginForRatings(settings.requireLoginForRatings)
      })
      .catch(err => {
        console.error('Error loading rating settings:', err)
      })
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500000) { // 500KB limit
        toast.error('Image size must be less than 500KB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)

    if (activeTab === 'account') {
      if (!displayName.trim()) {
        toast.error('Display name is required')
        setIsSaving(false)
        return
      }

      localStorage.setItem('settings_displayName', displayName)
      localStorage.setItem('settings_avatarUrl', avatarUrl)

      // Dispatch a custom event so other components (like Sidebar) can update immediately
      window.dispatchEvent(new Event('settingsChanged'))

      setIsSaving(false)
      toast.success('Profile updated successfully!')
      return
    }

    if (activeTab === 'security') {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error('All password fields are required')
        setIsSaving(false)
        return
      }
      if (newPassword.length < 8) {
        toast.error('New password must be at least 8 characters long')
        setIsSaving(false)
        return
      }
      if (newPassword !== confirmPassword) {
        toast.error('New password and confirm password do not match')
        setIsSaving(false)
        return
      }

      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword })

        if (error) throw error

        toast.success('Password updated successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } catch (err) {
        console.error('Password update error:', err)
        toast.error('Failed to update password. Please try again.')
      } finally {
        setIsSaving(false)
      }
    }

    if (activeTab === 'general') {
      try {
        await setRatingSettings(requireLoginForRatings)
        toast.success('General settings updated!')
      } catch (err) {
        console.error('Failed to save general settings:', err)
        toast.error('Failed to save general settings.')
      } finally {
        setIsSaving(false)
      }
      return
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your admin preferences and site configuration.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-95",
                  isActive
                    ? "bg-[#FFDE1A] text-black shadow-[0_0_15px_-5px_#FFDE1A]"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 lg:p-8 space-y-8 shadow-sm dark:shadow-none"
          >
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Maintenance Mode</h2>
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Enable Maintenance Mode</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Redirect all visitors to a maintenance page. Admins can still access the site.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (maintenanceMode) {
                          setMaintenanceMode(false)
                          localStorage.setItem('site_maintenance_mode', 'false')
                          localStorage.removeItem('site_maintenance_end_time')
                          toast.success('Maintenance mode disabled')
                        } else {
                          setShowMaintenanceModal(true)
                        }
                      }}
                      className={cn(
                        "relative inline-flex h-7 w-14 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFDE1A]",
                        maintenanceMode
                          ? "bg-[#FFDE1A] border-[#FFDE1A]"
                          : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                          maintenanceMode ? "translate-x-8" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Prompt Ratings</h2>
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Require login to rate prompts</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        When enabled, only signed-in users can rate prompts. When disabled, anyone can rate, but we limit ratings per browser.
                      </p>
                    </div>
                    <button
                      onClick={() => setRequireLoginForRatings(prev => !prev)}
                      className={cn(
                        "relative inline-flex h-7 w-14 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFDE1A]",
                        requireLoginForRatings
                          ? "bg-[#FFDE1A] border-[#FFDE1A]"
                          : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                          requireLoginForRatings ? "translate-x-8" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Modal */}
            {showMaintenanceModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-lg bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-xl p-6 space-y-6 max-h-[90vh] overflow-y-auto"
                >
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Enable Maintenance Mode</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      Configure the maintenance page settings and duration.
                    </p>
                  </div>

                  {/* Mode Selection */}
                  <div className="flex p-1 bg-zinc-100 dark:bg-white/5 rounded-xl">
                    <button
                      onClick={() => setMaintenanceType('duration')}
                      className={cn(
                        "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                        maintenanceType === 'duration'
                          ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      )}
                    >
                      Duration
                    </button>
                    <button
                      onClick={() => setMaintenanceType('scheduled')}
                      className={cn(
                        "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                        maintenanceType === 'scheduled'
                          ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      )}
                    >
                      Scheduled End
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Duration Inputs */}
                    {maintenanceType === 'duration' && (
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Days</label>
                          <input
                            type="number"
                            min="0"
                            value={durationDays}
                            onChange={(e) => setDurationDays(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Hours</label>
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={durationHours}
                            onChange={(e) => setDurationHours(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Minutes</label>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Seconds</label>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={durationSeconds}
                            onChange={(e) => setDurationSeconds(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                          />
                        </div>
                      </div>
                    )}

                    {/* Scheduled Inputs */}
                    {maintenanceType === 'scheduled' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Date</label>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Time</label>
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                          />
                        </div>
                      </div>
                    )}

                    {/* Content Customization */}
                    <div className="pt-4 border-t border-zinc-200 dark:border-white/5 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Headline</label>
                        <input
                          type="text"
                          value={maintenanceHeadline}
                          onChange={(e) => setMaintenanceHeadline(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50 transition-colors"
                          placeholder="Under Maintenance"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Message</label>
                        <textarea
                          rows={3}
                          value={maintenanceMessage}
                          onChange={(e) => setMaintenanceMessage(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50 transition-colors resize-none"
                          placeholder="We're currently improving our website..."
                        />
                      </div>

                      {/* Show Timer Toggle */}
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <label className="text-sm font-medium text-zinc-900 dark:text-white">Show Timer on Page</label>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            If disabled, the countdown will be hidden from visitors.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowTimerOnPage(!showTimerOnPage)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFDE1A] focus:ring-offset-2",
                            showTimerOnPage ? "bg-[#FFDE1A]" : "bg-zinc-200 dark:bg-zinc-700"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              showTimerOnPage ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setMaintenanceMode(true)
                        localStorage.setItem('site_maintenance_mode', 'true')
                        localStorage.removeItem('site_maintenance_end_time')
                        localStorage.setItem('site_maintenance_headline', maintenanceHeadline)
                        localStorage.setItem('site_maintenance_message', maintenanceMessage)
                        localStorage.setItem('site_maintenance_show_timer', 'false')
                        setShowMaintenanceModal(false)
                        toast.success('Maintenance mode enabled (no timer)')
                      }}
                      className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors active:scale-95"
                    >
                      Skip Timer
                    </button>
                    <button
                      onClick={() => {
                        let endTime = 0

                        if (maintenanceType === 'duration') {
                          const days = parseInt(durationDays || '0', 10)
                          const hours = parseInt(durationHours || '0', 10)
                          const minutes = parseInt(durationMinutes || '0', 10)
                          const seconds = parseInt(durationSeconds || '0', 10)

                          if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
                            toast.error('Please enter a valid duration')
                            return
                          }

                          endTime = Date.now() + (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000)
                        } else {
                          if (!scheduledDate || !scheduledTime) {
                            toast.error('Please select both date and time')
                            return
                          }
                          const scheduled = new Date(`${scheduledDate}T${scheduledTime}`)
                          if (isNaN(scheduled.getTime()) || scheduled.getTime() <= Date.now()) {
                            toast.error('Please select a future date and time')
                            return
                          }
                          endTime = scheduled.getTime()
                        }

                        setMaintenanceMode(true)
                        localStorage.setItem('site_maintenance_mode', 'true')
                        localStorage.setItem('site_maintenance_end_time', endTime.toString())
                        localStorage.setItem('site_maintenance_headline', maintenanceHeadline)
                        localStorage.setItem('site_maintenance_message', maintenanceMessage)
                        localStorage.setItem('site_maintenance_show_timer', showTimerOnPage.toString())
                        setShowMaintenanceModal(false)
                        toast.success('Maintenance mode enabled with timer')
                      }}
                      className="flex-1 px-4 py-2.5 bg-[#FFDE1A] hover:bg-[#ffe64d] text-black font-bold rounded-xl transition-colors active:scale-95"
                    >
                      Enable with Timer
                    </button>
                  </div>
                  <button
                    onClick={() => setShowMaintenanceModal(false)}
                    className="w-full text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Profile</h2>
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-900 border-2 border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" width="80" height="80" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-zinc-700 dark:text-white">
                          {displayName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="avatar-upload"
                        className="px-4 py-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl text-sm font-medium transition-colors active:scale-95 cursor-pointer inline-block"
                      >
                        Change Avatar
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <p className="text-xs text-zinc-500 mt-2">Max size 500KB</p>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Display Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50 transition-colors"
                        placeholder="Enter display name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Change Password</h2>
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50 transition-colors"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50 transition-colors"
                        placeholder="Enter new password (min. 8 characters)"
                      />
                      {newPassword && newPassword.length < 8 && (
                        <p className="text-xs text-red-500">Password must be at least 8 characters long</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50 transition-colors"
                        placeholder="Confirm new password"
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'security' || activeTab === 'account') && (
              <div className="pt-6 border-t border-zinc-200 dark:border-white/5 flex justify-end">
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="px-6 py-3 bg-[#FFDE1A] hover:bg-[#ffe64d] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors shadow-[0_0_20px_-5px_#FFDE1A] active:scale-95"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
