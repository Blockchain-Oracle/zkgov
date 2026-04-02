'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { API_URL } from '@/lib/constants'
import type { UserResponse } from '@zkgov/shared'

interface AuthContextType {
  user: UserResponse | null
  token: string | null
  isLoading: boolean
  isSigning: boolean
  login: () => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('zkgov_token')
    if (savedToken) {
      setToken(savedToken)
      fetchUser(savedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        logout()
      }
    } catch (err) {
      console.error('Failed to fetch user:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async () => {
    if (!address) return
    setIsSigning(true)
    try {
      const nonce = Math.random().toString(36).substring(7)
      const message = `Sign in to ZKGov: ${nonce}`
      const signature = await signMessageAsync({ message })

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, signature, nonce }),
      })

      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('zkgov_token', data.token)
      }
    } catch (err) {
      console.error('Login failed:', err)
    } finally {
      setIsSigning(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('zkgov_token')
  }

  const refreshUser = async () => {
    if (token) await fetchUser(token)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isSigning, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
