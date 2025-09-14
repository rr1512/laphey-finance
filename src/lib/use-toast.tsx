import { toast } from "@/lib/toast-context"
import { CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react"

// Enhanced toast functions with icons and better styling
const useCustomToast = (): {
  toast: any
  success: (title: string, description?: string) => any
  error: (title: string, description?: string) => any
  warning: (title: string, description?: string) => any
  info: (title: string, description?: string) => any
  loading: (title: string, description?: string) => any
} => {
  const showToast = toast

  const success = (title: string, description?: string) => {
    return showToast({
      variant: "success",
      title: (
        <>
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 inline-block mr-3" />
          <span className="font-medium">{title}</span>
        </>
      ),
      description,
      duration: 4000,
    })
  }

  const error = (title: string, description?: string) => {
    return showToast({
      variant: "destructive",
      title: (
        <>
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 inline-block mr-3" />
          <span className="font-medium">{title}</span>
        </>
      ),
      description,
      duration: 5000,
    })
  }

  const warning = (title: string, description?: string) => {
    return showToast({
      variant: "warning",
      title: (
        <>
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 inline-block mr-3" />
          <span className="font-medium">{title}</span>
        </>
      ),
      description,
      duration: 4500,
    })
  }

  const info = (title: string, description?: string) => {
    return showToast({
      variant: "info",
      title: (
        <>
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 inline-block mr-3" />
          <span className="font-medium">{title}</span>
        </>
      ),
      description,
      duration: 4000,
    })
  }

  const loading = (title: string, description?: string) => {
    return showToast({
      title: (
        <>
          <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 inline-block mr-3 animate-spin" />
          <span className="font-medium">{title}</span>
        </>
      ),
      description,
      duration: Infinity, // Won't auto-dismiss
    })
  }

  return {
    toast: showToast,
    success,
    error,
    warning,
    info,
    loading,
  }
}

export default useCustomToast
