import { Trophy, Mic, LayoutGrid, Award } from 'lucide-react'

export const metadata = { title: '2026 Winners · CVMBS Research Day' }

type Winner = {
  place: 1 | 2 | 3
  name: string
  dept: string
  title: string
}

type Category = {
  name: string
  winners: Winner[]
}

const oralCategories: Category[] = [
  {
    name: 'Foundational Research, Advanced Stage',
    winners: [
      { place: 1, name: 'Julia Hilliard', dept: 'MIP', title: 'Human serum proteins hemopexin and transferrin induce SaeRS-dependent biofilm architecture in Staphylococcus aureus' },
      { place: 2, name: 'Leo Tyer', dept: 'MIP', title: 'IBA1+ cells in the nodose ganglion mediate gut-brain axis disruption in high-fat fed rats' },
      { place: 3, name: 'Molly Uhrig', dept: 'ERHS', title: 'RAD54L protects DNA replication forks from G-quadruplex induced damage' },
    ],
  },
  {
    name: 'Foundational Research, Early Stage',
    winners: [
      { place: 1, name: 'Taylor Crisologo', dept: 'MIP', title: 'Broadly cross-reactive antibodies detected in cats infected with SARS-CoV-2 variants WA-1 and Omicron XBB.1.5 in an ELISA' },
      { place: 2, name: 'Tatianna Travieso', dept: 'MIP', title: 'Genomic and transcriptomic profiling reveals two distinct subtypes of canine small cell B-cell lymphoma' },
      { place: 3, name: 'Isabella Faulkner', dept: 'CS', title: 'Impact of macronutrient composition on adiposity and inflammatory profiles in BPH/5 mice' },
    ],
  },
  {
    name: 'Translational Research, Advanced Stage',
    winners: [
      { place: 1, name: 'Marika Klosowski', dept: 'MIP', title: 'Cancer-associated fibroblasts modulate the metastatic osteosarcoma immune microenvironment and enable CAR T cell targeting' },
      { place: 2, name: 'Madeleine Moseley', dept: 'BMS', title: 'Lack of Tau Expression Attenuates Epileptogenesis Associated Neuroplasticity in the Ventral Dentate Gyrus in a Model of Acquired TLE' },
      { place: 3, name: 'Adam Schuller', dept: 'ERHS', title: 'Genetic STING ablation protects against astrocyte-mediated dopaminergic neurodegeneration in vitro and motor dysfunction in vivo in the rotenone model of Parkinson’s disease' },
    ],
  },
  {
    name: 'Translational Research, Early Stage',
    winners: [
      { place: 1, name: 'Owen Bevis', dept: 'ERHS', title: 'Telomeric RNA (TERRA) is Elevated in Canine Osteosarcoma, a Hallmark of the Alternative Lengthening of Telomeres (ALT) Pathway' },
      { place: 2, name: 'Rui Shang', dept: 'CS', title: 'Immune Responses in Radiosensitive and Radioresistant Orthotopic Syngeneic Rat Models of Sinonasal Carcinoma' },
      { place: 3, name: 'Emily Perkins', dept: 'MIP', title: 'Establishing molecular mechanisms of glial-mediated response in a chronic pain in vitro model' },
    ],
  },
  {
    name: 'Veterinary Clinical Research, Advanced Stage',
    winners: [
      { place: 1, name: 'Samantha Masca', dept: 'CS', title: 'Outcomes of surgical patent ductus arteriosus ligations performed by veterinary surgery residents on shelter animals: a retrospective study of 100 cases (2011–2025)' },
      { place: 2, name: 'Raul Gonzalez-Castro', dept: 'BMS', title: 'Extended incubation induces equine sperm hyperactivation and tyrosine phosphorylation as potential predictors of in vitro fertilization success' },
      { place: 3, name: 'Powell Slinkard', dept: 'ERHS', title: 'Computed tomography findings in pigs with confirmed abdominal pathology' },
    ],
  },
  {
    name: 'Veterinary Clinical Research, Early Stage',
    winners: [
      { place: 1, name: 'Patricio Razquin', dept: 'CS', title: 'Temporal decline in serum acetate at day 34 of gestation parallels FFAR2 expression in the equine chorionic girdle' },
      { place: 2, name: 'Jacob Singer', dept: 'CS', title: 'Cellular Senescence Pathways are Upregulated in Equine Aging-Related Osteoarthritis' },
      { place: 3, name: 'Alex Stigall', dept: 'CS', title: 'Biomechanical Evaluation of an Ultrasound-Guided Percutaneous Biopsy for Investigating Canine Common Calcaneal Tendinopathy' },
    ],
  },
]

const posterCategories: Category[] = [
  {
    name: 'Foundational Research, Advanced Stage',
    winners: [
      { place: 1, name: 'Scott Roh', dept: 'BMS', title: 'The role of autism-related β-catenin in prefrontal local circuits' },
      { place: 2, name: 'Lauren Young', dept: 'BMS', title: 'Intracerebroventricular injection of neuropeptide Y suppresses luteinizing hormone pulses in mice' },
      { place: 3, name: 'Ghyslaine Ramirez', dept: 'BMS', title: 'Elucidating the carryover impact of antioxidant supplementation during oocyte maturation under heat stress on pre-implantation embryos developmental competence' },
    ],
  },
  {
    name: 'Foundational Research, Early Stage',
    winners: [
      { place: 1, name: 'Vanessa Correa', dept: 'BMS', title: 'The role of prefrontal autism-related β-catenin in social behavior' },
      { place: 2, name: 'Ana Valeria Castro Romero', dept: 'BMS', title: 'A tale of two columns: differential synaptic processing in the fear circuit' },
      { place: 3, name: 'Naija Cuzmar', dept: 'MIP', title: 'Mercury Exposure in Companion Animals: A Sentinel Study for Environmental Contamination' },
    ],
  },
  {
    name: 'Translational Research, Advanced Stage',
    winners: [
      { place: 1, name: 'Ahmed Gad', dept: 'CS', title: 'Circadian regulation of endometrial receptivity in a sheep organoid model' },
      { place: 2, name: 'Brandi Dunn', dept: 'CS', title: 'Trusting Nature’s Blueprint: Polarity-Reversed Oviductal Organoids Advancing Cross-Species Fertility Solutions' },
    ],
  },
  {
    name: 'Translational Research, Early Stage',
    winners: [
      { place: 1, name: 'Tiffini Lovell', dept: 'BMS', title: 'The behavioral and cellular effects of psilocin on fentanyl seeking in male and female mice' },
      { place: 2, name: 'Katelyn McClellan', dept: 'Other', title: 'Uncovering patterns of infant mortality in vervet monkeys: a retrospective necropsy analysis' },
      { place: 3, name: 'Kendall Malmstrom', dept: 'MIP', title: 'Investigating cell-intrinsic and extrinsic mechanisms of FAK-driven osteosarcoma metastasis' },
    ],
  },
  {
    name: 'Veterinary Clinical Research, Advanced Stage',
    winners: [
      { place: 1, name: 'Grace Jakes', dept: 'CS', title: 'Effects of Parenteral Immune Stimulation with Vaccines and Non-Specific TLR Agonists on Pulmonary Immune Responses in Pre-Weaned Calves' },
      { place: 2, name: 'Charles Talbot', dept: 'CS', title: 'Pro-inflammatory Cytokine Exposure Unexpectedly Increases Glycocalyx Expression by Canine Pulmonary Endothelial Cells' },
    ],
  },
  {
    name: 'Veterinary Clinical Research, Early Stage',
    winners: [
      { place: 1, name: 'Emma Mangold', dept: 'CS', title: 'Immune Responses to STING Pathway Activation by Canine Tumors And Leukocytes' },
      { place: 2, name: 'Hikaru Shiraishi', dept: 'CS', title: 'Intraocular pressures in free-ranging red-tailed hawks (Buteo jamaicensis), red-shouldered hawks (Buteo lineatus), and broad-winged hawks (Buteo platypterus) using rebound tonometry' },
      { place: 3, name: 'Benjamin Goldblatt', dept: 'CS', title: 'Establishing the clinical utility of erythropoietin concentrations in healthy brachycephalic and non-brachycephalic dogs at 1,535 meters altitude' },
    ],
  },
  {
    name: 'Pedagogy Research',
    winners: [
      { place: 1, name: 'Gehena Girish', dept: 'MIP', title: 'Expansion of Scientist Spotlights in the Online Graduate Classroom' },
      { place: 2, name: 'Delaney Worthington', dept: 'MIP', title: 'Exploring the impact of a science communication training and mentorship program for undergraduate biomedical sciences students' },
      { place: 3, name: 'Kelly Greenhut', dept: 'MIP', title: 'CSU’s Veterinary Clients are Climate-Engaged and Seek Resources to Safeguard Pet Health from Environmental Hazards' },
    ],
  },
  {
    name: 'Foundational Research, Undergraduate',
    winners: [
      { place: 1, name: 'Jessica Gamble', dept: 'MIP', title: 'Determining the temporal distribution of prions shed in nasal secretions of white-tailed deer inoculated with Nordic CWD' },
      { place: 2, name: 'Socks Jones', dept: 'MIP', title: 'Novel Method of Blood Pathogen Reduction Via UV Light and Riboflavin for Treatment of Whole Blood' },
      { place: 3, name: 'Tiarnan LoCascio', dept: 'MIP', title: 'Decoding GdpS/GdpP regulation of c-di-AMP in Staphylococcus aureus' },
    ],
  },
  {
    name: 'Translational Research, Undergraduate',
    winners: [
      { place: 1, name: 'Quinn Pogge', dept: 'MIP', title: 'Semaglutide Attenuates Macrophage and Primary Mixed Glia Mediated Inflammatory Response in an In Vitro Murine Model' },
      { place: 2, name: 'Kianna Walz', dept: 'Other', title: 'The Thoroughbred Theory: Influence of Breed on Performance at the 5*L Level of Eventing' },
      { place: 3, name: 'Sophie Downing', dept: 'CS', title: 'Development of a Quantitative PCR Assay for Lactobacillus Detection in Murine Fecal Samples as a Complement to 16S rRNA Gene Sequencing' },
    ],
  },
  {
    name: 'Veterinary Clinical Research, Undergraduate',
    winners: [
      { place: 1, name: 'Isabella Hamner', dept: 'CS', title: 'Pulsed Electromagnetic Field Therapy Mitigates Endometrial Inflammation Associated with Persistent Breeding-Induced Endometritis in Horses' },
      { place: 2, name: 'Jocelyn Howard', dept: 'Other', title: 'Assessing the impact of Metacare supplementation on persistent breeding-induced endometritis' },
      { place: 3, name: 'Genevieve Denison', dept: 'Other', title: 'Resveratrol Supplementation Improves Uterine Immune Resolution in Mares Susceptible to Persistent Breeding-Induced Endometritis' },
    ],
  },
  {
    name: 'Pedagogy Research, Undergraduate',
    winners: [
      { place: 1, name: 'Charlotte Olszewski', dept: 'MIP', title: 'Scientist Highlights in the Classroom: Relationship between Scientist Relatability and Student Feelings of Belonging in STEM' },
      { place: 2, name: 'Ashley Morris', dept: 'BMS', title: 'Long Term Social and Health Effects of the Fukushima Disaster' },
    ],
  },
]

const departmentAwards = [
  { name: 'Golden Pipette', recipient: 'Department of Microbiology, Immunology, and Pathology' },
  { name: 'Green Pipette', recipient: 'Department of Microbiology, Immunology, and Pathology' },
]

const deptFull: Record<string, string> = {
  MIP: 'Microbiology, Immunology, and Pathology',
  BMS: 'Biomedical Sciences',
  CS: 'Clinical Sciences',
  ERHS: 'Environmental and Radiological Health Sciences',
  Other: 'Other / Cross-college',
}

export default function Winners2026Page() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-[#1E4D2B]">2026 Award Winners</h1>
        <p className="text-gray-600 mt-1">
          Congratulations to all presenters at CVMBS Research Day 2026.
        </p>
      </div>

      <Section icon={<Mic size={22} />} title="Oral Presentations">
        {oralCategories.map((c) => (
          <CategoryBlock key={c.name} category={c} />
        ))}
      </Section>

      <Section icon={<LayoutGrid size={22} />} title="Poster Presentations">
        {posterCategories.map((c) => (
          <CategoryBlock key={c.name} category={c} />
        ))}
      </Section>

      <Section icon={<Award size={22} />} title="Department Awards">
        <div className="grid sm:grid-cols-2 gap-3">
          {departmentAwards.map((a) => (
            <div key={a.name} className="bg-[#F0EEDA] border border-[#C8C372] rounded-lg p-3">
              <div className="flex items-center gap-2 text-[#1E4D2B] font-bold text-sm">
                <Trophy size={16} />
                {a.name}
              </div>
              <div className="text-sm text-gray-800 mt-1">{a.recipient}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-xs text-gray-600">
        <span className="font-semibold text-gray-800">Department key: </span>
        {Object.entries(deptFull)
          .map(([k, v]) => `${k} = ${v}`)
          .join(' · ')}
      </div>
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
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

function CategoryBlock({ category }: { category: Category }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#1E4D2B] mb-2">
        {category.name}
      </h3>
      <ol className="space-y-2">
        {category.winners.map((w) => (
          <li
            key={`${category.name}-${w.place}`}
            className="flex gap-3 items-start border-l-2 border-[#C8C372] pl-3"
          >
            <PlaceBadge place={w.place} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900">
                {w.name}{' '}
                <span className="text-xs font-medium text-gray-500">({w.dept})</span>
              </div>
              <div className="text-sm text-gray-700 mt-0.5">{w.title}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function PlaceBadge({ place }: { place: 1 | 2 | 3 }) {
  const styles = {
    1: 'bg-[#1E4D2B] text-white',
    2: 'bg-[#C8C372] text-[#1E4D2B]',
    3: 'bg-gray-200 text-gray-800',
  }
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${styles[place]}`}
    >
      {place}
    </span>
  )
}
