import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Legend
} from 'recharts'
import { motion } from 'framer-motion'
import { PromptAnalyticsData, ChartPeriod } from '@/lib/services/promptAnalytics'

interface PromptAnalyticsChartProps {
    data: PromptAnalyticsData[]
    isLoading: boolean
    period: ChartPeriod | string
    onPeriodChange: (period: string) => void
    showCustomDatePicker?: boolean
    customStartDate?: string
    customEndDate?: string
    onCustomDateChange?: (start: string, end: string) => void
    onCustomDateApply?: () => void
    onCustomDateCancel?: () => void
    setShowCustomDatePicker?: (show: boolean) => void
}

export const PromptAnalyticsChart = ({
    data,
    isLoading,
    period,
    onPeriodChange,
    showCustomDatePicker,
    customStartDate,
    customEndDate,
    onCustomDateChange,
    onCustomDateApply,
    onCustomDateCancel,
    setShowCustomDatePicker
}: PromptAnalyticsChartProps) => {

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl">
                    <p className="font-semibold text-sm mb-2 text-zinc-500 dark:text-zinc-400">
                        {label}
                    </p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm font-medium mb-1 last:mb-0">
                            <span
                                className="w-2 h-2 rounded-full block"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-zinc-700 dark:text-zinc-300">
                                {entry.name === 'userSubmitted' ? 'User Submissions' : 'Admin Created'}:
                            </span>
                            <span className="ml-auto font-bold text-zinc-900 dark:text-white">
                                {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    // Totals removed - not currently used in the component

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                        Prompt Creation Analytics
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Overview of contribution sources
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {showCustomDatePicker ? (
                        <div className="flex flex-wrap items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => onCustomDateChange?.(e.target.value, customEndDate || '')}
                                className="bg-transparent text-xs font-medium text-zinc-900 dark:text-white outline-none border-none p-2 rounded focus:bg-white dark:focus:bg-zinc-800"
                                max={customEndDate || undefined}
                            />
                            <span className="text-zinc-400 text-xs">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => onCustomDateChange?.(customStartDate || '', e.target.value)}
                                className="bg-transparent text-xs font-medium text-zinc-900 dark:text-white outline-none border-none p-2 rounded focus:bg-white dark:focus:bg-zinc-800"
                                min={customStartDate || undefined}
                                max={new Date().toISOString().split('T')[0]}
                            />
                            <div className="flex gap-1 ml-2">
                                <button
                                    onClick={onCustomDateApply}
                                    className="px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                                    disabled={!customStartDate || !customEndDate}
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={onCustomDateCancel}
                                    className="px-3 py-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {typeof period === 'object' && (
                                <button
                                    onClick={() => setShowCustomDatePicker?.(true)}
                                    className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                                >
                                    {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                                </button>
                            )}
                            <div className="relative">
                                <select
                                    value={typeof period === 'object' ? 'custom' : period}
                                    onChange={(e) => onPeriodChange(e.target.value)}
                                    className="appearance-none bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 pl-4 pr-10 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.98] transition-all cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    <option value="7days">Last 7 days</option>
                                    <option value="30days">Last 30 days</option>
                                    <option value="3months">Last 3 months</option>
                                    <option value="6months">Last 6 months</option>
                                    <option value="year">This Year</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-[400px] w-full">
                {isLoading ? (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-zinc-400">
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-blue-500 animate-spin" />
                        <span className="text-sm font-medium">Loading analytics...</span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-full w-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        <span className="text-sm font-medium">No data available for this period</span>
                        <span className="text-xs mt-1 opacity-75">Try selecting a different date range</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradientAdmin" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradientUser" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                            <XAxis
                                dataKey="label"
                                stroke="#A1A1AA"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={16}
                            />
                            <YAxis
                                stroke="#A1A1AA"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                                tickMargin={16}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#A1A1AA', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '24px' }}
                                formatter={(value) => <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-2">{value === 'userSubmitted' ? 'User Submissions' : 'Admin Created'}</span>}
                            />

                            <Area
                                type="monotone"
                                dataKey="adminCreated"
                                name="adminCreated"
                                stackId="1"
                                stroke="#F97316"
                                strokeWidth={3}
                                fill="url(#gradientAdmin)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#F97316' }}
                                animationDuration={1000}
                            />

                            <Area
                                type="monotone"
                                dataKey="userSubmitted"
                                name="userSubmitted"
                                stackId="1"
                                stroke="#8B5CF6"
                                strokeWidth={3}
                                fill="url(#gradientUser)"
                                animationDuration={1000}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#8B5CF6' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    )
}
