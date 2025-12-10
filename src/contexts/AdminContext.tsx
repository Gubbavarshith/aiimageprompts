import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { type PromptRecord } from '@/lib/services/prompts'

interface AdminContextType {
    isPromptModalOpen: boolean
    editingPrompt: PromptRecord | null
    openPromptForm: (prompt?: PromptRecord) => void
    closePromptForm: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false)
    const [editingPrompt, setEditingPrompt] = useState<PromptRecord | null>(null)

    const openPromptForm = useCallback((prompt?: PromptRecord) => {
        setEditingPrompt(prompt || null)
        setIsPromptModalOpen(true)
    }, [])

    const closePromptForm = useCallback(() => {
        setIsPromptModalOpen(false)
        setEditingPrompt(null)
    }, [])

    return (
        <AdminContext.Provider
            value={{
                isPromptModalOpen,
                editingPrompt,
                openPromptForm,
                closePromptForm,
            }}
        >
            {children}
        </AdminContext.Provider>
    )
}

export function useAdmin() {
    const context = useContext(AdminContext)
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider')
    }
    return context
}
