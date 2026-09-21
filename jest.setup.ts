// React 19's test renderer needs this flag set explicitly — jest-expo's
// preset doesn't set it for us. Without it, state updates inside effects
// (as `SessionProvider` does on mount) warn "not configured to support act".
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
