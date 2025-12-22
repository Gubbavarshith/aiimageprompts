import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    Plus, Search, Eye, Edit2, Trash2, X,
    ChevronLeft, ChevronRight, Loader2, AlertCircle,
    CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    fetchAllBlogPosts,
    deleteBlogPost,
    updateBlogPost,
    getBlogCategories,
    formatDate,
    type BlogPost
} from '@/lib/services/blogs'
import { useToast } from '@/contexts/ToastContext'

const POSTS_PER_PAGE = 10

export default function AdminBlogListPage() {
    const navigate = useNavigate()
    const toast = useToast()

    // Data state
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filter/search state
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('All Categories')
    const [statusFilter, setStatusFilter] = useState<string>('All Status')

    // Selection state
    const [selectedPosts, setSelectedPosts] = useState<string[]>([])
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)

    // Load posts
    useEffect(() => {
        const loadPosts = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const data = await fetchAllBlogPosts()
                setPosts(data)
            } catch (err) {
                console.error('Error loading posts:', err)
                setError('Failed to load blog posts')
                toast.error('Failed to load blog posts')
            } finally {
                setIsLoading(false)
            }
        }

        loadPosts()
    }, [toast])

    // Get available categories
    const availableCategories = useMemo(() => {
        const categories = getBlogCategories(posts)
        return ['All Categories', ...categories.sort()]
    }, [posts])

    // Filter posts
    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesSearch = searchQuery === '' ||
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

            const matchesCategory = categoryFilter === 'All Categories' || post.category === categoryFilter
            const matchesStatus = statusFilter === 'All Status' || post.status === statusFilter

            return matchesSearch && matchesCategory && matchesStatus
        })
    }, [posts, searchQuery, categoryFilter, statusFilter])

    // Pagination
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
    const paginatedPosts = useMemo(() => {
        const startIndex = (currentPage - 1) * POSTS_PER_PAGE
        return filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE)
    }, [filteredPosts, currentPage])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, categoryFilter, statusFilter])

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedPosts.length === paginatedPosts.length) {
            setSelectedPosts([])
        } else {
            setSelectedPosts(paginatedPosts.map(post => post.id))
        }
    }

    const toggleSelectPost = (id: string) => {
        if (selectedPosts.includes(id)) {
            setSelectedPosts(selectedPosts.filter(postId => postId !== id))
        } else {
            setSelectedPosts([...selectedPosts, id])
        }
    }


    // Status color helper
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Published': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            case 'Draft': return 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400'
            case 'Scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    // Action handlers
    const handleView = (post: BlogPost) => {
        if (post.status === 'Published' && post.slug) {
            window.open(`/blog/${post.slug}`, '_blank')
        } else {
            toast.info('Post must be published to view')
        }
    }

    const handleEdit = (postId: string) => {
        navigate(`/admin/blogs/${postId}`)
    }

    const handleDelete = async (postId: string, postTitle: string) => {
        if (!confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
            return
        }

        setDeletingPostId(postId)
        try {
            await deleteBlogPost(postId)
            setPosts(posts.filter(p => p.id !== postId))
            setSelectedPosts(selectedPosts.filter(id => id !== postId))
            toast.success('Post deleted successfully')
        } catch (err) {
            console.error('Error deleting post:', err)
            toast.error('Failed to delete post')
        } finally {
            setDeletingPostId(null)
        }
    }

    // Bulk actions
    const handleBulkDelete = async () => {
        if (selectedPosts.length === 0) {
            toast.error('No posts selected')
            return
        }

        if (!confirm(`Are you sure you want to delete ${selectedPosts.length} post(s)? This action cannot be undone.`)) {
            return
        }

        try {
            for (const postId of selectedPosts) {
                await deleteBlogPost(postId)
            }
            setPosts(posts.filter(p => !selectedPosts.includes(p.id)))
            setSelectedPosts([])
            toast.success(`Deleted ${selectedPosts.length} post(s) successfully`)
        } catch (err) {
            console.error('Error bulk deleting posts:', err)
            toast.error('Failed to delete some posts')
        }
    }

    const handleBulkStatusChange = async (newStatus: 'Published' | 'Draft' | 'Scheduled') => {
        if (selectedPosts.length === 0) {
            toast.error('No posts selected')
            return
        }

        try {
            const updatePromises = selectedPosts.map(postId => {
                const post = posts.find(p => p.id === postId)
                if (!post) return Promise.resolve()
                return updateBlogPost({ id: postId, status: newStatus })
            })

            await Promise.all(updatePromises)

            // Reload posts to get updated data
            const updatedPosts = await fetchAllBlogPosts()
            setPosts(updatedPosts)
            setSelectedPosts([])
            toast.success(`Updated ${selectedPosts.length} post(s) to ${newStatus}`)
        } catch (err) {
            console.error('Error bulk updating posts:', err)
            toast.error('Failed to update some posts')
        }
    }

    // Pagination handlers
    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    }

    const goToPreviousPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1))
    }

    const goToNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1))
    }

    // Clear filters
    const clearFilters = () => {
        setSearchQuery('')
        setCategoryFilter('All Categories')
        setStatusFilter('All Status')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FFDE1A]" />
                    <p className="text-sm text-zinc-500">Loading blog posts...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Blog Posts</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Manage and organize your blog content. {posts.length} total post(s).
                    </p>
                </div>
                <Link to="/admin/blogs/new">
                    <Button className="bg-[#FFDE1A] text-black hover:bg-[#F8BE00] font-bold">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Post
                    </Button>
                </Link>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Bulk Actions Bar */}
            {selectedPosts.length > 0 && (
                <Card className="p-4 border-[#FFDE1A] bg-[#FFDE1A]/10 dark:bg-[#FFDE1A]/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#FFDE1A]" />
                            <span className="font-bold text-zinc-900 dark:text-white">
                                {selectedPosts.length} post(s) selected
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkStatusChange('Published')}
                            >
                                Publish
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkStatusChange('Draft')}
                            >
                                Draft
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkStatusChange('Scheduled')}
                            >
                                Schedule
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPosts([])}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Filters & Search - Card Style */}
            <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search posts..."
                            className="w-full pl-10 pr-10 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]"
                        >
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]"
                        >
                            <option value="All Status">All Status</option>
                            <option value="Published">Published</option>
                            <option value="Draft">Draft</option>
                            <option value="Scheduled">Scheduled</option>
                        </select>
                        {(searchQuery || categoryFilter !== 'All Categories' || statusFilter !== 'All Status') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Table */}
            {filteredPosts.length === 0 ? (
                <Card className="p-12 text-center border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Search className="w-8 h-8 text-zinc-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No posts found</h3>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                {searchQuery || categoryFilter !== 'All Categories' || statusFilter !== 'All Status'
                                    ? 'Try adjusting your filters or search query.'
                                    : 'Get started by creating your first blog post.'}
                            </p>
                        </div>
                        {(searchQuery || categoryFilter !== 'All Categories' || statusFilter !== 'All Status') && (
                            <Button variant="outline" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="p-4 w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedPosts.length === paginatedPosts.length && paginatedPosts.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-zinc-300 text-[#FFDE1A] focus:ring-[#FFDE1A]"
                                        />
                                    </th>
                                    <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Post</th>
                                    <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Author</th>
                                    <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Category</th>
                                    <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                                    <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Date</th>
                                    <th className="p-4 w-12 text-right font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {paginatedPosts.map((post) => (
                                    <tr
                                        key={post.id}
                                        className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedPosts.includes(post.id)}
                                                onChange={() => toggleSelectPost(post.id)}
                                                className="rounded border-zinc-300 text-[#FFDE1A] focus:ring-[#FFDE1A]"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                                                    {post.imageUrl ? (
                                                        <img
                                                            src={post.imageUrl}
                                                            alt={post.title}
                                                            width="48"
                                                            height="48"
                                                            decoding="async"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none'
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-zinc-900 dark:text-white truncate max-w-[200px]">
                                                        {post.title}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 truncate">
                                                        {post.slug || `ID: ${post.id}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold">
                                                    {post.author.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-zinc-600 dark:text-zinc-300">{post.author}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                                                {post.category}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-zinc-500 text-sm">
                                            {formatDate(post.date)}
                                        </td>
                                        <td className="p-4 text-right">
                                            {/* Hover Actions */}
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleView(post)}
                                                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-blue-600 transition-colors"
                                                    title="View Post"
                                                    disabled={post.status !== 'Published'}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(post.id)}
                                                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-[#F8BE00] transition-colors"
                                                    title="Edit Post"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id, post.title)}
                                                    disabled={deletingPostId === post.id}
                                                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                                    title="Delete Post"
                                                >
                                                    {deletingPostId === post.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
                            <p className="text-sm text-zinc-500">
                                Showing {paginatedPosts.length > 0 ? (currentPage - 1) * POSTS_PER_PAGE + 1 : 0} - {Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length)} of {filteredPosts.length} post(s)
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum: number
                                        if (totalPages <= 5) {
                                            pageNum = i + 1
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i
                                        } else {
                                            pageNum = currentPage - 2 + i
                                        }
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => goToPage(pageNum)}
                                                className={currentPage === pageNum ? "bg-[#FFDE1A] text-black hover:bg-[#F8BE00]" : ""}
                                            >
                                                {pageNum}
                                            </Button>
                                        )
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
