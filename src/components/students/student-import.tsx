'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { bulkImportStudents } from '@/app/actions/students'
import type { StudentFormData } from '@/app/actions/students'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

const VALID_STATUSES = [
  'Studying', 'Looking For Internship', 'Internship Applied',
  'Interview Scheduled', 'Internship Accepted', 'Internship Active',
  'Internship Completed', 'Looking For Job', 'Employed',
]

// Column aliases: first entry is canonical name used in template header
const COLUMN_ALIASES: Record<string, string[]> = {
  'Student Code': ['Student Code', 'Code', 'ID', 'StudentCode', 'student_code'],
  'First Name':   ['First Name', 'FirstName', 'first_name', 'Given Name'],
  'Last Name':    ['Last Name', 'LastName', 'last_name', 'Family Name', 'Surname'],
  'Gender':       ['Gender', 'Sex'],
  'Phone':        ['Phone', 'Contact', 'Tel', 'Mobile', 'Phone Number', 'Contact Number'],
  'Email':        ['Email', 'E-mail', 'Email Address'],
  'Generation':   ['Generation', 'Gen', 'Cohort', 'Batch'],
  'Class':        ['Class', 'Class Name', 'Group'],
  'Status':       ['Status', 'Student Status'],
  'Notes':        ['Notes', 'Note', 'Remarks', 'Comment'],
}

// Required columns
const REQUIRED = ['Student Code', 'First Name', 'Last Name', 'Gender']
const OPTIONAL  = ['Phone', 'Email', 'Generation', 'Class', 'Status', 'Notes']

function downloadTemplate() {
  const headers = [
    'Student Code', 'First Name', 'Last Name', 'Gender',
    'Phone', 'Email', 'Generation', 'Class', 'Status', 'Notes',
  ]
  const notes = [
    'Required', 'Required', 'Required', 'Required — Male or Female',
    'Optional', 'Optional', 'Optional — must match existing name', 'Optional — must match existing name',
    'Optional — defaults to Studying', 'Optional',
  ]
  const sample1 = [
    'STU001', 'Sophal', 'Chea', 'Male', '012345678', 'sophal@example.com',
    'Generation 2026', 'Web 26 A', 'Studying', '',
  ]
  const sample2 = [
    'STU002', 'Sreymom', 'Keo', 'Female', '', '',
    'Generation 2027', 'Web 27 B', '', 'Strong in React',
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, notes, sample1, sample2])

  // Style the header row bold / notes row italic via cell comments workaround
  ws['!cols'] = headers.map(() => ({ wch: 24 }))

  // Freeze first row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Students')
  XLSX.writeFile(wb, 'student-import-template.xlsx')
}

// Resolve a canonical field from a raw Excel row — tries all aliases
function getField(raw: AnyRecord, canonical: string): string {
  for (const alias of (COLUMN_ALIASES[canonical] ?? [canonical])) {
    if (raw[alias] !== undefined && raw[alias] !== null) {
      return raw[alias].toString().trim()
    }
  }
  return ''
}

interface ParsedRow {
  row: number
  data: Partial<StudentFormData>
  errors: string[]   // hard errors — block import
  warnings: string[] // soft warnings — import still proceeds, field set to blank
  valid: boolean
}

interface StudentImportProps {
  open: boolean
  onClose: () => void
  classes: AnyRecord[]
  generations: AnyRecord[]
}

function parseRow(raw: AnyRecord, idx: number, generations: AnyRecord[], classes: AnyRecord[]): ParsedRow {
  const errors: string[] = []
  const warnings: string[] = []

  const student_code   = getField(raw, 'Student Code')
  const first_name     = getField(raw, 'First Name')
  const last_name      = getField(raw, 'Last Name')
  const gender         = getField(raw, 'Gender') as 'Male' | 'Female'
  const phoneRaw       = getField(raw, 'Phone')
  const emailRaw       = getField(raw, 'Email')
  const generationName = getField(raw, 'Generation')
  const className      = getField(raw, 'Class')
  const statusRaw      = getField(raw, 'Status')
  const notesRaw       = getField(raw, 'Notes')

  // Hard errors — block the row
  if (!student_code) errors.push('Student Code is required')
  if (!first_name)   errors.push('First Name is required')
  if (!last_name)    errors.push('Last Name is required')
  if (!['Male', 'Female'].includes(gender)) errors.push('Gender must be Male or Female')

  const phone = phoneRaw || null

  let email: string | null = null
  if (emailRaw) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) email = emailRaw
    else errors.push(`Invalid email: "${emailRaw}"`)
  }

  // Soft warnings — row still imports, field left blank
  let generation_id: string | null = null
  if (generationName) {
    const lower = generationName.toLowerCase()
    let gen = generations.find((g: AnyRecord) => g.name?.toLowerCase() === lower)
    if (!gen) {
      const yr = parseInt(generationName)
      if (!isNaN(yr)) gen = generations.find((g: AnyRecord) => g.year === yr)
    }
    if (gen) generation_id = gen.id
    else warnings.push(`Generation "${generationName}" not found — will be left blank`)
  }

  let class_id: string | null = null
  if (className) {
    const lower = className.toLowerCase()
    const pool = generation_id
      ? classes.filter((c: AnyRecord) => c.generation_id === generation_id)
      : classes

    const cls =
      pool.find((c: AnyRecord) => c.name?.toLowerCase() === lower) ??
      pool.find((c: AnyRecord) => c.name?.toLowerCase().endsWith(' ' + lower)) ??
      classes.find((c: AnyRecord) => c.name?.toLowerCase() === lower) ??
      classes.find((c: AnyRecord) => c.name?.toLowerCase().endsWith(' ' + lower))

    if (cls) class_id = cls.id
    else warnings.push(`Class "${className}" not in system — will be left blank`)
  }

  const status = VALID_STATUSES.includes(statusRaw) ? statusRaw : 'Studying'
  const notes  = notesRaw || null

  return {
    row: idx + 2,
    errors,
    warnings,
    valid: errors.length === 0,
    data: { student_code, first_name, last_name, gender, phone, email, generation_id, class_id, status: status as StudentFormData['status'], notes },
  }
}

export function StudentImport({ open, onClose, classes, generations }: StudentImportProps) {
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState<{ inserted: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setParsed([])
    setFileName('')
    setDone(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = () => { reset(); onClose() }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setDone(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      // raw:false keeps numbers as strings; defval ensures missing cells return ''
      const rows: AnyRecord[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })
      // Skip the notes/hint row from the template (first cell says "Required" or "Optional")
      const dataRows = rows.filter((r: AnyRecord) => {
        const first = Object.values(r)[0]?.toString().trim() ?? ''
        return first !== 'Required' && first !== 'Optional'
      })
      setParsed(dataRows.map((r, i) => parseRow(r, i, generations, classes)))
    }
    reader.readAsArrayBuffer(file)
  }

  const validRows   = parsed.filter(r => r.valid)
  const warnRows    = parsed.filter(r => r.valid && r.warnings.length > 0)
  const invalidRows = parsed.filter(r => !r.valid)

  const handleImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)
    const result = await bulkImportStudents(validRows.map(r => r.data as StudentFormData))
    setImporting(false)
    if (result.error) {
      toast.error(result.error)
    } else if ('inserted' in result) {
      setDone({ inserted: result.inserted ?? 0 })
      toast.success(`${result.inserted} students imported successfully`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Import Students from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx). Only 4 columns are required — everything else is optional.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-2">
          {/* Upload + Template row */}
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <div
              className="flex-1 border-2 border-dashed rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                {fileName || 'Click to upload .xlsx or .xls file'}
              </span>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>

          {/* Column guide (shown before file is loaded) */}
          {parsed.length === 0 && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">REQUIRED (4 columns)</p>
                <div className="flex flex-wrap gap-2">
                  {REQUIRED.map(c => <Badge key={c} variant="default" className="text-xs">{c}</Badge>)}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">OPTIONAL (can leave blank or omit column)</p>
                <div className="flex flex-wrap gap-2">
                  {OPTIONAL.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t">
                <p><strong>Gender:</strong> must be <code className="bg-muted px-1 rounded">Male</code> or <code className="bg-muted px-1 rounded">Female</code></p>
                <p><strong>Status:</strong> leave blank to default to <code className="bg-muted px-1 rounded">Studying</code></p>
                <p><strong>Generation:</strong> use the full name (<code className="bg-muted px-1 rounded">Generation 2026</code>) or just the year (<code className="bg-muted px-1 rounded">2026</code>)</p>
                <p><strong>Class:</strong> use the full name like <code className="bg-muted px-1 rounded">Web 26 A</code> or just the suffix when applicable (<code className="bg-muted px-1 rounded">A</code>, <code className="bg-muted px-1 rounded">B</code>, <code className="bg-muted px-1 rounded">C</code>)</p>
                <p><strong>Phone / Contact:</strong> accepted as-is — any format works</p>
                <p><strong>Column names:</strong> flexible — e.g. &ldquo;Contact&rdquo;, &ldquo;Mobile&rdquo;, or &ldquo;Tel&rdquo; all map to Phone</p>
              </div>
            </div>
          )}

          {/* Summary bar */}
          {parsed.length > 0 && !done && (
            <div className="flex items-center gap-4 rounded-lg border px-4 py-3 bg-muted/30">
              <span className="text-sm text-muted-foreground font-medium">{parsed.length} rows detected</span>
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-semibold text-green-700">{validRows.length}</span>
                <span className="text-muted-foreground">ready to import</span>
              </div>
              {invalidRows.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-semibold text-destructive">{invalidRows.length}</span>
                  <span className="text-muted-foreground">will be skipped</span>
                </div>
              )}
            </div>
          )}

          {/* Success state */}
          {done && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg font-semibold">{done.inserted} students imported successfully</p>
              {invalidRows.length > 0 && (
                <p className="text-sm text-muted-foreground">{invalidRows.length} rows were skipped due to errors.</p>
              )}
              <Button onClick={handleClose}>Close</Button>
            </div>
          )}

          {/* Preview table */}
          {parsed.length > 0 && !done && (
            <div className="rounded-lg border overflow-auto max-h-80">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-10">#</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Code</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Gender</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Contact</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Generation / Class</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsed.map(r => (
                    <tr key={r.row} className={r.valid ? 'hover:bg-muted/20' : 'bg-red-50 hover:bg-red-100'}>
                      <td className="px-3 py-2 text-muted-foreground">{r.row}</td>
                      <td className="px-3 py-2 font-mono">
                        {r.data.student_code || <span className="text-destructive italic">missing</span>}
                      </td>
                      <td className="px-3 py-2">
                        {(r.data.first_name || r.data.last_name)
                          ? `${r.data.first_name ?? ''} ${r.data.last_name ?? ''}`.trim()
                          : <span className="text-destructive italic">missing</span>
                        }
                      </td>
                      <td className="px-3 py-2">
                        {r.data.gender
                          ? <Badge variant="outline" className={`text-xs ${r.data.gender === 'Female' ? 'border-pink-300 text-pink-700' : 'border-blue-300 text-blue-700'}`}>{r.data.gender}</Badge>
                          : <span className="text-destructive italic">missing</span>
                        }
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        <div>{r.data.phone ?? '—'}</div>
                        {r.data.email && <div className="text-xs">{r.data.email}</div>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {generations.find((g: AnyRecord) => g.id === r.data.generation_id)?.name ?? '—'}
                        {r.data.class_id
                          ? ` / ${classes.find((c: AnyRecord) => c.id === r.data.class_id)?.name ?? ''}`
                          : ''
                        }
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-muted-foreground">{r.data.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        {r.valid
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          : (
                            <div className="group relative">
                              <AlertCircle className="h-3.5 w-3.5 text-destructive cursor-help" />
                              <div className="hidden group-hover:block absolute right-0 z-20 bg-white border rounded shadow-lg p-2 w-52 text-xs space-y-1">
                                {r.errors.map((e, i) => (
                                  <p key={i} className="text-destructive">{e}</p>
                                ))}
                              </div>
                            </div>
                          )
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!done && (
          <DialogFooter className="gap-2 pt-2 border-t">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            {parsed.length > 0 && (
              <Button onClick={handleImport} disabled={validRows.length === 0 || importing}>
                {importing
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</>
                  : `Import ${validRows.length} Student${validRows.length !== 1 ? 's' : ''}`
                }
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
