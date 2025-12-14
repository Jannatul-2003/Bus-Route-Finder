"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useHelpfulInteraction } from "@/hooks/useHelpfulInteraction"

interface HelpfulButtonProps {
  postId: string
  initialCount: number
  className?: string
  variant?: "default" | "compact"
  onClick?: (e: React.MouseEvent) => void
}

export function HelpfulButton({ 
  postId, 
  initialCount, 
  className,
  variant = "default",
  onClick 
}: HelpfulButtonProps) {
  const { 
    isHelpful, 
    helpfulCount, 
    isLoading, 
    error, 
    toggleHelpful, 
    canInteract 
  } = useHelpfulInteraction(postId, initialCount)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering parent click handlers
    
    if (onClick) {
      onClick(e)
    }
    
    if (canInteract && !isLoading) {
      await toggleHelpful()
    }
  }

  if (variant === "compact") {
    return (
      <div 
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
          isHelpful 
            ? "bg-accent/20 text-accent-foreground" 
            : "bg-muted/50 hover:bg-accent/10",
          canInteract && !isLoading && "cursor-pointer",
          className
        )}
        onClick={handleClick}
        title={canInteract ? (isHelpful ? "Remove helpful mark" : "Mark as helpful") : "Login to mark as helpful"}
      >
        <svg 
          className={cn(
            "size-4 transition-colors",
            isHelpful ? "text-accent-foreground fill-current" : "text-accent-foreground",
            isLoading && "animate-pulse"
          )} 
          fill={isHelpful ? "currentColor" : "none"} 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
          />
        </svg>
        <span className="text-sm font-medium text-foreground">
          {helpfulCount}
        </span>
        {isLoading && (
          <div className="size-3 border border-current border-t-transparent rounded-full animate-spin opacity-50" />
        )}
      </div>
    )
  }

  return (
    <Button
      variant={isHelpful ? "default" : "outline"}
      size="sm"
      className={cn(
        "flex items-center gap-2 transition-all duration-200",
        isHelpful && "bg-accent hover:bg-accent/90 text-accent-foreground",
        !canInteract && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      disabled={!canInteract || isLoading}
      title={canInteract ? (isHelpful ? "Remove helpful mark" : "Mark as helpful") : "Login to mark as helpful"}
    >
      <svg 
        className={cn(
          "size-4 transition-all duration-200",
          isHelpful && "fill-current",
          isLoading && "animate-pulse"
        )} 
        fill={isHelpful ? "currentColor" : "none"} 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
        />
      </svg>
      <span className="font-medium">
        {isHelpful ? "Helpful" : "Mark Helpful"} ({helpfulCount})
      </span>
      {isLoading && (
        <div className="size-3 border border-current border-t-transparent rounded-full animate-spin" />
      )}
    </Button>
  )
}