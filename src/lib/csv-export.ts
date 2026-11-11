// Minimal browser-side CSV download helper. One function in, one file out.
// Deliberately framework-free so it can serve multiple admin exports
// (abstracts today; judges, authors, certifications later).
//
// NOTE: deferred export we talked about — a "topic / research-area"
// CSV that pulls title + affiliations + abstract body and (eventually)
// classifies into a controlled vocabulary. Needs semantic search infra
// to be worth building. Revisit when we have that capacity. For now
// the one-abstract-per-row tracking export (below) is what admins get.

export type CsvColumn<T> = {
  /** Column header in the CSV. */
  header: string
  /** Pull a value from a row — return null/undefined for a blank cell. */
  value: (row: T) => string | number | null | undefined
}

/**
 * Build a CSV string from rows + a column spec. RFC 4180-compatible:
 * fields containing quotes, commas, or newlines are double-quoted and
 * embedded quotes are doubled. Leading BOM so Excel on Windows picks
 * up the UTF-8 encoding and renders characters like "·" / em-dashes
 * correctly out of the box.
 */
export function buildCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const bom = '﻿'
  const headerLine = columns.map((c) => escapeCell(c.header)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escapeCell(stringify(c.value(row)))).join(','))
    .join('\r\n')
  return bom + headerLine + '\r\n' + body + (rows.length > 0 ? '\r\n' : '')
}

function stringify(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  return typeof v === 'number' ? String(v) : v
}

function escapeCell(s: string): string {
  if (s === '') return ''
  // Needs quoting if it contains CR, LF, comma, or double-quote.
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

/** Kick off a browser download for a prebuilt CSV string. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Release the blob URL on the next frame so Safari doesn't choke.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Timestamp-tag filenames so repeat exports don't overwrite each other. */
export function dateStamp(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Format a stored UTC timestamp in the event's local timezone
 * (America/Denver). Returns an empty string for null/invalid input so
 * CSV cells stay clean. Shape: "2026-11-16 23:45 MST".
 */
export function formatEventTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).formatToParts(d)
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? ''
  const tz = get('timeZoneName') || 'MT'
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')} ${tz}`
}
