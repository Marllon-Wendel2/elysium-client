const API_URL = 'http://localhost:3001'

interface LoginCredentials {
  email: string
  password: string
}

interface UserData {
  id: string
  name: string
  roles: string[]
  firstName: string
}

interface LoginResponse {
  access_token: string
  user: UserData
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Erro ao fazer login')
  }

  const data: LoginResponse = await response.json()
  
  // Salvar token
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('user', JSON.stringify(data.user))
  
  return data
}

export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}

export function getToken(): string | null {
  return localStorage.getItem('access_token')
}

export function getUser(): UserData | null {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}