import { createAdminClient } from '@/lib/supabase/admin'
import { BoardPage } from '@/components/board/board-page'

export const revalidate = 0

export default async function PublicBoardPage() {
  const admin = createAdminClient()
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  // Auto-reject: applications older than 2 weeks with no interview date set
  const { data: appsWithInterview } = await admin
    .from('interviews')
    .select('application_id')
    .not('interview_date', 'is', null)

  const interviewedIds = new Set((appsWithInterview ?? []).map(i => i.application_id))

  const { data: staleApps } = await admin
    .from('internship_applications')
    .select('id')
    .in('application_status', ['Applied', 'Under Review'])
    .lt('application_date', twoWeeksAgo)

  const toReject = (staleApps ?? []).filter(a => !interviewedIds.has(a.id)).map(a => a.id)
  if (toReject.length > 0) {
    await admin.from('internship_applications').update({ application_status: 'Rejected' }).in('id', toReject)
  }

  // Fetch display data
  const [
    { data: applications },
    { data: companies },
    { data: positions },
    { data: students },
    { data: interviews },
  ] = await Promise.all([
    admin.from('internship_applications').select('id, company_id, position_id, student_id, application_date, application_status'),
    admin.from('companies').select('id, company_name, industry, website, contact_email, contact_phone, address, logo_url').eq('is_visible', true),
    admin.from('company_positions').select('id, company_id, position_name, max_students, intake_date'),
    admin.from('students').select('id, first_name, last_name, student_code'),
    admin.from('interviews').select('id, application_id, interview_date, interview_type, result'),
  ])

  const apps = applications ?? []
  const cos  = companies ?? []
  const pos  = positions ?? []
  const stus = students ?? []
  const ivs  = interviews ?? []

  // Build full enriched data for every visible company
  const allCompanies = cos.map(company => {
    const compApps = apps.filter(a => a.company_id === company.id)
    const compPositions = pos
      .filter(p => p.company_id === company.id)
      .map(p => ({
        ...p,
        application_count: compApps.filter(a => a.position_id === p.id).length,
      }))
      .sort((a, b) => b.application_count - a.application_count)

    const isFull = compPositions.length > 0 &&
      compPositions.every(p => p.application_count >= p.max_students * 2)

    const total_remaining = compPositions.reduce(
      (sum, p) => sum + Math.max(0, p.max_students * 2 - p.application_count),
      0
    )

    const detailedApps = compApps
      .map(app => {
        const student = stus.find(s => s.id === app.student_id)
        const position = pos.find(p => p.id === app.position_id)
        const interview = ivs
          .filter(i => i.application_id === app.id)
          .sort((a, b) => new Date(b.interview_date).getTime() - new Date(a.interview_date).getTime())[0] ?? null
        return { ...app, student: student ?? null, position: position ?? null, interview }
      })
      .sort((a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime())

    return {
      ...company,
      total_applications: compApps.length,
      total_remaining,
      positions: compPositions,
      applications: detailedApps,
      isFull,
    }
  })

  // Tab 1: top 10 by most applications
  const topCompanies = [...allCompanies]
    .filter(c => c.total_applications > 0)
    .sort((a, b) => b.total_applications - a.total_applications)
    .slice(0, 10)

  // Tab 2: top 10 by most remaining slots (still has open capacity)
  const availableCompanies = [...allCompanies]
    .filter(c => c.total_remaining > 0)
    .sort((a, b) => b.total_remaining - a.total_remaining)
    .slice(0, 10)

  return <BoardPage topCompanies={topCompanies} availableCompanies={availableCompanies} />
}
