import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const FEATURES = [
  {
    icon: '🗺️',
    title: 'ML-Powered Recommendations',
    description: 'Trained TF-IDF model with cosine similarity ranks places based on your interests, budget, and preferences.',
  },
  {
    icon: '🔀',
    title: 'TSP Route Optimization',
    description: 'Our algorithm computes the most efficient visit order using Dynamic Programming and Nearest Neighbor heuristics.',
  },
  {
    icon: '💰',
    title: 'Cost Estimation',
    description: 'Get detailed cost breakdowns for stay, food, transport, and entry tickets across budget tiers.',
  },
  {
    icon: '🍽️',
    title: 'Restaurant Suggestions',
    description: 'Discover top-rated restaurants along your planned route, filtered by your budget.',
  },
  {
    icon: '📍',
    title: 'Interactive Maps',
    description: 'Visualize your entire route on an interactive map with all destinations pinned.',
  },
  {
    icon: '📅',
    title: 'Timeline View',
    description: 'Beautiful day-by-day timeline showing your optimized itinerary with place details.',
  },
]

const STEPS = [
  { step: '1', title: 'Enter Preferences', desc: 'Choose your city, budget, days, pace, and interests.' },
  { step: '2', title: 'ML Model Recommends', desc: 'Our trained ML model recommends places using TF-IDF content-based filtering and optimizes routes via TSP.' },
  { step: '3', title: 'Explore & Travel', desc: 'View your day-wise itinerary, map, and restaurant suggestions.' },
]

function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="-mx-4 -mt-8 sm:-mx-6 lg:-mx-8">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-cyan-800 px-4 py-20 text-center text-white sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Smart Itinerary Planner
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-cyan-100 sm:text-xl">
          AI-powered travel planning with TSP-optimized routes, cost estimation, and personalized day-wise itineraries.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? '/create-trip' : '/signup'}
            className="rounded-xl bg-white px-8 py-3 text-base font-bold text-brand-700 shadow-lg transition hover:bg-cyan-50"
          >
            {isAuthenticated ? 'Plan a Trip' : 'Get Started Free'}
          </Link>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="rounded-xl border-2 border-white/40 px-8 py-3 text-base font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Sign In
            </Link>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-slate-900">How It Works</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-slate-900">Features</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
            Everything you need to plan the perfect trip, powered by intelligent algorithms.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-3 text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ML Model Showcase CTA */}
      <section className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-semibold uppercase tracking-wider">No External APIs</span>
          <h2 className="mt-4 text-3xl font-bold">Powered by Our Trained ML Models</h2>
          <p className="mx-auto mt-3 max-w-2xl text-violet-100">
            This app does <strong>not</strong> call any third-party recommendation API. Every place recommendation comes from a <strong>TF-IDF + Cosine Similarity</strong> model
            trained on 271 places across 38 Indian cities using <strong>scikit-learn</strong>. Sentiment analysis uses a <strong>Multinomial Naive Bayes</strong> classifier.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/ml-model"
              className="rounded-xl bg-white px-8 py-3 text-base font-bold text-violet-700 shadow-lg transition hover:bg-violet-50"
            >
              🧠 Explore the ML Model
            </Link>
            <Link
              to="/optimize-route"
              className="rounded-xl border-2 border-white/40 px-8 py-3 text-base font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              🔀 Try Route Optimizer
            </Link>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold">271</div>
              <div className="text-xs text-violet-200">Training Samples</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold">38</div>
              <div className="text-xs text-violet-200">Indian Cities</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold">500</div>
              <div className="text-xs text-violet-200">TF-IDF Features</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold">TSP</div>
              <div className="text-xs text-violet-200">Route Optimization</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-slate-900">Built With</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {['React', 'Vite', 'TailwindCSS', 'Node.js', 'Express', 'MongoDB', 'JWT Auth', 'scikit-learn ML', 'Flask API', 'TF-IDF + Cosine Similarity', 'Haversine TSP'].map(
              (tech) => (
                <span key={tech} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                  {tech}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 px-4 py-16 text-center text-white sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold">Ready to plan your next adventure?</h2>
        <p className="mx-auto mt-3 max-w-xl text-cyan-100">
          Create your free account and generate your first AI-optimized itinerary in seconds.
        </p>
        <Link
          to={isAuthenticated ? '/create-trip' : '/signup'}
          className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-bold text-brand-700 shadow-lg transition hover:bg-cyan-50"
        >
          {isAuthenticated ? 'Create a Trip' : 'Sign Up Free'}
        </Link>
      </section>
    </div>
  )
}

export default Landing
