type AuthEvent = "login" | "refresh" | "logout";

const listeners: Record<AuthEvent, Set<() => void>> = {
  login: new Set(),
  refresh: new Set(),
  logout: new Set(),
};

export const authEvents = {
  on(event: AuthEvent, cb: () => void) {
    listeners[event].add(cb);
  },
  off(event: AuthEvent, cb: () => void) {
    listeners[event].delete(cb);
  },
  emit(event: AuthEvent) {
    listeners[event].forEach((cb) => {
      try {
        cb();
      } catch (e) {
        // swallow listener errors
        console.error("authEvents listener error", e);
      }
    });
  },
};
