import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import PublicNav from '../components/PublicNav'
import Footer from '../components/Footer'
import ceypImg from '../images/ceyp-1.jpg'

// ─── Hero carousel slides ────────────────────────────────────────────────────

const SLIDES = [
  {
    tag: null,
    title: 'Beaverton Rotary Foundation Scholarships',
    body: 'Each year the Beaverton Rotary Foundation awards academic, vocational, and CEYP scholarships to qualifying students who live in Beaverton or attended a Beaverton School District high school.',
  },
  {
    tag: 'Academic',
    title: 'Academic Scholarships',
    body: 'Awarded to graduating high school seniors attending a college or university in Oregon. Recipients may receive up to $6,000 per year, renewable annually for up to four years of study.',
  },
  {
    tag: 'CEYP',
    title: 'CEYP Scholarships',
    body: 'Continuing Education for Young Parents supports young women who had a child prior to graduating high school, helping them pursue a career-focused education and a better future for their families.',
    image: ceypImg,
  },
  {
    tag: 'Vocational',
    title: 'Vocational Scholarships',
    body: 'For students pursuing trade schools, beauty schools, or other vocational programs. BRF supports career-ready students who choose skilled trades and technical education.',
  },
]

const INTERVAL_MS = 6000

function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)
  const timer = useRef<ReturnType<typeof setInterval>>()

  function goTo(index: number) {
    setVisible(false)
    setTimeout(() => {
      setCurrent(index)
      setVisible(true)
    }, 300)
  }

  function prev() {
    resetTimer()
    goTo((current - 1 + SLIDES.length) % SLIDES.length)
  }

  function next() {
    resetTimer()
    goTo((current + 1) % SLIDES.length)
  }

  function resetTimer() {
    clearInterval(timer.current)
    timer.current = setInterval(() => {
      setCurrent(c => {
        const next = (c + 1) % SLIDES.length
        setVisible(false)
        setTimeout(() => { setCurrent(next); setVisible(true) }, 300)
        return c
      })
    }, INTERVAL_MS)
  }

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timer.current)
  }, [])

  const slide = SLIDES[current]

  return (
    <section
      className="bg-blue-800 text-white py-16 px-6 text-center relative select-none overflow-hidden"
      style={slide.image ? { backgroundImage: `url(${slide.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {/* Dark overlay for slides with a background image */}
      {slide.image && <div className="absolute inset-0 bg-blue-900/70" />}

      {/* Slide content */}
      <div
        className="relative z-10 max-w-2xl mx-auto transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {slide.tag && (
          <span className="inline-block bg-blue-600 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            {slide.tag}
          </span>
        )}
        <h1 className="text-4xl font-bold mb-4">{slide.title}</h1>
        <p className="text-blue-100 text-lg">{slide.body}</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/about"
            className="bg-white text-blue-800 font-medium px-6 py-2.5 rounded-lg hover:bg-blue-50"
          >
            Learn More
          </Link>
          <Link
            to="/login?tab=register"
            className="border border-white text-white font-medium px-6 py-2.5 rounded-lg hover:bg-blue-700"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/60 hover:text-white text-3xl leading-none px-2"
      >
        ‹
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/60 hover:text-white text-3xl leading-none px-2"
      >
        ›
      </button>

      {/* Dot indicators */}
      <div className="relative z-10 flex justify-center gap-2 mt-8">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { resetTimer(); goTo(i) }}
            aria-label={`Go to slide ${i + 1}`}
            className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/35 hover:bg-white/60'}`}
          />
        ))}
      </div>
    </section>
  )
}

interface WindowItem {
  window_id: string
  name: string
  window_type: 'testing' | 'live'
  start_date: string
  end_date: string
  writing_prompt?: string
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function in30Days(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function Home() {
  const [windows, setWindows] = useState<WindowItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/windows/')
      .then(r => {
        const live = (r.data as WindowItem[]).filter(w => w.window_type === 'live')
        setWindows(live)
      })
      .finally(() => setLoading(false))
  }, [])

  const t = today()
  const soon = in30Days()
  const activeWindows   = windows.filter(w => w.start_date <= t && t <= w.end_date)
  const upcomingWindows = windows.filter(w => w.start_date > t && w.start_date <= soon)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicNav />

      <HeroCarousel />

      {/* Application Windows */}
      <section className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Scholarship Applications</h2>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : activeWindows.length > 0 ? (
          <div className="space-y-4">
            <p className="text-gray-600">Applications are currently open. Apply before the deadline.</p>
            {activeWindows.map(w => (
              <div key={w.window_id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        Open Now
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800">{w.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Deadline: {formatDate(w.end_date)}
                    </p>
                    {w.writing_prompt && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        Writing prompt: "{w.writing_prompt}"
                      </p>
                    )}
                  </div>
                  <Link
                    to="/login?tab=register"
                    className="shrink-0 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : upcomingWindows.length > 0 ? (
          <div className="space-y-4">
            <p className="text-gray-600">Applications are not yet open, but a window is opening soon.</p>
            {upcomingWindows.map(w => (
              <div key={w.window_id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    Opening Soon
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800">{w.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Opens: {formatDate(w.start_date)} &mdash; Closes: {formatDate(w.end_date)}
                </p>
              </div>
            ))}
            <p className="text-sm text-gray-500">
              <Link to="/login?tab=register" className="text-blue-600 hover:underline">
                Create an account
              </Link>{' '}
              now so you're ready to apply when the window opens.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6 text-center space-y-2">
            <p className="font-medium text-gray-700">Applications are closed at this time.</p>
            <p className="text-sm text-gray-500">
              The next scholarship cycle typically opens in the spring. Check back soon or{' '}
              <Link to="/login?tab=register" className="text-blue-600 hover:underline">
                create an account
              </Link>{' '}
              to be ready when applications open.
            </p>
          </div>
        )}
      </section>
      <Footer />
    </div>
  )
}
