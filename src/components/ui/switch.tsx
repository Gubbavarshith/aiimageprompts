"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwitchProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    className?: string;
}

const Switch = ({ checked = false, onCheckedChange, className }: SwitchProps) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange?.(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                // Track styling
                "bg-zinc-950",
                checked
                    ? "border-[#FFDE1A] shadow-[0_0_12px_rgba(255,222,26,0.4)]"
                    : "border-zinc-700 dark:border-zinc-800",
                className
            )}
        >
            {/* Inner Glow/Reflection Effect */}
            <motion.div
                className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                initial={false}
            >
                <motion.div
                    className="absolute top-0 bottom-0 w-1/2 bg-[#FFDE1A]/20 blur-xl"
                    animate={{
                        x: checked ? "100%" : "-50%",
                        opacity: checked ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>

            <motion.span
                className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-colors duration-300",
                    checked
                        ? "bg-[#FFDE1A] shadow-[0_0_8px_rgba(255,222,26,0.6)]"
                        : "bg-zinc-400"
                )}
                animate={{
                    x: checked ? 22 : 2,
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                }}
            />
        </button>
    );
};

export default Switch;
