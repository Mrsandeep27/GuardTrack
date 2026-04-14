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
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setAdding(true)

    try {
      const { data: { session: adminSession } } = await supabase.auth.getSession()

      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { name: form.name.trim(), role: 'guard' } },
      })

      if (signUpErr) {
        setError(signUpErr.message)
        setAdding(false)
        return
      }

      if (adminSession) {
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        })
      }

      const userId = data.user?.id
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

  const handleDelete = async (guardId: string) => {
    setDeleting(guardId)
    setConfirmId(null)

    try {
      // Delete attendance first, then profile (cascade should handle, but be safe)
      const { error: attErr } = await supabase.from('attendance').delete().eq('guard_id', guardId)
      if (attErr) console.error('Attendance delete:', attErr.message)

      const { error: profErr } = await supabase.from('profiles').delete().eq('id', guardId)
      if (profErr) console.error('Profile delete:', profErr.message)
    } catch (err) {
      console.error('Delete failed:', err)
    }

    refetch()
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Guards</h1>
          <p className="text-muted-foreground text-sm mt-1">{guards.length} guards registered</p>
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
                  <Input placeholder="Guard name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="guard@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input placeholder="9876543210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
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
          ) : guards.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No guards yet. Click "Add Guard" to create one.</p>
          ) : (
            <div className="space-y-3">
              {guards.map((guard) => (
                <div key={guard.id} className="rounded-lg bg-accent/50 overflow-hidden">
                  {/* Guard info row */}
                  <div className="flex items-center justify-between py-3 px-4">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{guard.name}</p>
                        <Badge variant={guard.status === 'active' ? 'success' : 'danger'} className="shrink-0">
                          {guard.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {guard.email}{guard.phone ? ` · ${guard.phone}` : ''}
                      </p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Week: <span className="text-foreground font-medium">{formatHours(guard.weekly_hours)}</span></span>
                        <span>Month: <span className="text-foreground font-medium">{formatHours(guard.monthly_hours)}</span></span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => setConfirmId(confirmId === guard.id ? null : guard.id)}
                      disabled={deleting === guard.id}
                    >
                      {deleting === guard.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Inline confirm — shows right below the guard */}
                  {confirmId === guard.id && (
                    <div className="px-4 py-3 bg-red-500/10 border-t border-red-500/20">
                      <p className="text-sm text-red-400 mb-2">
                        Delete <strong>{guard.name}</strong> and all their records?
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(guard.id)}>
                          Yes, Delete
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
