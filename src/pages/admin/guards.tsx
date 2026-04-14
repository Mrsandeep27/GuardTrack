import { useState } from 'react'
import { useGuards } from '@/hooks/use-guards'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatHours } from '@/lib/utils'
import { Plus, Trash2, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminGuards() {
  const { guards, loading, refetch } = useGuards()
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setAdding(true)

    try {
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY

      // Create auth user via admin-like signup
      const res = await fetch(`${url}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': key },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          data: { name: form.name.trim(), role: 'guard' },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.msg || body.message || 'Failed to create guard')
        setAdding(false)
        return
      }

      const data = await res.json()
      const userId = data.id || data.user?.id

      // Update phone number
      if (userId && form.phone) {
        await supabase.from('profiles').update({ phone: form.phone }).eq('id', userId)
      }

      setForm({ name: '', email: '', phone: '', password: '' })
      setShowAdd(false)
      refetch()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (guardId: string, guardName: string) => {
    if (!confirm(`Remove ${guardName}? This will deactivate the guard.`)) return
    setDeleting(guardId)

    // Soft delete — set is_active to false
    await supabase.from('profiles').update({ is_active: false }).eq('id', guardId)
    refetch()
    setDeleting(null)
  }

  const activeGuards = guards.filter(g => g.is_active !== false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Guards</h1>
          <p className="text-muted-foreground text-sm mt-1">{activeGuards.length} guards active</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showAdd ? 'Cancel' : 'Add Guard'}
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="Guard name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="guard@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" disabled={adding}>
                {adding && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Guard
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Phone</th>
                    <th className="text-left py-3 px-2 font-medium">Weekly</th>
                    <th className="text-left py-3 px-2 font-medium">Monthly</th>
                    <th className="text-right py-3 px-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeGuards.map((guard) => (
                    <tr key={guard.id} className="border-b border-border/50 hover:bg-accent/50">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{guard.name}</p>
                          <p className="text-xs text-muted-foreground">{guard.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={guard.status === 'active' ? 'success' : 'danger'}>
                          {guard.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell text-muted-foreground">
                        {guard.phone || '--'}
                      </td>
                      <td className="py-3 px-2">{formatHours(guard.weekly_hours)}</td>
                      <td className="py-3 px-2">{formatHours(guard.monthly_hours)}</td>
                      <td className="py-3 px-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleDelete(guard.id, guard.name)}
                          disabled={deleting === guard.id}
                        >
                          {deleting === guard.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
