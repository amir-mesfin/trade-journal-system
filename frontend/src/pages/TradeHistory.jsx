import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, downloadCsv } from '../api/client'
import { resolveScreenshotUrl, screenshotKey } from '../utils/screenshotUrl'

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-800 py-2 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-200">{children}</dd>
    </div>
  )
}

export function TradeHistory() {
  const [data, setData] = useState({ items: [], total: 0 })
  const [filters, setFilters] = useState({ pair: '', strategy: '', startDate: '', endDate: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [detail, setDetail] = useState(null)

  function load() {
    setLoading(true)
    const q = new URLSearchParams()
    if (filters.pair) q.set('pair', filters.pair)
    if (filters.strategy) q.set('strategy', filters.strategy)
    if (filters.startDate) q.set('startDate', filters.startDate)
    if (filters.endDate) q.set('endDate', filters.endDate)
    const qs = q.toString()
    apiFetch(`/trades${qs ? `?${qs}` : ''}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!detail) return
    function onKey(e) {
      if (e.key === 'Escape') setDetail(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail])

  async function handleDelete(tid) {
    if (!confirm('Delete this trade?')) return
    try {
      await apiFetch(`/trades/${tid}`, { method: 'DELETE' })
      setDetail((d) => (d && d._id === tid ? null : d))
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      await downloadCsv()
    } catch (e) {
      alert(e.message)
    } finally {
      setExporting(false)
    }
  }

  function openDetail(t) {
    setDetail(t)
  }

  const shots = detail?.screenshots?.length
    ? detail.screenshots.map((s, i) => ({ src: resolveScreenshotUrl(s), key: screenshotKey(s, i) })).filter((x) => x.src)
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Trade history</h1>
          <p className="mt-1 text-sm text-slate-500">{data.total} trades · click a row to view full details</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            {exporting ? 'Export…' : 'Export CSV'}
          </button>
          <Link
            to="/trades/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            + Add trade
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <input
          placeholder="Pair"
          value={filters.pair}
          onChange={(e) => setFilters((f) => ({ ...f, pair: e.target.value }))}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        />
        <input
          placeholder="Strategy"
          value={filters.strategy}
          onChange={(e) => setFilters((f) => ({ ...f, strategy: e.target.value }))}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        />
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={load}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Apply filters
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-slate-500">No trades yet. Log your first one.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">P/L</th>
                <th className="px-4 py-3">Strategy</th>
                <th className="px-4 py-3">Opened</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.items.map((t) => (
                <tr
                  key={t._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(t)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openDetail(t)
                    }
                  }}
                  className="cursor-pointer bg-slate-950/40 hover:bg-slate-900/60"
                >
                  <td className="px-4 py-3 font-medium text-white">{t.pair}</td>
                  <td className="px-4 py-3 capitalize text-slate-300">{t.type}</td>
                  <td
                    className={`px-4 py-3 font-mono tabular-nums ${
                      t.profitLoss == null
                        ? 'text-slate-500'
                        : t.profitLoss > 0
                          ? 'text-emerald-400'
                          : t.profitLoss < 0
                            ? 'text-red-400'
                            : 'text-slate-300'
                    }`}
                  >
                    {t.profitLoss != null ? t.profitLoss : '—'}
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-3 text-slate-400">
                    {t.strategy || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {t.openedAt ? new Date(t.openedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openDetail(t)}
                      className="mr-3 text-slate-400 hover:text-slate-200"
                    >
                      View
                    </button>
                    <Link
                      to={`/trades/${t._id}/edit`}
                      className="mr-3 text-emerald-400 hover:text-emerald-300"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(t._id)}
                      className="text-red-400/90 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-10 backdrop-blur-sm"
          role="presentation"
          onClick={() => setDetail(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trade-detail-title"
            className="mb-10 w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
              <div>
                <h2 id="trade-detail-title" className="text-lg font-semibold text-white">
                  {detail.pair}{' '}
                  <span className="font-normal capitalize text-slate-400">({detail.type})</span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {detail.status === 'open' ? 'Open' : 'Closed'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-4">
              <dl>
                <DetailRow label="Lot size">{detail.lotSize ?? '—'}</DetailRow>
                <DetailRow label="Entry">{detail.entryPrice ?? '—'}</DetailRow>
                <DetailRow label="Stop loss">{detail.stopLoss ?? '—'}</DetailRow>
                <DetailRow label="Take profit">{detail.takeProfit ?? '—'}</DetailRow>
                <DetailRow label="Exit">{detail.exitPrice ?? '—'}</DetailRow>
                <DetailRow label="P/L">
                  <span
                    className={
                      detail.profitLoss == null
                        ? 'text-slate-500'
                        : detail.profitLoss > 0
                          ? 'font-mono text-emerald-400'
                          : detail.profitLoss < 0
                            ? 'font-mono text-red-400'
                            : 'font-mono text-slate-300'
                    }
                  >
                    {detail.profitLoss != null ? detail.profitLoss : '—'}
                  </span>
                </DetailRow>
                <DetailRow label="Opened">
                  {detail.openedAt ? new Date(detail.openedAt).toLocaleString() : '—'}
                </DetailRow>
                <DetailRow label="Closed">
                  {detail.closedAt ? new Date(detail.closedAt).toLocaleString() : '—'}
                </DetailRow>
                <DetailRow label="Strategy">{detail.strategy?.trim() ? detail.strategy : '—'}</DetailRow>
                <DetailRow label="Notes">
                  {detail.notes?.trim() ? (
                    <span className="whitespace-pre-wrap">{detail.notes}</span>
                  ) : (
                    '—'
                  )}
                </DetailRow>
                <DetailRow label="Psychology">
                  {detail.psychologyNote?.trim() ? (
                    <span className="whitespace-pre-wrap">{detail.psychologyNote}</span>
                  ) : (
                    '—'
                  )}
                </DetailRow>
              </dl>

              {shots.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Screenshots
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {shots.map(({ src, key }) => (
                      <a
                        key={key}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border border-slate-700 bg-slate-900 hover:border-emerald-500/40"
                      >
                        <img
                          src={src}
                          alt="Trade screenshot"
                          className="h-auto w-full object-contain"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                <Link
                  to={`/trades/${detail._id}/edit`}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                  onClick={() => setDetail(null)}
                >
                  Edit trade
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(detail._id)}
                  className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
