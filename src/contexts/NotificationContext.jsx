import React, { createContext, useContext, useCallback } from "react";
import { notification } from "antd";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [api, contextHolder] = notification.useNotification();

  const showNotification = useCallback((message, type = "info", duration = 4) => {
    const validTypes = ["success", "info", "warning", "error"];
    const notifType = validTypes.includes(type) ? type : "info";
    
    api[notifType]({
      message: notifType.charAt(0).toUpperCase() + notifType.slice(1),
      description: message,
      placement: "topRight",
      duration: duration,
      style: {
        borderRadius: 12,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)"
      }
    });
  }, [api]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const useNotifications = useNotification;

export default NotificationContext;
