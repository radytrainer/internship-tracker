'use client'

import * as XLSX from 'xlsx'
import { format } from 'date-fns'

export function exportToExcel(data: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][][],
  filename: string
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(18)
  doc.text(title, 14, 22)
  doc.setFontSize(11)
  doc.setTextColor(100)
  autoTable(doc, {
    head: [headers],
    body: rows as unknown as string[][],
    startY: 30,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  })
  doc.save(`${filename}.pdf`)
}

interface ReportKPI { label: string; value: string }
interface ReportSection { title: string; headers: string[]; rows: (string | number)[][] }

export async function exportReportPDF(options: {
  title: string
  subtitle?: string
  kpis: ReportKPI[]
  sections: ReportSection[]
  filename: string
}) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as any

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  const drawHeader = () => {
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageWidth, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.text('INTERNSHIP TRACKER', margin, 11)
    doc.setFontSize(17)
    doc.setFont('helvetica', 'bold')
    doc.text(options.title, margin, 22)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.text(`Generated ${format(new Date(), 'MMM d, yyyy h:mm a')}`, pageWidth - margin, 11, { align: 'right' })
    if (options.subtitle) doc.text(options.subtitle, pageWidth - margin, 22, { align: 'right' })
  }

  const drawFooter = (pageNum: number, pageCount: number) => {
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('Internship Tracker — Confidential', margin, pageHeight - 8)
    doc.text(`Page ${pageNum} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
  }

  drawHeader()
  let y = 40

  if (options.kpis.length > 0) {
    const gap = 4
    const boxW = (pageWidth - margin * 2 - gap * (options.kpis.length - 1)) / options.kpis.length
    const boxH = 18
    options.kpis.forEach((kpi, i) => {
      const x = margin + i * (boxW + gap)
      doc.setDrawColor(226, 232, 240)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(x, y, boxW, boxH, 2, 2, 'FD')
      doc.setTextColor(30, 41, 59)
      doc.setFontSize(12.5)
      doc.setFont('helvetica', 'bold')
      doc.text(kpi.value, x + 4, y + 8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text(kpi.label, x + 4, y + 14)
    })
    y += boxH + 10
  }

  for (const section of options.sections) {
    if (y > pageHeight - 45) { doc.addPage(); drawHeader(); y = 40 }
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(section.title, margin, y)
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.6)
    doc.line(margin, y + 2, margin + 26, y + 2)
    y += 6

    autoTable(doc, {
      head: [section.headers],
      body: section.rows as string[][],
      startY: y,
      margin: { top: 34, left: margin, right: margin, bottom: 18 },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      willDrawPage: (data: { pageNumber: number }) => { if (data.pageNumber > 1) drawHeader() },
    })
    y = doc.lastAutoTable.finalY + 12
  }

  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    drawFooter(i, pageCount)
  }

  doc.save(`${options.filename}.pdf`)
}
