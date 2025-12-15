import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";
import { NotificationToast } from "../components/NotificationToast";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (
    type: "success" | "error" | "warning" | "info",
    message: string,
    duration?: number,
  ) => void;
}

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationContext =
  createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification p duoc dung trong NotificationProvider",
    );
  }
  return context;
};

const CLOSING_DELAY_STEP = 500;
const DEFAULT_DURATION = 3000;

export const NotificationProvider: React.FC<
  NotificationProviderProps
> = ({ children }) => {
  const [notification, setNotification] = useState<
    Notification[]
  >([]);

  const removeNotification = (id: string) => {
    setNotification((prev) => prev.filter((n) => n.id !== id));
  };

  const showNotification = (
    type: "success" | "error" | "warning" | "info",
    message: string,
    duration = DEFAULT_DURATION,
  ) => {
    const id = Date.now().toString();
    const newNotification = { id, type, message, duration };

    setNotification((prev) => [...prev, newNotification]);

    const activeCount = notification.length;
    const totalDelay =
      duration + activeCount * CLOSING_DELAY_STEP;

    setTimeout(() => removeNotification(id), totalDelay);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="notification-container fixed bottom-4 right-4 z-[100] space-y-2">
        {notification.map((n) => (
          <NotificationToast
            key={n.id}
            {...n}
            // Duration truyền vào chỉ còn dùng cho hiệu ứng (nếu có), không dùng cho logic đóng
            duration={DEFAULT_DURATION}
            // Nút X vẫn cần gọi removeNotification
            onClose={() => removeNotification(n.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};