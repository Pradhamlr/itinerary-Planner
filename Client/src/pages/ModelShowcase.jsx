import { useEffect, useState } from 'react'
import api from '../services/api'

function ModelShowcase() {
  const [modelInfo, setModelInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  // Recommendation demo state
  const [demoCity, setDemoCity] = useState('jaipur')
  const [demoInterests, setDemoInterests] = useState(['history', 'food'])
  const [demoBudget, setDemoBudget] = useState('medium')
  const [demoResults, setDemoResults] = useState(null)
  const [demoLoading, setDemoLoading] = useState(false)

  // Sentiment demo state
  const [sentimentText, setSentimentText] = useState('')
  const [sentimentResult, setSentimentResult] = useState(null)
  const [sentimentLoading, setSentimentLoading] = useState(false)

  const ALL_INTERESTS = [
    'history', 'adventure', 'food', 'nature', 'culture',
    'shopping', 'nightlife', 'beaches', 'art', 'sports', 'spiritual',
  ]

  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const res = await api.get('/ml/model-info')
        setModelInfo(res.data.data)
      } catch {
        console.error('Failed to load model info')
      } finally {
        setLoading(false)
      }
    }
    fetchModelInfo()
  }, [])

  const runRecommendationDemo = async () => {
    setDemoLoading(true)
    try {
      const res = await api.post('/ml/recommend-demo', {
        city: demoCity,
        interests: demoInterests,
        budget_category: demoBudget,
        top_n: 8,
      })
      setDemoResults(res.data.data)
    } catch {
      setDemoResults(null)
    } finally {
      setDemoLoading(false)
    }
  }

  const runSentimentDemo = async () => {
    if (!sentimentText.trim()) return
    setSentimentLoading(true)
    try {
      const res = await api.post('/ml/sentiment-demo', { text: sentimentText })
      setSentimentResult(res.data.data)
    } catch {
      setSentimentResult(null)
    } finally {
      setSentimentLoading(false)
    }
  }

  const toggleDemoInterest = (interest) => {
    setDemoInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  if (loading) {
    return (
      <section className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-slate-600">Loading ML model information...</p>
        </div>
      </section>
    )
  }

  const rec = modelInfo?.recommendation_model
  const sent = modelInfo?.sentiment_model
  const stats = modelInfo?.dataset_stats

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">🧠</span>
          <div>
            <h1 className="text-3xl font-extrabold">ML Model Showcase</h1>
            <p className="mt-1 text-purple-100">
              This application uses trained machine learning models — not external APIs — to power its recommendations and analysis.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-4 text-center backdrop-blur">
            <p className="text-3xl font-bold">{stats?.total_places || 0}</p>
            <p className="text-sm text-purple-200">Training Samples</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 text-center backdrop-blur">
            <p className="text-3xl font-bold">{stats?.total_cities || 0}</p>
            <p className="text-sm text-purple-200">Cities Covered</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 text-center backdrop-blur">
            <p className="text-3xl font-bold">{rec?.vocabulary_size || 0}</p>
            <p className="text-sm text-purple-200">TF-IDF Features</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 text-center backdrop-blur">
            <p className="text-3xl font-bold">{rec?.interest_profiles_count || 0}</p>
            <p className="text-sm text-purple-200">Interest Profiles</p>
          </div>
        </div>
      </div>

      {/* Recommendation Model Details */}
      {rec && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-lg">📊</span>
            <h2 className="text-xl font-bold text-slate-900">Recommendation Model</h2>
            <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">TRAINED</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <InfoRow label="Model Type" value={rec.type} />
              <InfoRow label="Algorithm" value={rec.algorithm} />
              <InfoRow label="Training Library" value={rec.training_library} />
              <InfoRow label="TF-IDF Matrix" value={`${rec.tfidf_matrix_shape[0]} × ${rec.tfidf_matrix_shape[1]}`} />
              <InfoRow label="Vocabulary Size" value={rec.vocabulary_size} />
              <InfoRow label="N-gram Range" value={`(${rec.ngram_range[0]}, ${rec.ngram_range[1]})`} />
              <InfoRow label="Model File Size" value={`${rec.model_file_size_kb} KB`} />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Scoring Formula</h3>
              <div className="rounded-xl bg-slate-50 p-4 font-mono text-sm">
                <p className="text-slate-700">
                  <span className="text-violet-600 font-bold">final_score</span> =
                </p>
                <p className="ml-4 text-slate-600">
                  <span className="text-emerald-600 font-semibold">{rec.scoring_weights.interest_match}</span> × interest_match +
                </p>
                <p className="ml-4 text-slate-600">
                  <span className="text-blue-600 font-semibold">{rec.scoring_weights.budget_score}</span> × budget_score +
                </p>
                <p className="ml-4 text-slate-600">
                  <span className="text-amber-600 font-semibold">{rec.scoring_weights.rating_score}</span> × rating_score
                </p>
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Learned Interest Profiles</h3>
              <div className="flex flex-wrap gap-2">
                {rec.interest_tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 capitalize">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment Model Details */}
      {sent && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-lg">💬</span>
            <h2 className="text-xl font-bold text-slate-900">Sentiment Analysis Model</h2>
            <span className="ml-auto rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">TRAINED</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <InfoRow label="Model Type" value={sent.type} />
              <InfoRow label="Algorithm" value={sent.algorithm} />
              <InfoRow label="Training Library" value={sent.training_library} />
              <InfoRow label="Vocabulary Size" value={sent.vocabulary_size} />
              <InfoRow label="Max Features" value={sent.max_features} />
              <InfoRow label="Classes" value={sent.classes.join(', ')} />
              <InfoRow label="Model File Size" value={`${sent.model_file_size_kb} KB`} />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">How It Works</h3>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
                <p>1. Input text is vectorized using <span className="font-semibold text-slate-800">TF-IDF</span> (Term Frequency-Inverse Document Frequency)</p>
                <p>2. The <span className="font-semibold text-slate-800">Multinomial Naive Bayes</span> classifier predicts the sentiment class</p>
                <p>3. Probability distribution across classes is returned as confidence scores</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Model Accuracy & Evaluation ── */}
      {(rec?.metrics || sent?.metrics) && (
        <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-lg text-white">📈</span>
            <h2 className="text-xl font-bold text-slate-900">Model Accuracy &amp; Evaluation</h2>
            <span className="ml-auto rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">EVALUATION REPORT</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Computed after training using held-out test data and cross-validation.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Recommendation Metrics */}
            {rec?.metrics && (
              <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <span className="text-emerald-600">📊</span> Recommendation Model
                </h3>

                <div className="mt-4 space-y-3">
                  <MetricBar
                    label="Coverage"
                    value={rec.metrics.coverage}
                    color="bg-emerald-500"
                    tooltip={`${rec.metrics.unique_places_recommended}/${rec.metrics.total_places} places appeared in recommendations`}
                  />
                  <MetricBar
                    label="Precision@5"
                    value={rec.metrics.precision_at_5}
                    color="bg-blue-500"
                    tooltip="% of top-5 recommendations with rating ≥ 4.0"
                  />
                  <MetricBar
                    label="Precision@10"
                    value={rec.metrics.precision_at_10}
                    color="bg-blue-400"
                    tooltip="% of top-10 recommendations with rating ≥ 4.0"
                  />
                  <MetricBar
                    label="Diversity"
                    value={rec.metrics.intra_list_diversity}
                    color="bg-purple-500"
                    tooltip="Avg. pairwise distance within recommendations (1 = fully diverse)"
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-emerald-50 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700">{(rec.metrics.coverage * 100).toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">Coverage</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{(rec.metrics.precision_at_5 * 100).toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">Precision@5</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700">{(rec.metrics.intra_list_diversity * 100).toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">Diversity</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">{rec.metrics.total_queries_evaluated}</p>
                    <p className="text-xs text-slate-500">Queries Tested</p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Scoring Weights</p>
                  <div className="flex gap-3 text-xs">
                    <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700 font-bold">45% Interest Match</span>
                    <span className="rounded bg-blue-100 px-2 py-1 text-blue-700 font-bold">25% Budget Fit</span>
                    <span className="rounded bg-amber-100 px-2 py-1 text-amber-700 font-bold">30% Rating</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sentiment Metrics */}
            {sent?.metrics && (
              <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <span className="text-blue-600">💬</span> Sentiment Analysis Model
                </h3>

                <div className="mt-4 space-y-3">
                  <MetricBar
                    label="Test Accuracy"
                    value={sent.metrics.test_accuracy}
                    color="bg-blue-500"
                    tooltip={`Accuracy on held-out test set (${sent.metrics.test_samples} samples)`}
                  />
                  <MetricBar
                    label="CV Accuracy"
                    value={sent.metrics.cv_accuracy_mean}
                    color="bg-indigo-500"
                    tooltip={`5-fold cross-validation mean ± ${(sent.metrics.cv_accuracy_std * 100).toFixed(1)}%`}
                  />
                  <MetricBar
                    label="Precision (Weighted)"
                    value={sent.metrics.precision_weighted}
                    color="bg-violet-500"
                    tooltip="Weighted avg precision across all 3 classes"
                  />
                  <MetricBar
                    label="Recall (Weighted)"
                    value={sent.metrics.recall_weighted}
                    color="bg-purple-500"
                    tooltip="Weighted avg recall across all 3 classes"
                  />
                  <MetricBar
                    label="F1-Score (Weighted)"
                    value={sent.metrics.f1_weighted}
                    color="bg-pink-500"
                    tooltip="Harmonic mean of precision and recall"
                  />
                </div>

                {/* Per-class metrics */}
                {sent.metrics.per_class && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Per-Class Metrics</p>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Class</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Precision</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Recall</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">F1</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(sent.metrics.per_class).map(([cls, m]) => (
                            <tr key={cls} className="border-t border-slate-100">
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize
                                  ${cls === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                                    cls === 'negative' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'}`}>
                                  {cls === 'positive' ? '😊' : cls === 'negative' ? '😞' : '😐'} {cls}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center font-mono text-slate-700">{(m.precision * 100).toFixed(1)}%</td>
                              <td className="px-3 py-2 text-center font-mono text-slate-700">{(m.recall * 100).toFixed(1)}%</td>
                              <td className="px-3 py-2 text-center font-mono font-bold text-slate-900">{(m.f1 * 100).toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Confusion Matrix */}
                {sent.metrics.confusion_matrix && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Confusion Matrix</p>
                    <div className="overflow-hidden rounded-lg border border-slate-200 text-xs">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-2 py-2 text-left text-slate-400 font-normal italic">actual ↓ / pred →</th>
                            {sent.metrics.confusion_labels.map((lbl) => (
                              <th key={lbl} className="px-2 py-2 text-center font-semibold text-slate-600 capitalize">{lbl}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sent.metrics.confusion_matrix.map((row, i) => (
                            <tr key={i} className="border-t border-slate-100">
                              <td className="px-2 py-2 font-semibold text-slate-600 capitalize bg-slate-50">
                                {sent.metrics.confusion_labels[i]}
                              </td>
                              {row.map((val, j) => (
                                <td
                                  key={j}
                                  className={`px-2 py-2 text-center font-mono font-bold
                                    ${i === j
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : val > 0 ? 'bg-red-50 text-red-600' : 'text-slate-400'
                                    }`}
                                >
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Diagonal cells (green) = correct predictions. Off-diagonal (red) = misclassifications.
                    </p>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-blue-50 p-2 text-center">
                    <p className="text-lg font-bold text-blue-700">{sent.metrics.training_samples}</p>
                    <p className="text-[10px] text-slate-500">Training Samples</p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 p-2 text-center">
                    <p className="text-lg font-bold text-indigo-700">
                      {(sent.metrics.cv_accuracy_mean * 100).toFixed(1)}%
                      <span className="text-xs font-normal text-indigo-400"> ±{(sent.metrics.cv_accuracy_std * 100).toFixed(1)}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">5-Fold CV Accuracy</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Training Data Overview */}
      {stats && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-lg">📁</span>
            <h2 className="text-xl font-bold text-slate-900">Training Dataset</h2>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total Places" value={stats.total_places} color="bg-violet-50 text-violet-700" />
            <Stat label="Cities" value={stats.total_cities} color="bg-emerald-50 text-emerald-700" />
            <Stat label="Categories" value={stats.total_categories} color="bg-blue-50 text-blue-700" />
            <Stat label="Avg Rating" value={stats.avg_rating} color="bg-amber-50 text-amber-700" />
          </div>

          <div className="mt-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">City Breakdown</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {stats.city_breakdown.map((c) => (
                <div key={c.city} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-700">{c.city}</span>
                  <span className="text-sm font-bold text-slate-900">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Recommendation Demo */}
      <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-lg text-white">▶</span>
          <h2 className="text-xl font-bold text-slate-900">Live Recommendation Demo</h2>
          <span className="ml-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600 animate-pulse">LIVE</span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Try the trained recommendation model in real-time. Select a city and interests, then see the ML model score and rank places.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
            <select
              value={demoCity}
              onChange={(e) => setDemoCity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {stats?.city_breakdown.map((c) => (
                <option key={c.city} value={c.city.toLowerCase()}>{c.city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Budget</label>
            <select
              value={demoBudget}
              onChange={(e) => setDemoBudget(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="low">Low Budget</option>
              <option value="medium">Medium Budget</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={runRecommendationDemo}
              disabled={demoLoading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {demoLoading ? 'Running Model...' : '🧠 Run ML Model'}
            </button>
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">Interests</label>
          <div className="flex flex-wrap gap-2">
            {ALL_INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleDemoInterest(interest)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                  demoInterests.includes(interest)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-300 hover:border-emerald-400'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {demoResults && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-semibold">Model:</span> {demoResults.model_info?.algorithm}
              <span className="mx-1">|</span>
              <span className="font-semibold">Matched Interests:</span> {demoResults.model_info?.matched_interests}
              <span className="mx-1">|</span>
              <span className="font-semibold">City Places:</span> {demoResults.model_info?.total_city_places}
            </div>

            <div className="space-y-2">
              {demoResults.recommendations?.map((place, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{place.name}</h4>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
                        {place.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{place.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-emerald-600">{(place.score * 100).toFixed(1)}%</div>
                    <div className="text-[10px] text-slate-400">ML Score</div>
                  </div>
                  <div className="text-right shrink-0 w-16">
                    <div className="text-sm font-semibold text-blue-600">{(place.interest_match * 100).toFixed(1)}%</div>
                    <div className="text-[10px] text-slate-400">Interest</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Sentiment Demo */}
      <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-lg text-white">▶</span>
          <h2 className="text-xl font-bold text-slate-900">Live Sentiment Analysis Demo</h2>
          <span className="ml-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600 animate-pulse">LIVE</span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Type a review about any place and the trained Naive Bayes classifier will predict its sentiment with confidence scores.
        </p>

        <div className="mt-4 flex gap-3">
          <input
            type="text"
            value={sentimentText}
            onChange={(e) => setSentimentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSentimentDemo()}
            placeholder="e.g., Beautiful temple with incredible architecture and peaceful atmosphere..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={runSentimentDemo}
            disabled={sentimentLoading || !sentimentText.trim()}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {sentimentLoading ? 'Analyzing...' : '💬 Analyze'}
          </button>
        </div>

        {sentimentResult && (
          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {sentimentResult.sentiment === 'positive' ? '😊' : sentimentResult.sentiment === 'negative' ? '😞' : '😐'}
              </span>
              <div>
                <p className="text-lg font-bold capitalize text-slate-900">{sentimentResult.sentiment}</p>
                <p className="text-xs text-slate-500">Predicted by Multinomial Naive Bayes</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {Object.entries(sentimentResult.confidence || {}).map(([label, score]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-medium text-slate-600 capitalize">{label}</span>
                  <div className="flex-1 rounded-full bg-slate-100 h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        label === 'positive' ? 'bg-emerald-500' :
                        label === 'negative' ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${(score * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-sm font-bold text-slate-700">
                    {(score * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Architecture Diagram */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">System Architecture</h2>
        <p className="mt-1 text-sm text-slate-600">How the ML models integrate into the system</p>

        <div className="mt-6 flex flex-col items-center gap-4">
          <ArchBlock color="bg-cyan-100 border-cyan-300 text-cyan-800" label="React Frontend" sub="User inputs: city, interests, budget" />
          <Arrow />
          <ArchBlock color="bg-blue-100 border-blue-300 text-blue-800" label="Node.js / Express API" sub="REST endpoints, JWT auth, MongoDB" />
          <Arrow />
          <ArchBlock color="bg-violet-100 border-violet-300 text-violet-800" label="Python Flask ML Service" sub="Loads trained .pkl model files on startup" />
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-2">
              <Arrow />
              <ArchBlock color="bg-emerald-100 border-emerald-300 text-emerald-800" label="TF-IDF + Cosine Similarity" sub="Recommendation Engine (.pkl)" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Arrow />
              <ArchBlock color="bg-amber-100 border-amber-300 text-amber-800" label="Naive Bayes Classifier" sub="Sentiment Analysis (.pkl)" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MetricBar({ label, value, color, tooltip }) {
  const pct = Math.min(Math.max(value * 100, 0), 100)
  return (
    <div title={tooltip}>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-bold text-slate-800">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className={`rounded-lg p-3 text-center ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  )
}

function ArchBlock({ color, label, sub }) {
  return (
    <div className={`rounded-xl border-2 px-6 py-3 text-center ${color}`}>
      <p className="font-bold">{label}</p>
      <p className="text-xs opacity-75">{sub}</p>
    </div>
  )
}

function Arrow() {
  return <div className="text-slate-400 text-xl">↓</div>
}

export default ModelShowcase
