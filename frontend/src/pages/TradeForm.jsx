import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import { resolveScreenshotUrl, screenshotKey } from '../utils/screenshotUrl'

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const empty = {
  pair: '',
  type: 'buy',
  lotSize: '',
  entryPrice: '',
  stopLoss: '',
  takeProfit: '',
  exitPrice: '',
  profitLoss: '',
  strategy: '',
  notes: '',
  psychologyNote: '',
  openedAt: '',
  closedAt: '',
  status: 'closed',
}

export function TradeForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [files, setFiles] = useState([])
  const [existingShots, setExistingShots] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) {
      setForm((f) => ({ ...f, openedAt: toLocalInput(new Date().toISOString()) }))
      return
    }
    let cancelled = false
    apiFetch(`/trades/${id}`)
      .then((t) => {
        if (cancelled) return
        setExistingShots(Array.isArray(t.screenshots) ? t.screenshots : [])
        setForm({
          pair: t.pair || '',
          type: t.type || 'buy',
          lotSize: t.lotSize ?? '',
          entryPrice: t.entryPrice ?? '',
          stopLoss: t.stopLoss ?? '',
          takeProfit: t.takeProfit ?? '',
          exitPrice: t.exitPrice ?? '',
          profitLoss: t.profitLoss ?? '',
          strategy: t.strategy || '',
          notes: t.notes || '',
          psychologyNote: t.psychologyNote || '',
          openedAt: toLocalInput(t.openedAt),
          closedAt: t.closedAt ? toLocalInput(t.closedAt) : '',
          status: t.status || 'closed',
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        pair: form.pair,
        type: form.type,
        lotSize: form.lotSize,
        entryPrice: form.entryPrice,
        stopLoss: form.stopLoss,
        takeProfit: form.takeProfit,
        exitPrice: form.exitPrice,
        profitLoss: form.profitLoss,
        strategy: form.strategy,
        notes: form.notes,
        psychologyNote: form.psychologyNote,
        status: form.status,
        openedAt: form.openedAt ? new Date(form.openedAt).toISOString() : undefined,
        closedAt: form.closedAt ? new Date(form.closedAt).toISOString() : '',
      }

      const hasFiles = files.length > 0

      if (!isEdit || hasFiles) {
        const fd = new FormData()
        for (const [key, val] of Object.entries(payload)) {
          if (val === undefined || val === '') continue
          fd.append(key, String(val))
        }
        for (const f of files) fd.append('screenshots', f)
        await apiFetch(isEdit ? `/trades/${id}` : '/trades', {
          method: isEdit ? 'PATCH' : 'POST',
          body: fd,
        })
      } else {
        await apiFetch(`/trades/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      }
      navigate('/trades')
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading trade…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {isEdit ? 'Edit trade' : 'Log trade'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Record setup, execution, and psychology</p>
        </div>
        <Link
          to="/trades"
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          ← History
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-400">Pair</label>
            <input
              required
              placeholder="XAUUSD, EURUSD…"
              value={form.pair}
              onChange={(e) => set('pair', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white uppercase outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Type</label>
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Status</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="closed">Closed</option>
              <option value="open">Open</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Lot size</label>
            <input
              required
              type="text"
              inputMode="decimal"
              value={form.lotSize}
              onChange={(e) => set('lotSize', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Entry price</label>
            <input
              required
              type="text"
              inputMode="decimal"
              value={form.entryPrice}
              onChange={(e) => set('entryPrice', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Stop loss</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.stopLoss}
              onChange={(e) => set('stopLoss', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Take profit</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.takeProfit}
              onChange={(e) => set('takeProfit', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Exit price</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.exitPrice}
              onChange={(e) => set('exitPrice', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Profit / loss</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.profitLoss}
              onChange={(e) => set('profitLoss', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Opened</label>
            <input
              required
              type="datetime-local"
              value={form.openedAt}
              onChange={(e) => set('openedAt', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Closed</label>
            <input
              type="datetime-local"
              value={form.closedAt}
              onChange={(e) => set('closedAt', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-400">Strategy tag</label>
            <input
              placeholder="ICT breaker, order block, liquidity sweep…"
              value={form.strategy}
              onChange={(e) => set('strategy', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-400">Notes (setup)</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-400">Psychology</label>
            <textarea
              rows={2}
              placeholder="FOMO, hesitation, discipline…"
              value={form.psychologyNote}
              onChange={(e) => set('psychologyNote', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          {isEdit && existingShots.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-slate-400">Current screenshots</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {existingShots.map((shot, i) => {
                  const src = resolveScreenshotUrl(shot)
                  if (!src) return null
                  return (
                    <a
                      key={screenshotKey(shot, i)}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg border border-slate-700"
                    >
                      <img
                        src={src}
                        alt=""
                        className="h-24 w-auto max-w-[200px] object-cover"
                      />
                    </a>
                  )
                })}
              </div>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-400">Screenshots</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="mt-2 block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:text-slate-200"
            />
            {isEdit && (
              <p className="mt-2 text-xs text-slate-500">
                Add more images; existing shots stay unless you remove them in a future update.
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Update trade' : 'Save trade'}
          </button>
          <Link
            to="/trades"
            className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
