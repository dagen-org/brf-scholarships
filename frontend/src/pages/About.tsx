import PublicNav from '../components/PublicNav'

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-800 mb-3">About the Program</h1>
          <p className="text-gray-700 leading-relaxed">
            The <a href="https://www.beavertonrotary.org/beaverton-rotary-foundation/" className="text-blue-600 hover:underline" target="_blank">
              Beaverton Rotary Foundation
            </a>  sponsors college, vocational, and CEYP scholarships
            to Beaverton area students. Each year, the Foundation awards financial assistance to
            qualifying applicants who reside in the city of Beaverton or attended high school
            within the Beaverton School District.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Scholarship Types</h2>

          <div className="bg-white rounded-xl shadow p-6 space-y-2">
            <h3 className="font-semibold text-blue-700">Academic</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Awarded to graduating high school seniors planning to attend a college or university
              in Oregon. Recipients may receive up to $3,000 for their first year of study.  Recipients may submit a renewal application in the second year of study for a maximum benefit of $6,000.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 space-y-2">
            <h3 className="font-semibold text-blue-700">Academic Renewal</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Available to students who have previously received an Academic scholarship and are
              continuing their second year of study in Oregon. 
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 space-y-2">
            <h3 className="font-semibold text-blue-700">Vocational</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Designed for students pursuing trade schools, beauty schools, or other vocational
              programs in Oregon. This scholarship supports career-focused education outside the traditional
              four-year college path.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 space-y-2">
            <h3 className="font-semibold text-blue-700">CEYP — Continuing Education for Young Parents</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              A special scholarship for young parents who had a child prior to graduating high school.
              CEYP awards help recipients pursue education and career opportunities in Oregonthat provide
              stability for their families.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">How to Apply</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Applications are accepted during open scholarship windows, typically in the spring.
            Use the <a href="/login?tab=register" className="text-blue-600 hover:underline">
              Register
            </a> link to create a free account. You must reside in Beaverton or have attended a
            Beaverton School District high school to be eligible.
          </p>
        </div>
      </main>
    </div>
  )
}
