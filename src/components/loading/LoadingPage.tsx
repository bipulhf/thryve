"use client";
import { motion } from "framer-motion";
import { Loader } from "@/components/ui/loader";

interface LoadingPageProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingPage({
  message = "Loading...",
  fullScreen = true,
}: LoadingPageProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const contentVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const textVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const LoadingContent = () => (
    <div className="flex flex-col items-center justify-center space-y-6">
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        transition={{
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
          delay: 0.2,
        }}
      >
        <Loader size="xl" />
      </motion.div>

      <motion.div
        variants={textVariants}
        initial="hidden"
        animate="visible"
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1],
          delay: 0.5,
        }}
        className="text-center space-y-2"
      >
        <h2 className="text-xl font-semibold" style={{ color: "#2d2d2b" }}>
          {message}
        </h2>
        <p className="text-sm text-black/60 max-w-xs">
          Getting everything ready for you...
        </p>
      </motion.div>

      {/* Animated dots */}
      <motion.div className="flex space-x-1" initial="hidden" animate="visible">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#ec9347" }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <LoadingContent />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="flex items-center justify-center min-h-[200px]"
    >
      <LoadingContent />
    </motion.div>
  );
}
