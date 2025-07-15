// Client-side authentication utilities

export const checkAdminAuth = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('admin_token')
    
    if (!token) {
      return false
    }

    // Check if token is expired client-side first (for better UX)
    if (isTokenExpired(token)) {
      logout()
      return false
    }

    // Verify token with backend
    const response = await fetch('/api/admin/auth', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      
      // Handle different error types
      if (errorData.message === "Token expired") {
        console.log("Session expired. Please login again.")
      } else if (errorData.message === "Token not valid for this device") {
        console.log("This session is not valid for this device. Please login again.")
      }
      
      logout()
      return false
    }

    return true
  } catch (error) {
    console.error('Auth check error:', error)
    logout()
    return false
  }
}

export const logout = () => {
  localStorage.removeItem('admin_token')
  // Clear cookie
  document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
  window.location.href = '/admin/login'
}

export const getAdminToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token')
  }
  return null
}

// Token validation - now checks for 10-minute expiration
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expirationTime = payload.timestamp + (10 * 60 * 1000) // 10 minutes
    return Date.now() > expirationTime
  } catch (error) {
    return true
  }
}

// Get remaining time for token (useful for showing countdown)
export const getTokenRemainingTime = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expirationTime = payload.timestamp + (10 * 60 * 1000) // 10 minutes
    const remainingTime = expirationTime - Date.now()
    return Math.max(0, Math.floor(remainingTime / 1000)) // Return seconds remaining
  } catch (error) {
    return 0
  }
}

// Auto-refresh token when it's about to expire (call this in your admin dashboard)
export const startTokenRefreshTimer = (onTokenExpired: () => void) => {
  const checkToken = () => {
    const token = getAdminToken()
    if (!token) {
      onTokenExpired()
      return
    }
    
    const remainingTime = getTokenRemainingTime(token)
    
    // If less than 1 minute remaining, warn user
    if (remainingTime <= 60 && remainingTime > 0) {
      console.log(`Session expires in ${remainingTime} seconds`)
    }
    
    // If expired, logout
    if (remainingTime <= 0) {
      onTokenExpired()
      return
    }
  }
  
  // Check every 30 seconds
  const interval = setInterval(checkToken, 30000)
  
  // Initial check
  checkToken()
  
  // Return cleanup function
  return () => clearInterval(interval)
} 