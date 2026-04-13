import { useState, useRef } from 'react'
import { Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Extract project ref for storage key: "https://abc.supabase.co" -> "abc"
const PROJECT_REF = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split('.')[0] : ''
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`

async function authenticateWithSupabase(
  email: string,
  password: string
): Promise<{ session: any; role: string; error?: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000) // 15s hard timeout

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return {
        session: null,
        role: '',
        error: body.error_description || body.msg || body.message || `Login failed (${res.status})`,
      }
    }

    const data = await res.json()
    const role = data.user?.user_metadata?.role || 'guard'
    return { session: data, role, error: undefined }
  } catch (err: any) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      return { session: null, role: '', error: 'Request timed out. Check your connection.' }
    }
    return { session: null, role: '', error: err.message || 'Network error' }
  }
}

function persistSession(session: any): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: session.user,
    }))
  } catch {
    // localStorage full or blocked — session won't persist but login still works
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const busyRef = useRef(false) // prevents double-fire

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    if (busyRef.current) return
    busyRef.current = true
    setError('')
    setLoading(true)

    const { session, role, error: authErr } = await authenticateWithSupabase(
      loginEmail.trim(),
      loginPassword
    )

    if (authErr || !session) {
      setError(authErr || 'Login failed')
      setLoading(false)
      busyRef.current = false
      return
    }

    // Store session for the Supabase SDK to pick up on next page load
    persistSession(session)

    // Hard navigate — the auth store will read from localStorage on the new page
    const dest = role === 'admin' ? '/admin/dashboard' : '/guard/dashboard'
    window.location.replace(dest)
    // NOTE: setLoading(false) is intentionally NOT called here.
    // The page is navigating away — the spinner is correct UX (shows "working").
    // If navigation somehow fails (should never happen), the user can refresh.
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await doLogin(email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">GuardTrack</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t space-y-2">
            <p className="text-xs text-muted-foreground text-center mb-2">Quick Demo Login:</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={loading}
                onClick={() => doLogin('admin@guardtrack.com', 'admin123')}
              >
                Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={loading}
                onClick={() => doLogin('rajesh@demo.com', 'guard123')}
              >
                Guard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
