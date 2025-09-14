"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/lib/toast-context"
import { useToast } from "@/lib/toast-context"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex flex-col gap-2">
              {title && (
                <div className="flex items-center">
                  {typeof title === 'string' ? (
                    <ToastTitle>{title}</ToastTitle>
                  ) : (
                    <div className="flex items-center">
                      {title}
                    </div>
                  )}
                </div>
              )}
              {description && (
                <ToastDescription className="text-sm leading-relaxed">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
