import { Info, Users, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'About · CVMBS Research Day',
}

// Placeholder committee list — replace when the 2027 committee is confirmed.
const committeeMembers = [
  'Aimee Oke',
  // TODO: add 2027 committee members
]

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      <h1 className="text-3xl font-bold text-[#1E4D2B]">About Research Day</h1>

      <Section icon={<Info size={22} />} title="About the Event">
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          2027 event copy is being finalized — this page will be updated soon.
        </p>
        <p>
          Research Day is an annual showcase celebrating research from the College of
          Veterinary Medicine and Biomedical Sciences community. The symposium gives
          students, faculty, and staff an opportunity to present their work, connect with
          colleagues across CSU, and explore different disciplines.
        </p>
        <p>
          The event features presentations spanning foundational, translational, clinical,
          and social science / pedagogy research, along with poster sessions, oral
          presentations, and a keynote address.
        </p>
        <p className="text-sm text-gray-500">
          Share your experience using{' '}
          <span className="font-semibold text-[#1E4D2B]">#CVMBSResearchDay</span>
        </p>
      </Section>

      <Section icon={<Users size={22} />} title="2027 Planning Committee">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {committeeMembers.map((m) => (
            <div key={m} className="bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium text-gray-800">
              {m}
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<Sparkles size={22} />} title="About This Site">
        <p>
          This site was built by{' '}
          <a
            href="https://aimeeoke.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1E4D2B] font-semibold hover:underline"
          >
            Aimee Oke
          </a>{' '}
          using &ldquo;vibe coding&rdquo; — collaborating with AI to build tools that make
          our community&apos;s work easier.
        </p>
        <p className="text-sm text-gray-500">
          Questions or feedback? Email the Research Day committee.
        </p>
      </Section>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-[#1E4D2B]">{icon}</div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-4 space-y-3 text-gray-700 text-sm sm:text-base">{children}</div>
    </div>
  )
}
