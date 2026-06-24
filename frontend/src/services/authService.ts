import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { createFetchWithInterceptor } from "../api/fetchWithInterceptor";

// We instantiate a global interceptor bound to the stores
export const fetchWithInterceptor = createFetchWithInterceptor({
  addNotification: useNotificationStore.getState().addNotification,
  setErrorPopup: useNotificationStore.getState().setErrorPopup,
  onUnauthorized: () => {
    localStorage.removeItem("sonikoma_token");
    sessionStorage.removeItem("sonikoma_token");
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setIsAuthenticated(false);
  },
});

export const getToken = () => {
  return (
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token")
  );
};

export const checkAuth = async (showDelay: boolean = true) => {
  const token = getToken();
  const { setAuthLoading, setIsInitializing, setUser, setIsAuthenticated } =
    useAuthStore.getState();

  if (!token) {
    setAuthLoading(false);
    setIsInitializing(false);
    return;
  }
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      setIsAuthenticated(true);
    } else {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("sonikoma_token");
        sessionStorage.removeItem("sonikoma_token");
      }
    }
  } catch (e) {
    console.error("Auth check failed", e);
  } finally {
    setAuthLoading(false);
    setIsInitializing(false);
  }
};

export const login = async (credentials: any) => {
  const { addNotification } = useNotificationStore.getState();
  const { setUser, setIsAuthenticated } = useAuthStore.getState();

  const res = await fetchWithInterceptor("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (data.access_token) {
    if (credentials.rememberMe) {
      localStorage.setItem("sonikoma_token", data.access_token);
      sessionStorage.removeItem("sonikoma_token");
    } else {
      sessionStorage.setItem("sonikoma_token", data.access_token);
      localStorage.removeItem("sonikoma_token");
    }
    setUser(data.user);
    setIsAuthenticated(true);
    addNotification("Logged in successfully!", "success", {
      details: `User ID: ${data.user.id}\nEmail: ${
        data.user.email
      }\nWelcome back, ${data.user.name || data.user.email}!`,
    });
  } else {
    throw new Error(data.detail || "Login failed");
  }
};

export const register = async (userData: any) => {
  const { addNotification } = useNotificationStore.getState();
  const { setUser, setIsAuthenticated } = useAuthStore.getState();

  const res = await fetchWithInterceptor("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem("sonikoma_token", data.access_token);
    sessionStorage.removeItem("sonikoma_token");
    setUser(data.user);
    setIsAuthenticated(true);
    addNotification("Account created successfully!", "success", {
      details: `User ID: ${data.user.id}\nEmail: ${
        data.user.email
      }\nWelcome to Sonikoma, ${data.user.name || data.user.email}!`,
    });
  } else {
    throw new Error(data.detail || "Registration failed");
  }
};

export const logout = () => {
  const { addNotification } = useNotificationStore.getState();
  const { setUser, setIsAuthenticated } = useAuthStore.getState();

  localStorage.removeItem("sonikoma_token");
  sessionStorage.removeItem("sonikoma_token");
  setUser(null);
  setIsAuthenticated(false);
  addNotification("Logged out successfully.", "info", {
    details: `Your session token has been cleared. You have been securely logged out.`,
  });
  (window as any).navigateTo?.("/landing");
};

export const forgotPassword = async (email: string) => {
  const res = await fetchWithInterceptor("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return await res.json();
};
