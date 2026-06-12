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
    admin.from('company_positions').select('id, company_id, position_name, max_students'),
    admin.from('students').select('id, first_name, last_name, student_code'),
    admin.from('interviews').select('id, application_id, interview_date, interview_type, result'),
  ])

  const apps = applications ?? []
  const cos  = companies ?? []
  const pos  = positions ?? []
  const stus = students ?? []
  const ivs  = interviews ?? []

  const countMap: Record<string, number> = {}
  apps.forEach(a => { countMap[a.company_id] = (countMap[a.company_id] ?? 0) + 1 })

  const topIds = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  const topCompanies = topIds.map(cid => {
    const company = cos.find(c => c.id === cid)!
    const compApps = apps.filter(a => a.company_id === cid)
    const compPositions = pos
      .filter(p => p.company_id === cid)
      .map(p => ({
        ...p,
        application_count: compApps.filter(a => a.position_id === p.id).length,
      }))
      .sort((a, b) => b.application_count - a.application_count)

    const isFull = compPositions.length > 0 &&
      compPositions.every(p => p.application_count >= p.max_students * 2)

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
      total_applications: countMap[cid],
      positions: compPositions,
      applications: detailedApps,
      isFull,
    }
  })

  return <BoardPage companies={topCompanies} />
}
