import { getCurrentScope, onScopeDispose } from 'vue'

export function useEventListener(target: EventTarget, type: string, listener: any, options?: boolean | AddEventListenerOptions) {
  target.addEventListener(type, listener, options)
  getCurrentScope() && onScopeDispose(() => target.removeEventListener(type, listener, options))
}
