import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from './ui/utils';
import { Button } from './ui/button';

interface NotificationToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose: () => void;
}

/**
 * NotificationToast: Custom toast notification component (Hybrid version)
 * Combines smooth animations with ShadCN Button component
 * Features: slide animations, CSS class approach, accessibility
 */
export function NotificationToast({
  type,
  message,
  onClose,
}: NotificationToastProps) {
  // ✅ Animation state management
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  // ✅ Smooth exit animation
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  // ✅ Icon mapping approach (cleaner than switch)
  const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const IconComponent = iconMap[type];

  return (
    <div
      className={cn(
        `notification-toast notification-${type}`,
        'flex items-center justify-between p-4 rounded-lg shadow-xl min-w-[250px]',
        'transition-all duration-300 ease-out',
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      )}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <IconComponent className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>

      {/* ✅ ShadCN Button with accessibility */}
      <Button
        onClick={handleClose}
        variant="ghost"
        size="sm"
        className="ml-4 p-0 h-auto"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}