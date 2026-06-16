import { create } from 'zustand'
import { login as loginService, logout as logoutService, getUser } from '../services/auth'

interface UserData {
  id: string
  name: string
  roles: string[]
  firstName: string
}

interface AuthState {
  user: UserData | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: () => {
    const user = getUser()
    const token = localStorage.getItem('access_token')
    
    if (user && token) {
      set({ user, token, isAuthenticated: true })
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const data = await loginService({ email, password })
      set({
        user: data.user,
        token: data.access_token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao fazer login',
        isLoading: false,
      })
    }
  },

  logout: () => {
    logoutService()
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    })
  },

  clearError: () => set({ error: null }),
}))