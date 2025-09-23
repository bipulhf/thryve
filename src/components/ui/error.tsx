"use client";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Home, X } from "lucide-react";

interface ErrorProps {
  title?: string;
  message?: string;
  variant?: "page" | "inline" | "toast";
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function Error({
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again.",
  variant = "page",
  showRetry = true,
  showHome = false,
  onRetry,
  onDismiss,
  className = "",
}: ErrorProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { scale: 1, rotate: 0 },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const ErrorContent = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="text-center space-y-4"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold" style={{ color: "#2d2d2b" }}>
          {title}
        </h2>
        <p className="text-sm text-black/60 max-w-md mx-auto">{message}</p>
      </div>

      {(showRetry || showHome) && (
        <motion.div
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.3,
          }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          {showRetry && (
            <motion.button
              onClick={onRetry}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full text-white text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
              style={{ backgroundColor: "#ec9347" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </motion.button>
          )}

          {showHome && (
            <motion.button
              onClick={() => (window.location.href = "/")}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-black/20 text-sm font-medium hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
              style={{ color: "#2d2d2b" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  if (variant === "toast") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        className={`bg-white border border-red-200 rounded-lg shadow-lg p-4 max-w-sm ${className}`}
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium" style={{ color: "#2d2d2b" }}>
              {title}
            </h4>
            <p className="text-sm text-black/60 mt-1">{message}</p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-black/40 hover:text-black/60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={`flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}
      >
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: "#2d2d2b" }}>
            {title}
          </p>
          <p className="text-xs text-red-600 mt-1">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Default: page variant
  return (
    <div
      className={`flex items-center justify-center min-h-[400px] ${className}`}
    >
      <ErrorContent />
    </div>
  );
}
