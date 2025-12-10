import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useToast, type ToastType } from '@/contexts/ToastContext'

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 stroke-[2.5px]" />,
  error: <AlertCircle className="w-5 h-5 stroke-[2.5px]" />,
  info: <Info className="w-5 h-5 stroke-[2.5px]" />,
  warning: <AlertTriangle className="w-5 h-5 stroke-[2.5px]" />,
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: string; accent: string }> = {
  success: {
    bg: 'bg-white dark:bg-black',
    border: 'border-2 border-black dark:border-white',
    icon: 'text-[#F8BE00]',
    accent: 'bg-[#F8BE00]',
  },
  error: {
    bg: 'bg-white dark:bg-black',
    border: 'border-2 border-red-500 dark:border-red-500',
    icon: 'text-red-500',
    accent: 'bg-red-500',
  },
  info: {
    bg: 'bg-white dark:bg-black',
    border: 'border-2 border-black dark:border-white',
    icon: 'text-black dark:text-white',
    accent: 'bg-black dark:bg-white',
  },
  warning: {
    bg: 'bg-white dark:bg-black',
    border: 'border-2 border-yellow-500 dark:border-yellow-500',
    icon: 'text-yellow-500',
    accent: 'bg-yellow-500',
  },
}

export function Toaster() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const styles = toastStyles[toast.type]
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
              transition={{ 
                type: 'spring', 
                stiffness: 400, 
                damping: 30,
                mass: 0.8
              }}
              className={`pointer-events-auto ${styles.bg} ${styles.border} rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] min-w-[320px] max-w-[420px] overflow-hidden`}
            >
              {/* Accent bar */}
              <div className={`${styles.accent} h-1 w-full`} />
              
              {/* Content */}
              <div className="flex items-start gap-4 p-4">
                {/* Icon container */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${styles.accent}/10 flex items-center justify-center ${styles.icon}`}>
                  {toastIcons[toast.type]}
                </div>
                
                {/* Message */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-bold text-black dark:text-white leading-relaxed">
                    {toast.message}
                  </p>
                </div>
                
                {/* Close button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors stroke-[2.5px]" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

