export const metadata = { title: '2027 Committee · CVMBS Research Day' }

const committee = [
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

export default function CommitteePage() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      <h1 className="text-3xl font-bold text-[#1E4D2B]">2027 Planning Committee</h1>
      <p className="text-gray-600">
        The volunteer committee organizing CVMBS Research Day 2027.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        {committee.map((m) => (
          <div
            key={m}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-800"
          >
            {m}
          </div>
        ))}
      </div>
    </div>
  )
}
