import Link from 'next/link'
import {
  Award,
  Calendar,
  Info,
  MapPin,
  Sparkles,
  Ticket,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'

export const metadata = {
  title: 'About · CVMBS Research Day',
}

const committeeMembers = [
  'Katriana Popichak',
  'AC Bobadilla',
  'Debbie Lee',
  'Rio Tang',
  'Natasha Janke',
  'Jason Lombard',
  'Aimee Oke',
  'Vanessa Selwyn',
  'Wendy Stevenson',
]

const ORAL_CATEGORIES = [
  'Foundational Research',
  'Translational Research',
  'Veterinary Clinical Research',
]
const POSTER_CATEGORIES = [
  'Foundational Research',
  'Translational Research',
  'Veterinary Clinical Research',
  'Pedagogy Research',
]
const UNDERGRAD_CATEGORIES = [
  'Foundational',
  'Translational',
  'Veterinary Clinical',
  'Pedagogy',
]

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Section 1 — Hero */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1E4D2B]">
            About CVMBS Research Day
          </h1>
          <p className="mt-2 text-base sm:text-lg text-gray-700 italic">
            28 years of curiosity, caffeine and really good posters.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <QuickFact icon={<Calendar size={16} />}>
            Saturday, January 23, 2027
          </QuickFact>
          <QuickFact icon={<MapPin size={16} />}>
            Translational Medicine Institute
          </QuickFact>
          <QuickFact icon={<Ticket size={16} />}>
            Free and open to the community
          </QuickFact>
        </div>
      </div>

      {/* Section 2 — About the Event */}
      <Section icon={<Info size={22} />} title="About the Event">
        <p>
          Research Day is the College of Veterinary Medicine and Biomedical
          Sciences&apos; yearly celebration of the science happening in our
          labs, clinics, classrooms and field sites. For one day, students,
          trainees, faculty and staff come together to show what they&apos;ve
          been working on. They get to ask each other hard questions and find
          collaborators they didn&apos;t know were down the hall, or across
          campus.
        </p>
        <p>
          This is our <strong>28th year</strong>. The program covers the whole
          spectrum:{' '}
          <strong>
            foundational, translational, veterinary clinical and pedagogy
            research
          </strong>
          , presented through poster sessions, oral talks and a keynote
          address. Whether you&apos;re presenting for the first time or the
          fifteenth, there&apos;s a spot for you here. The event is free and
          open to the local community, so bring a friend, a labmate or your
          favorite skeptic.
        </p>
        <p className="text-sm text-gray-600">
          <strong className="text-gray-900">Share the fun:</strong> Post with{' '}
          <span className="font-semibold text-[#1E4D2B]">
            #CVMBSResearchDay
          </span>{' '}
          and tag{' '}
          <a
            href="https://www.instagram.com/csuvetmedbiosci/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#1E4D2B] hover:underline"
          >
            @csuvetmedbiosci
          </a>{' '}
          on Instagram.
        </p>
      </Section>

      {/* Section 3 — Awards & Bragging Rights */}
      <Section icon={<Trophy size={22} />} title="Awards & Bragging Rights">
        <p>
          Research Day is about the science, but a little friendly competition
          never hurt anybody. This year there are{' '}
          <strong>three college-level awards</strong> up for grabs, plus
          prizes for presenters in every category.
        </p>
        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <AwardCard accent="gold" emoji="🥇" name="The Golden Pipette">
            <p className="font-semibold text-gray-900">
              The department with the highest average presenter score takes it home.
            </p>
            <p>
              Every presenter&apos;s score counts toward their
              department&apos;s average, so every poster and every talk
              matters. The Golden Pipette is currently held by the{' '}
              <strong>
                Department of Microbiology, Immunology &amp; Pathology (MIP)
              </strong>
              , who took it from{' '}
              <strong>
                Environmental &amp; Radiological Health Sciences (ERHS)
              </strong>
              , the 2025 champions. Will MIP defend the title? Will ERHS take
              it back? Will another department sneak in and steal it? Stay
              tuned.
            </p>
            <p className="text-xs text-gray-600">
              <strong>Reigning champion:</strong> Microbiology, Immunology
              &amp; Pathology
              <br />
              <strong>2025 champion:</strong> Environmental &amp; Radiological
              Health Sciences
            </p>
          </AwardCard>

          <AwardCard accent="green" emoji="🌱" name="The Green Pipette">
            <p className="font-semibold text-gray-900">
              Sustainable science is great science.
            </p>
            <p>
              Goes to the department showing the strongest commitment to
              sustainability across the projects presented at Research Day.
              Projects earn points two ways:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[13px]">
              <li>
                <strong>Train up (10 pts per certified ambassador).</strong>{' '}
                Complete the free{' '}
                <a
                  href="https://mygreenlab.org/programs/ambassador-program/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1E4D2B] font-semibold underline hover:text-[#163d22]"
                >
                  My Green Lab Ambassador Program
                </a>{' '}
                (self-paced, online, less than 3 hours). Up to 100 pts per
                project — every co-author who finishes the training raises
                the score.
              </li>
              <li>
                <strong>Work green (100 pts per project).</strong> Projects
                done in a certified sustainable space earn 100 bonus points.
                Research labs qualify through{' '}
                <a
                  href="https://mygreenlab.org/programs/mgl-certification/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1E4D2B] font-semibold underline hover:text-[#163d22]"
                >
                  My Green Lab Certification
                </a>{' '}
                and clinical spaces through{' '}
                <a
                  href="https://www.veterinarysustainabilityalliance.org/clinic-certification"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1E4D2B] font-semibold underline hover:text-[#163d22]"
                >
                  Green Paw Certification
                </a>
                . Currency required as of December 31, 2026.
              </li>
            </ul>
            <p className="text-xs">
              <strong className="text-gray-900">How to claim your points:</strong>{' '}
              Upload your Ambassador certificate and any lab or clinic
              certification through the abstract submission portal. Updates
              allowed until the posted deadline. The pre-loaded list is on
              the <Link href="/green-labs" className="text-[#1E4D2B] font-semibold underline hover:text-[#163d22]">Green Labs page</Link> — if
              your name is there, you&apos;re already credited.
            </p>
            <p className="text-xs">
              <strong className="text-gray-900">Get a head start:</strong> The
              Green Pipette standings go live on the leaderboard on{' '}
              <strong>November 18</strong>.
            </p>
          </AwardCard>

          <AwardCard
            accent="platinum"
            emoji="🥈"
            name="The Platinum Mentoring Award"
            badge="NEW"
          >
            <p className="font-semibold text-gray-900">
              Great science starts with great mentors.
            </p>
            <p>
              This is a brand-new award for 2027. It goes to the{' '}
              <strong>faculty member with the most mentees presenting</strong>{' '}
              at Research Day. Mentors, this is your moment: encourage your
              students, residents, postdocs and staff to submit.
            </p>
          </AwardCard>
        </div>
      </Section>

      {/* Section 4 — Presenter Awards */}
      <Section icon={<Award size={22} />} title="Presenter Awards">
        <p>
          Judges score every presentation, and the top three in each category
          win cash prizes:
        </p>
        <div className="overflow-hidden rounded-lg border border-gray-200 max-w-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">
                  Place
                </th>
                <th className="text-right px-3 py-2 font-semibold text-gray-700">
                  Prize
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <PrizeRow place="🥇 1st place" prize="$300" />
              <PrizeRow place="🥈 2nd place" prize="$150" />
              <PrizeRow place="🥉 3rd place" prize="$75" />
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Categories</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1.5">
                Oral presentations
              </div>
              <p className="text-xs text-gray-600 mb-1.5">
                Each judged in separate <em>Advanced Stage</em> and{' '}
                <em>Early Stage</em> divisions.
              </p>
              <ChipList items={ORAL_CATEGORIES} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1.5">
                Poster presentations
              </div>
              <p className="text-xs text-gray-600 mb-1.5">
                Advanced &amp; Early Stage for the first three; Pedagogy
                combined.
              </p>
              <ChipList items={POSTER_CATEGORIES} />
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1.5">
                Undergraduate posters
              </div>
              <ChipList items={UNDERGRAD_CATEGORIES} />
            </div>
          </div>
        </div>

        <div className="pt-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Who&apos;s eligible to win?
          </h3>
          <p className="text-sm">Cash prizes are open to:</p>
          <ul className="list-disc pl-5 mt-1 text-sm space-y-0.5">
            <li>
              students enrolled in a <strong>CVMBS</strong> or{' '}
              <strong>Cell &amp; Molecular Biology (CMB)</strong> program,{' '}
              <strong>or</strong>
            </li>
            <li>
              anyone <strong>currently employed by CVMBS</strong>.
            </li>
          </ul>
          <p className="text-sm mt-1.5 text-gray-600">
            Everyone else is warmly welcome to present, but isn&apos;t
            eligible for the prizes.
          </p>
        </div>

        <p className="text-sm">
          <strong className="text-gray-900">How prizes are paid:</strong>{' '}
          Winners are paid through the <strong>CSU payroll system</strong>.
        </p>

        <p className="text-sm">
          <strong className="text-gray-900">
            Curious who won last year?
          </strong>{' '}
          →{' '}
          <Link
            href="/winners-2026"
            className="text-[#1E4D2B] font-semibold underline hover:text-[#163d22]"
          >
            See the 2026 winners
          </Link>
        </p>
      </Section>

      {/* Section 5 — Watch the Leaderboard callout */}
      <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={24} className="text-[#1E4D2B]" />
          <h2 className="text-xl font-bold text-gray-900">
            Follow the race live 📈
          </h2>
        </div>
        <p className="text-sm text-gray-800">
          The leaderboard is live during Research Day, so you can watch the
          Golden Pipette standings update as scores come in.
        </p>
        <p className="text-sm text-gray-800">
          <strong>The Green Pipette race starts early.</strong> Its standings
          appear on the leaderboard starting <strong>November 18</strong>.
          Every co-author who completes the My Green Lab Ambassador training
          earns points for their department, so recruit your labmates, send
          the link to your co-authors and help your department climb.
        </p>
        <div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22]"
          >
            View the Leaderboard →
          </Link>
        </div>
      </div>

      {/* Section 6 — Planning Committee */}
      <Section icon={<Users size={22} />} title="2027 Planning Committee">
        <p className="text-sm text-gray-600">
          The people who make Research Day happen. Say thanks if you see them
          running around with clipboards!
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {committeeMembers.map((m) => (
            <div
              key={m}
              className="bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium text-gray-800"
            >
              {m}
            </div>
          ))}
        </div>
      </Section>

      {/* Section 7 — About This Site */}
      <Section icon={<Sparkles size={22} />} title="About This Site">
        <p>
          This site was built by <strong>Aimee Oke</strong> through &ldquo;vibe
          coding,&rdquo; which means working with AI to build tools that make
          our community&apos;s work easier. No computer science degree
          required, just a lot of curiosity (and a little stubbornness).
        </p>
        <p className="text-sm text-gray-600">
          Questions, feedback or found a bug? Email the Research Day
          committee.
        </p>
      </Section>
    </div>
  )
}

// -------- Building blocks --------

function QuickFact({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#1E4D2B]/20 bg-[#1E4D2B]/5 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-800">
      <span className="text-[#1E4D2B] flex-shrink-0">{icon}</span>
      <span>{children}</span>
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
      <div className="p-4 space-y-3 text-gray-700 text-sm sm:text-base">
        {children}
      </div>
    </div>
  )
}

function AwardCard({
  accent,
  emoji,
  name,
  badge,
  children,
}: {
  accent: 'gold' | 'green' | 'platinum'
  emoji: string
  name: string
  badge?: string
  children: React.ReactNode
}) {
  const accentClasses: Record<typeof accent, { border: string; bg: string; text: string }> = {
    gold: {
      border: 'border-amber-300',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
    },
    green: {
      border: 'border-green-300',
      bg: 'bg-green-50',
      text: 'text-green-900',
    },
    platinum: {
      border: 'border-slate-300',
      bg: 'bg-slate-50',
      text: 'text-slate-800',
    },
  }
  const a = accentClasses[accent]
  return (
    <div
      className={`rounded-lg border-2 ${a.border} ${a.bg} p-3 space-y-2 flex flex-col`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-2xl leading-none">{emoji}</span>
          <h3 className={`text-base font-bold ${a.text}`}>{name}</h3>
        </div>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#1E4D2B] text-white flex-shrink-0">
            ✨ {badge}
          </span>
        )}
      </div>
      <div className="text-xs sm:text-sm text-gray-700 space-y-1.5 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function PrizeRow({ place, prize }: { place: string; prize: string }) {
  return (
    <tr>
      <td className="px-3 py-2 text-gray-800">{place}</td>
      <td className="px-3 py-2 text-right font-bold text-[#1E4D2B]">{prize}</td>
    </tr>
  )
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((c) => (
        <span
          key={c}
          className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-gray-200 text-xs text-gray-800"
        >
          {c}
        </span>
      ))}
    </div>
  )
}
