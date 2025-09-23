"use client";
import { motion } from "framer-motion";
import { Error } from "@/components/ui/error";

interface ErrorPageProps {
  title?: string;
  message?: string;
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
  statusCode?: number;
  fullScreen?: boolean;
}

export function ErrorPage({
  title,
  message,
  showRetry = true,
  showHome = true,
  onRetry,
  statusCode,
  fullScreen = true,
}: ErrorPageProps) {
  const getDefaultContent = () => {
    switch (statusCode) {
      case 404:
        return {
          title: "Page Not Found",
          message:
            "The page you're looking for doesn't exist or has been moved.",
        };
      case 500:
        return {
          title: "Server Error",
          message: "Something went wrong on our end. We're working to fix it.",
        };
      case 403:
        return {
          title: "Access Denied",
          message: "You don't have permission to access this resource.",
        };
      default:
        return {
          title: "Something went wrong",
          message: "We encountered an unexpected error. Please try again.",
        };
    }
  };

  const defaultContent = getDefaultContent();
  const finalTitle = title || defaultContent.title;
  const finalMessage = message || defaultContent.message;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
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
      className="flex flex-col items-center justify-center space-y-4"
    >
      {/* Status Code Display */}
      {statusCode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.6,
            ease: [0.68, -0.55, 0.265, 1.55],
            delay: 0.2,
          }}
          className="relative"
        >
          <div
            className="text-8xl font-bold opacity-10"
            style={{ color: "#2d2d2b" }}
          >
            {statusCode}
          </div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.05, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="text-8xl font-bold" style={{ color: "#2d2d2b" }}>
              {statusCode}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Error Component */}
      <Error
        title={finalTitle}
        message={finalMessage}
        variant="page"
        showRetry={showRetry}
        showHome={showHome}
        onRetry={onRetry}
      />
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <ErrorContent />
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <ErrorContent />
    </div>
  );
}
