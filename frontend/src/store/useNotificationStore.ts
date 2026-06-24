import { create } from "zustand";
import {
  Notification,
  NotificationType,
} from "../components/NotificationStack";
import { ErrorPopupDetail } from "../components/ErrorPopupModal";

interface NotificationState {
  notifications: Notification[];
  notificationsMuted: boolean;
  errorPopup: ErrorPopupDetail | null;
  setNotifications: (
    updater: Notification[] | ((prev: Notification[]) => Notification[])
  ) => void;
  setNotificationsMuted: (muted: boolean) => void;
  setErrorPopup: (popup: ErrorPopupDetail | null) => void;
  addNotification: (
    message: string,
    type: NotificationType,
    options?: {
      errorCode?: number;
      retryDelay?: number;
      onRetry?: () => void;
      details?: string;
      link?: string;
    }
  ) => void;
  removeNotification: (id: number) => void;
}

// Initial check for muted from localStorage
const initialNotificationsMuted =
  localStorage.getItem("ai_comic_notifications_muted") === "true";
const initialNotificationsRaw = localStorage.getItem("ai_comic_notifications");
let initialNotifications: Notification[] = [];
if (initialNotificationsRaw) {
  try {
    initialNotifications = JSON.parse(initialNotificationsRaw);
  } catch (e) {
    initialNotifications = [];
  }
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: initialNotifications,
  notificationsMuted: initialNotificationsMuted,
  errorPopup: null,

  setNotifications: (updater) =>
    set((state) => {
      const nextNotifications =
        typeof updater === "function" ? updater(state.notifications) : updater;
      localStorage.setItem(
        "ai_comic_notifications",
        JSON.stringify(nextNotifications)
      );
      return { notifications: nextNotifications };
    }),

  setNotificationsMuted: (muted) => {
    localStorage.setItem("ai_comic_notifications_muted", String(muted));
    set({ notificationsMuted: muted });
  },

  setErrorPopup: (popup) => set({ errorPopup: popup }),

  removeNotification: (id: number) => {
    set((state) => {
      const nextNotifications = state.notifications.map((n) =>
        n.id === id ? { ...n, toastDismissed: true } : n
      );
      localStorage.setItem(
        "ai_comic_notifications",
        JSON.stringify(nextNotifications)
      );
      return { notifications: nextNotifications };
    });
  },

  addNotification: (message, type, options) => {
    const id = Date.now() + Math.random();
    const newNote: Notification = {
      id,
      message,
      type,
      timestamp: Date.now(),
      isRead: false,
      ...options,
    };

    set((state) => {
      const filtered = state.notifications.filter((n) => n.message !== message);
      const nextNotifications = [newNote, ...filtered];
      localStorage.setItem(
        "ai_comic_notifications",
        JSON.stringify(nextNotifications)
      );
      return { notifications: nextNotifications };
    });

    const state = get();
    if (!state.notificationsMuted) {
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const playTone = (freq: number, start: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.08, start + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + duration);
          };
          const now = ctx.currentTime;
          playTone(587.33, now, 0.25); // D5
          playTone(880.0, now + 0.08, 0.35); // A5
        }
      } catch (err) {
        console.warn("Failed to play notification sound:", err);
      }
    }

    if (!options?.onRetry) {
      setTimeout(() => {
        get().removeNotification(id);
      }, 5000);
    }
  },
}));
