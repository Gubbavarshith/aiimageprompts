import { useState, useRef, useEffect } from 'react'
import {
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import { parseCSV, validateBulkPrompt, normalizeBulkPrompt, detectImageRatioFromSource, getAspectRatioClass } from '@/lib/utils'
import { fetchUniqueCategories } from '@/lib/services/categories'
import { bulkCreatePrompts, type BulkUploadResult } from '@/lib/services/bulkUpload'
import { saveBulkUploadDrafts, loadBulkUploadDrafts, clearBulkUploadDrafts, deleteBulkUploadDraft } from '@/lib/services/bulkUploadDrafts'
import { useToast } from '@/contexts/ToastContext'
import type { PromptPayload } from '@/lib/services/prompts'
import { supabase, isSupabaseReady } from '@/lib/supabaseClient'

type BulkPromptData = {
  id: string // Temporary ID for tracking
  data: any // Raw data from JSON/CSV
  normalized: PromptPayload | null // Normalized data ready for database
  validationErrors: string[]
  imageRatio: string
  isDetectingRatio: boolean
}

export default function BulkUploadPage() {
  const [uploadedData, setUploadedData] = useState<BulkPromptData[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [previewRow, setPreviewRow] = useState<string | null>(null)
  const [validCategories, setValidCategories] = useState<string[]>([])
  const [publishResults, setPublishResults] = useState<BulkUploadResult[] | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isPublishingSingle, setIsPublishingSingle] = useState(false)
  const [isDeletingSingle, setIsDeletingSingle] = useState(false)
  const [isReviewingSingle, setIsReviewingSingle] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasRestoredRef = useRef(false)
  const toast = useToast()

  // Load categories and drafts on mount (only once)
  useEffect(() => {
    // Prevent multiple loads
    if (hasRestoredRef.current) return
    
    const loadData = async () => {
      try {
        // Load categories
        const categories = await fetchUniqueCategories()
        setValidCategories(categories)

        // Load saved drafts from database
        const drafts = await loadBulkUploadDrafts()
        if (drafts.length > 0) {
          const restoredData: BulkPromptData[] = drafts.map((draft, index) => ({
            id: draft.id || `temp-${Date.now()}-${index}`,
            data: draft.data,
            normalized: draft.normalized,
            validationErrors: draft.validation_errors || [],
            imageRatio: draft.image_ratio || '4:3',
            isDetectingRatio: draft.is_detecting_ratio || false,
          }))
          setUploadedData(restoredData)
          // Only show toast once
          if (!hasRestoredRef.current) {
            toast.success(`Restored ${restoredData.length} draft(s) from previous session`)
            hasRestoredRef.current = true
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setValidCategories([])
      } finally {
        setIsLoadingDrafts(false)
        hasRestoredRef.current = true
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount

  // Save drafts to database whenever uploadedData changes
  useEffect(() => {
    if (!isLoadingDrafts && uploadedData.length > 0) {
      const saveDrafts = async () => {
        try {
          await saveBulkUploadDrafts(
            uploadedData.map(row => ({
              data: row.data,
              normalized: row.normalized,
              validationErrors: row.validationErrors,
              imageRatio: row.imageRatio,
              isDetectingRatio: row.isDetectingRatio,
            }))
          )
        } catch (err) {
          console.error('Failed to save drafts:', err)
          // Don't show error toast as this is a background operation
        }
      }
      
      // Debounce saves to avoid too many database calls
      const timeoutId = setTimeout(saveDrafts, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [uploadedData, isLoadingDrafts])

  // Set page title
  useEffect(() => {
    document.title = 'Bulk Upload | AI Image Prompts Admin'
  }, [])

  const handleFileSelect = async (file: File) => {
    if (!file) return

    const validTypes = ['application/json', 'text/csv', 'text/plain']
    const validExtensions = ['.json', '.csv']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast.error('Please upload a JSON or CSV file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

    setIsUploading(true)
    setPublishResults(null)

    try {
      const text = await file.text()
      let parsedData: any[] = []

      if (fileExtension === '.json' || file.type === 'application/json') {
        try {
          parsedData = JSON.parse(text)
          if (!Array.isArray(parsedData)) {
            throw new Error('JSON must be an array of objects')
          }
        } catch (err: any) {
          toast.error(`Invalid JSON format: ${err.message}`)
          setIsUploading(false)
          return
        }
      } else {
        // CSV
        parsedData = parseCSV(text)
        if (parsedData.length === 0) {
          toast.error('CSV file is empty or invalid')
          setIsUploading(false)
          return
        }
      }

      // Process each item: validate, detect image ratio, normalize
      const processedData: BulkPromptData[] = await Promise.all(
        parsedData.map(async (item, index) => {
          const tempId = `temp-${Date.now()}-${index}`
          
          // Map preview_image to preview_image_url if needed
          if (item.preview_image && !item.preview_image_url) {
            item.preview_image_url = item.preview_image
          }

          // Validate
          const validationErrors = validateBulkPrompt(item, validCategories)

          // Detect image ratio
          let imageRatio = '4:3'
          let isDetectingRatio = false
          if (item.preview_image_url && !validationErrors.some(e => e.includes('preview_image_url'))) {
            isDetectingRatio = true
            try {
              imageRatio = await detectImageRatioFromSource(item.preview_image_url)
            } catch {
              // Keep default
            }
            isDetectingRatio = false
          }

          // Normalize (only if no validation errors) - set status to 'Published' for bulk uploads
          const normalized = validationErrors.length === 0
            ? normalizeBulkPrompt(item, imageRatio, 'Published')
            : null

          return {
            id: tempId,
            data: item,
            normalized,
            validationErrors,
            imageRatio,
            isDetectingRatio,
          }
        })
      )

      setUploadedData(processedData)
      toast.success(`Loaded ${processedData.length} prompt(s)`)
    } catch (err: any) {
      console.error('Error processing file:', err)
      toast.error(`Failed to process file: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleEditRow = (rowId: string) => {
    const row = uploadedData.find(r => r.id === rowId)
    if (!row || !row.normalized) {
      toast.error('Cannot edit row with validation errors. Please fix errors first.')
      return
    }

    setEditingRow(rowId)
  }

  const handleUpdateRow = (rowId: string, updatedData: any) => {
    setUploadedData(prev => prev.map(row => {
      if (row.id === rowId) {
        // Re-validate and normalize updated data - set status to 'Published'
        const validationErrors = validateBulkPrompt(updatedData, validCategories)
        const normalized = validationErrors.length === 0
          ? normalizeBulkPrompt(updatedData, row.imageRatio, 'Published')
          : null

        return {
          ...row,
          data: updatedData,
          normalized,
          validationErrors,
        }
      }
      return row
    }))
    setEditingRow(null)
  }

  const handleDeleteRow = (rowId: string) => {
    setUploadedData(prev => prev.filter(row => row.id !== rowId))
    setSelectedRows(prev => {
      const next = new Set(prev)
      next.delete(rowId)
      return next
    })
    // Note: Drafts will be auto-saved via useEffect
  }

  const handleClearAll = async () => {
    try {
      // Clear from database
      await clearBulkUploadDrafts()
      // Clear from state
      setUploadedData([])
      setSelectedRows(new Set())
      setPublishResults(null)
      setShowClearConfirm(false)
      toast.success('All data cleared successfully')
    } catch (err: any) {
      console.error('Error clearing data:', err)
      toast.error(`Failed to clear data: ${err.message}`)
    }
  }

  const handlePreviewRow = (rowId: string) => {
    const row = uploadedData.find(r => r.id === rowId)
    if (!row || !row.normalized) {
      toast.error('Cannot preview row with validation errors. Please fix errors first.')
      return
    }
    setPreviewRow(rowId)
  }

  const handlePublishSingle = async (rowId: string) => {
    const row = uploadedData.find(r => r.id === rowId)
    if (!row || !row.normalized) {
      toast.error('Cannot publish row with validation errors')
      return
    }

    setIsPublishingSingle(true)
    try {
      const results = await bulkCreatePrompts([row.normalized])
      const result = results[0]

      if (result.success) {
        toast.success(`Successfully published "${row.normalized.title}"`)
        
        // Remove from state and update database
        const updatedData = uploadedData.filter(r => r.id !== rowId)
        setUploadedData(updatedData)
        setPreviewRow(null)
        setSelectedRows(prev => {
          const next = new Set(prev)
          next.delete(rowId)
          return next
        })

        // Update database drafts
        try {
          await saveBulkUploadDrafts(
            updatedData.map(r => ({
              data: r.data,
              normalized: r.normalized,
              validationErrors: r.validationErrors,
              imageRatio: r.imageRatio,
              isDetectingRatio: r.isDetectingRatio,
            }))
          )
        } catch (err) {
          console.warn('Failed to update drafts after publishing:', err)
        }

        // Refresh categories
        try {
          const updatedCategories = await fetchUniqueCategories()
          setValidCategories(updatedCategories)
        } catch (err) {
          console.warn('Failed to refresh categories:', err)
        }
      } else {
        toast.error(`Failed to publish: ${result.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      console.error('Error publishing prompt:', err)
      toast.error(`Failed to publish prompt: ${err.message}`)
    } finally {
      setIsPublishingSingle(false)
    }
  }

  const handleDeleteSingle = async (rowId: string) => {
    const row = uploadedData.find(r => r.id === rowId)
    if (!row) return

    setIsDeletingSingle(true)
    try {
      // Delete from database if it has an ID
      if (row.id && row.id.startsWith('temp-') === false) {
        try {
          await deleteBulkUploadDraft(row.id)
        } catch (err) {
          console.warn('Failed to delete from database:', err)
        }
      }

      // Remove from state
      const updatedData = uploadedData.filter(r => r.id !== rowId)
      setUploadedData(updatedData)
      setPreviewRow(null)
      setSelectedRows(prev => {
        const next = new Set(prev)
        next.delete(rowId)
        return next
      })

      // Update database drafts
      try {
        await saveBulkUploadDrafts(
          updatedData.map(r => ({
            data: r.data,
            normalized: r.normalized,
            validationErrors: r.validationErrors,
            imageRatio: r.imageRatio,
            isDetectingRatio: r.isDetectingRatio,
          }))
        )
      } catch (err) {
        console.warn('Failed to update drafts after deleting:', err)
      }

      toast.success(`Deleted "${row.data.title || 'prompt'}"`)
    } catch (err: any) {
      console.error('Error deleting prompt:', err)
      toast.error(`Failed to delete prompt: ${err.message}`)
    } finally {
      setIsDeletingSingle(false)
    }
  }

  const handleReviewSingle = async (rowId: string) => {
    const row = uploadedData.find(r => r.id === rowId)
    if (!row || !row.normalized) {
      toast.error('Cannot send to review row with validation errors')
      return
    }

    setIsReviewingSingle(true)
    try {
      // Create a copy with Review status
      const reviewPrompt = {
        ...row.normalized,
        status: 'Review' as const
      }

      const results = await bulkCreatePrompts([reviewPrompt])
      const result = results[0]

      if (result.success) {
        toast.success(`Successfully sent "${reviewPrompt.title}" to review`)
        
        // Remove from state and update database
        const updatedData = uploadedData.filter(r => r.id !== rowId)
        setUploadedData(updatedData)
        setPreviewRow(null)
        setSelectedRows(prev => {
          const next = new Set(prev)
          next.delete(rowId)
          return next
        })

        // Update database drafts
        try {
          await saveBulkUploadDrafts(
            updatedData.map(r => ({
              data: r.data,
              normalized: r.normalized,
              validationErrors: r.validationErrors,
              imageRatio: r.imageRatio,
              isDetectingRatio: r.isDetectingRatio,
            }))
          )
        } catch (err) {
          console.warn('Failed to update drafts after sending to review:', err)
        }

        // Refresh categories
        try {
          const updatedCategories = await fetchUniqueCategories()
          setValidCategories(updatedCategories)
        } catch (err) {
          console.warn('Failed to refresh categories:', err)
        }
      } else {
        toast.error(`Failed to send to review: ${result.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      console.error('Error sending to review:', err)
      toast.error(`Failed to send to review: ${err.message}`)
    } finally {
      setIsReviewingSingle(false)
    }
  }

  const handleDeleteSelected = () => {
    setUploadedData(prev => prev.filter(row => !selectedRows.has(row.id)))
    setSelectedRows(new Set())
  }

  const handleToggleSelect = (rowId: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        next.add(rowId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const validRows = uploadedData.filter(row => row.normalized !== null)
    if (selectedRows.size === validRows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(validRows.map(row => row.id)))
    }
  }

  const handlePublish = async (publishAll: boolean = false) => {
    const rowsToPublish = publishAll
      ? uploadedData.filter(row => row.normalized !== null)
      : uploadedData.filter(row => selectedRows.has(row.id) && row.normalized !== null)

    if (rowsToPublish.length === 0) {
      toast.error('No valid prompts to publish')
      return
    }

    setIsPublishing(true)
    setPublishResults(null)

    try {
      const promptsToPublish = rowsToPublish.map(row => row.normalized!).filter(Boolean)
      const results = await bulkCreatePrompts(promptsToPublish)

      setPublishResults(results)

      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length

      if (successCount > 0) {
        toast.success(`Successfully published ${successCount} prompt(s)`)
      }
      if (failureCount > 0) {
        toast.error(`Failed to publish ${failureCount} prompt(s)`)
      }

      // Remove successfully published items and update database
      const successfulIds = new Set(
        results.filter(r => r.success).map(r => rowsToPublish[r.index]?.id).filter(Boolean)
      )
      const updatedData = uploadedData.filter(row => !successfulIds.has(row.id))
      setUploadedData(updatedData)
      setSelectedRows(new Set())

      // Update database drafts (remove published items)
      if (successfulIds.size > 0) {
        try {
          await saveBulkUploadDrafts(
            updatedData.map(row => ({
              data: row.data,
              normalized: row.normalized,
              validationErrors: row.validationErrors,
              imageRatio: row.imageRatio,
              isDetectingRatio: row.isDetectingRatio,
            }))
          )
        } catch (err) {
          console.warn('Failed to update drafts after publishing:', err)
        }
      }

      // Refresh categories list to include any new categories that were created
      if (successCount > 0) {
        try {
          const updatedCategories = await fetchUniqueCategories()
          setValidCategories(updatedCategories)
        } catch (err) {
          console.warn('Failed to refresh categories:', err)
        }
      }
    } catch (err: any) {
      console.error('Error publishing prompts:', err)
      toast.error(`Failed to publish prompts: ${err.message}`)
    } finally {
      setIsPublishing(false)
    }
  }

  const validRows = uploadedData.filter(row => row.normalized !== null)
  const invalidRows = uploadedData.filter(row => row.normalized === null)
  const allSelected = validRows.length > 0 && selectedRows.size === validRows.length

  if (isLoadingDrafts) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0c0c0e] p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading drafts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0c0e] p-6">
      <div className="max-w-[95%] xl:max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Bulk Upload Prompts
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Upload JSON or CSV files to import multiple prompts at once. Data is saved temporarily and will be published directly to the prompts table.
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-8 p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragging
              ? 'border-[#FFDE1A] bg-[#FFDE1A]/10 dark:bg-[#FFDE1A]/20 scale-105'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-[#FFDE1A] hover:bg-zinc-50 dark:hover:bg-white/5'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            {isUploading ? (
              <div className="w-12 h-12 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin mb-4" />
            ) : (
              <CloudArrowUpIcon className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-4" />
            )}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              {isUploading ? 'Processing file...' : 'Drop files here or click to upload'}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Supports JSON and CSV files (max 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,application/json,text/csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </div>

        {/* Data Preview Table */}
        {uploadedData.length > 0 && (
          <div className="bg-white dark:bg-[#0c0c0e] rounded-xl border border-zinc-200 dark:border-white/10 shadow-lg overflow-hidden">
            {/* Action Bar */}
            <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-[#FFDE1A] focus:ring-[#FFDE1A]"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Select All ({validRows.length} valid)
                  </span>
                </label>
                {selectedRows.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete Selected ({selectedRows.size})
                  </button>
                )}
                {uploadedData.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePublish(false)}
                  disabled={selectedRows.size === 0 || isPublishing}
                  className="px-4 py-2 bg-[#FFDE1A] text-black font-semibold rounded-lg hover:bg-[#ffe64d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPublishing ? 'Publishing...' : `Publish Selected (${selectedRows.size})`}
                </button>
                <button
                  onClick={() => handlePublish(true)}
                  disabled={validRows.length === 0 || isPublishing}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPublishing ? 'Publishing...' : `Publish All (${validRows.length})`}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-black/50 border-b border-zinc-200 dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-[#FFDE1A] focus:ring-[#FFDE1A]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Errors
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider w-20">
                      Preview
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                  {uploadedData.map((row) => {
                    const isValid = row.normalized !== null
                    const isSelected = selectedRows.has(row.id)

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-zinc-50 dark:hover:bg-black/30 transition-colors ${
                          !isValid ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(row.id)}
                            disabled={!isValid}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-[#FFDE1A] focus:ring-[#FFDE1A] disabled:opacity-30"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900 dark:text-white">
                            {row.data.title || <span className="text-zinc-400 italic">No title</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                          {row.data.category || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.data.tags && Array.isArray(row.data.tags) && row.data.tags.length > 0 ? (
                              row.data.tags.slice(0, 3).map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-zinc-400 text-xs">-</span>
                            )}
                            {row.data.tags && Array.isArray(row.data.tags) && row.data.tags.length > 3 && (
                              <span className="text-zinc-400 text-xs">+{row.data.tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {row.data.status === 'draft' ? 'Draft' : (row.data.status || 'Draft')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.validationErrors.length > 0 ? (
                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <ExclamationTriangleIcon className="w-4 h-4" />
                              <span className="text-xs">{row.validationErrors.length} error(s)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircleIcon className="w-4 h-4" />
                              <span className="text-xs">Valid</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handlePreviewRow(row.id)}
                            disabled={!isValid}
                            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-[#FFDE1A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Preview"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditRow(row.id)}
                              disabled={!isValid}
                              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-[#FFDE1A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Edit"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="p-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Total: <strong className="text-zinc-900 dark:text-white">{uploadedData.length}</strong>
                  </span>
                  <span className="text-green-600 dark:text-green-400">
                    Valid: <strong>{validRows.length}</strong>
                  </span>
                  {invalidRows.length > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      Invalid: <strong>{invalidRows.length}</strong>
                    </span>
                  )}
                </div>
                {publishResults && (
                  <div className="text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      Published: {publishResults.filter(r => r.success).length}
                    </span>
                    {publishResults.some(r => !r.success) && (
                      <span className="text-red-600 dark:text-red-400 ml-4">
                        Failed: {publishResults.filter(r => !r.success).length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors Detail Modal */}
        {uploadedData.some(row => row.validationErrors.length > 0) && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">Validation Errors</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadedData.map((row) => {
                if (row.validationErrors.length === 0) return null
                return (
                  <div key={row.id} className="text-sm">
                    <strong className="text-red-800 dark:text-red-300">
                      {row.data.title || `Row ${uploadedData.indexOf(row) + 1}`}:
                    </strong>
                    <ul className="list-disc list-inside ml-2 text-red-700 dark:text-red-400">
                      {row.validationErrors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewRow && (
        <PromptPreviewModal
          isOpen={!!previewRow}
          onClose={() => setPreviewRow(null)}
          rowData={uploadedData.find(r => r.id === previewRow)}
          onPublish={() => handlePublishSingle(previewRow!)}
          onDelete={() => handleDeleteSingle(previewRow!)}
          onReview={() => handleReviewSingle(previewRow!)}
          isPublishing={isPublishingSingle}
          isDeleting={isDeletingSingle}
          isReviewing={isReviewingSingle}
        />
      )}

      {/* Edit Modal */}
      {editingRow && (
        <BulkEditModal
          isOpen={!!editingRow}
          onClose={() => {
            setEditingRow(null)
          }}
          rowData={uploadedData.find(r => r.id === editingRow)}
          validCategories={validCategories}
          onSave={(updatedData) => handleUpdateRow(editingRow, updatedData)}
        />
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Clear All Data?</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                Are you sure you want to clear all {uploadedData.length} uploaded prompt(s)? This will permanently delete all data from the temporary storage.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-95 transition-colors"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Prompt Preview Modal Component
interface PromptPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  rowData: BulkPromptData | undefined
  onPublish: () => void
  onDelete: () => void
  onReview: () => void
  isPublishing: boolean
  isDeleting: boolean
  isReviewing: boolean
}

function PromptPreviewModal({ 
  isOpen, 
  onClose, 
  rowData, 
  onPublish, 
  onDelete,
  onReview,
  isPublishing, 
  isDeleting,
  isReviewing
}: PromptPreviewModalProps) {
  if (!isOpen || !rowData || !rowData.normalized) return null

  const prompt = rowData.normalized

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-white/10">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Prompt Preview</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Preview how this prompt will appear</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Card */}
        <div className="p-6">
          <div className="group relative flex flex-col">
            {/* Visual Component - The Image */}
            <div
              className={`relative ${getAspectRatioClass(prompt.image_ratio)} overflow-hidden border-2 border-black dark:border-white rounded-t-xl bg-gray-100 dark:bg-zinc-800`}
            >
              <img
                src={prompt.preview_image_url || 'https://placehold.co/400x400/1a1a1a/F8BE00?text=AI+Prompt'}
                alt={prompt.title}
                className="w-full h-full object-cover"
              />

              {/* Category Tag */}
              <div className="absolute top-3 left-3 z-20">
                <span className="bg-[#F8BE00] border-2 border-black text-black text-xs font-bold px-3 py-1 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {prompt.category}
                </span>
              </div>
            </div>

            {/* Info Component - The Details */}
            <div className="flex flex-col flex-grow bg-white dark:bg-black border-2 border-t-0 border-black dark:border-white rounded-b-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              {/* Header Section */}
              <div className="p-4 bg-white dark:bg-zinc-900 border-b border-black/10 dark:border-white/10">
                <h3 className="font-display font-bold text-xl leading-tight text-black dark:text-white line-clamp-2">
                  {prompt.title}
                </h3>
              </div>

              {/* Prompt Content */}
              <div className="p-4 flex-grow bg-gray-50 dark:bg-zinc-950">
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#F8BE00] opacity-50"></div>
                  <p className="pl-3 text-sm font-mono text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4">
                    {prompt.prompt}
                  </p>
                </div>

                {/* Tags */}
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {prompt.tags.slice(0, 5).map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500"
                      >
                        #{tag}
                      </span>
                    ))}
                    {prompt.tags.length > 5 && (
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                        +{prompt.tags.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                {/* Rating Placeholder */}
                <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium">No ratings yet</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex border-t-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white">
                <button
                  onClick={onDelete}
                  disabled={isDeleting || isPublishing || isReviewing}
                  className="flex-1 py-3 px-4 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-widest"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
                <button
                  onClick={onReview}
                  disabled={isReviewing || isPublishing || isDeleting}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-widest"
                >
                  {isReviewing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Review</span>
                  )}
                </button>
                <button
                  onClick={onPublish}
                  disabled={isPublishing || isDeleting || isReviewing}
                  className="flex-1 py-3 px-4 bg-[#FFDE1A] text-black hover:bg-[#ffe64d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-widest"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Bulk Edit Modal Component
interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  rowData: BulkPromptData | undefined
  validCategories: string[]
  onSave: (data: any) => void
}

function BulkEditModal({ isOpen, onClose, rowData, validCategories, onSave }: BulkEditModalProps) {
  const [formData, setFormData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  useEffect(() => {
    if (rowData && isOpen) {
      setFormData({ ...rowData.data })
      setImageError(null)
    }
  }, [rowData, isOpen])

  if (!isOpen || !rowData || !formData) return null

  const handleImageUpload = async (file: File) => {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!validImageTypes.includes(file.type)) {
      setImageError('Please upload a valid image file (JPEG, PNG, WebP, GIF, or SVG)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image is too large. Maximum size is 5MB.')
      return
    }

    setIsUploadingImage(true)
    setImageError(null)

    try {
      if (!isSupabaseReady()) {
        throw new Error('Supabase is not configured.')
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `admin-uploads/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prompt-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      if (uploadError) throw uploadError
      if (!uploadData) throw new Error('Upload failed: No data returned')

      const { data: urlData } = supabase.storage.from('prompt-images').getPublicUrl(filePath)
      if (!urlData?.publicUrl) throw new Error('Failed to get image URL')

      // Auto-detect image ratio
      const detectedRatio = await detectImageRatioFromSource(file)
      
      setFormData((prev: any) => ({
        ...prev,
        preview_image_url: urlData.publicUrl,
        preview_image: urlData.publicUrl,
        image_ratio: detectedRatio
      }))
      toast.success('Image uploaded successfully')
    } catch (err: any) {
      const errorMessage = err?.message || err?.error || 'Unknown error'
      setImageError(errorMessage)
      toast.error(`Failed to upload image: ${errorMessage}`)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    // Reset input so same file can be selected again
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingImage(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingImage(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingImage(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    } else {
      setImageError('Please drop a valid image file')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Re-validate
      const errors = validateBulkPrompt(formData, validCategories)
      if (errors.length > 0) {
        toast.error('Please fix validation errors before saving')
        setIsSaving(false)
        return
      }

      onSave(formData)
      toast.success('Row updated successfully')
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-[#0c0c0e] z-10 pb-4 border-b border-zinc-100 dark:border-white/5">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Prompt</h2>
              <p className="text-sm text-zinc-500">Update prompt details</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Title *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category *</label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                required
              >
                <option value="">Select category</option>
                {validCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Prompt *</label>
            <textarea
              value={formData.prompt || ''}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50 min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Negative Prompt</label>
            <textarea
              value={formData.negative_prompt || ''}
              onChange={(e) => setFormData({ ...formData, negative_prompt: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50 min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tags (comma separated)</label>
            <input
              type="text"
              value={Array.isArray(formData.tags) ? formData.tags.join(', ') : (formData.tags || '')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                setFormData({ ...formData, tags })
              }}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Preview Image</label>
            
            {/* Image Upload Area with Preview */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => imageInputRef.current?.click()}
              className={`relative p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                isDraggingImage
                  ? 'border-[#FFDE1A] bg-[#FFDE1A]/10 dark:bg-[#FFDE1A]/20 scale-[1.02]'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-[#FFDE1A] bg-zinc-50/50 dark:bg-zinc-900/30'
              } ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {formData.preview_image_url || formData.preview_image ? (
                <div className="relative w-full aspect-video bg-black/5 overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-md group">
                  <img
                    src={formData.preview_image_url || formData.preview_image}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      setImageError('Failed to load image from URL')
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-white font-bold">
                      {isUploadingImage ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpTrayIcon className="w-5 h-5" />
                          <span>Change Image</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center gap-4">
                  <div className={`w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center transition-transform ${
                    isDraggingImage ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    {isUploadingImage ? (
                      <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <PhotoIcon className={`w-8 h-8 transition-colors ${
                        isDraggingImage ? 'text-[#FFDE1A]' : 'text-zinc-400 group-hover:text-[#FFDE1A]'
                      }`} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className={`font-bold transition-colors ${
                      isDraggingImage ? 'text-[#FFDE1A]' : 'text-zinc-900 dark:text-white'
                    }`}>
                      {isDraggingImage ? 'Drop Image Here' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-zinc-500">SVG, PNG, JPG, WebP or GIF (max. 5MB)</p>
                  </div>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Image Error Message */}
            {imageError && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                {imageError}
              </div>
            )}

            {/* URL Input (Alternative) */}
            <div className="flex items-center gap-4 mt-2">
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
              <span className="text-xs uppercase text-zinc-400 font-bold">OR</span>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
            </div>
            <input
              type="url"
              value={formData.preview_image_url || formData.preview_image || ''}
              onChange={(e) => {
                setFormData({ ...formData, preview_image_url: e.target.value, preview_image: e.target.value })
                setImageError(null)
              }}
              placeholder="Paste direct image URL..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Attribution</label>
              <input
                type="text"
                value={formData.attribution || ''}
                onChange={(e) => setFormData({ ...formData, attribution: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Attribution Link</label>
              <input
                type="url"
                value={formData.attribution_link || ''}
                onChange={(e) => setFormData({ ...formData, attribution_link: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#FFDE1A] text-black text-sm font-semibold shadow-[0_0_15px_-5px_#FFDE1A] hover:bg-[#ffe64d] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

