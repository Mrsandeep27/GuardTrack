import { useState, useRef, useEffect } from 'react'
import { Shield, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const busyRef = useRef(false) // prevents double-fire
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  // Clear ALL stale Supabase sessions when landing on login page
  useEffect(() => {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-')) keysToRemove.push(key)
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))
    } catch {}
  }, [])

  // Capture the PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    if (busyRef.current) return
    busyRef.current = true
    setError('')
    setLoading(true)

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      })

      if (authErr || !data.session) {
        setError(authErr?.message || 'Login failed')
        setLoading(false)
        busyRef.current = false
        return
      }

      // Session is automatically persisted by the SDK
      const role = data.user?.user_metadata?.role || 'guard'
      const dest = role === 'admin' ? '/admin/dashboard' : '/guard/dashboard'
      window.location.replace(dest)
      // NOTE: setLoading(false) is intentionally NOT called here.
      // The page is navigating away — the spinner is correct UX.
    } catch (err: any) {
      setError(err.message || 'Network error')
      setLoading(false)
      busyRef.current = false
    }
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

          {installPrompt && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleInstall}
              >
                <Download className="h-4 w-4" />
                Install App
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
