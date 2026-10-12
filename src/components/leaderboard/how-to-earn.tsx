import Link from 'next/link'

/**
 * Three-column "How to earn points" card from the committee build plan
 * (Part 3.2 · build item 1f). Content is verbatim from the spec so the
 * card and the doc agree.
 */
export default function HowToEarn() {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-900">
        How to earn points
      </h2>
      <div className="mt-3 grid md:grid-cols-3 gap-4">
        <Column
          emoji="🎓"
          title="Presenters"
          items={[
            'Submit early (Early Bird 🐣)',
            'Pick your mentors',
            'Check your affiliations',
          ]}
        />
        <Column
          emoji="🌱"
          title="Every author"
          items={[
            <>
              Complete the free{' '}
              <Link
                href="https://mygreenlab.org/programs/ambassador-program/"
                className="underline hover:text-[#1E4D2B]"
                target="_blank"
                rel="noreferrer"
              >
                My Green Lab Ambassador training
              </Link>{' '}
              and upload your certificate. Each one is worth 10 points for
              your department.
            </>,
          ]}
        />
        <Column
          emoji="📋"
          title="Faculty, postdocs & staff"
          items={[
            <>
              Volunteer to{' '}
              <Link href="/judge" className="underline hover:text-[#1E4D2B]">
                judge
              </Link>{' '}
              and win the Clipboard Cup for your department.
            </>,
          ]}
        />
      </div>
    </section>
  )
}

function Column({
  emoji,
  title,
  items,
}: {
  emoji: string
  title: string
  items: React.ReactNode[]
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900">
        <span className="mr-1" aria-hidden>
          {emoji}
        </span>
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
        {items.map((item, i) => (
          <li key={i} className="leading-snug">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
