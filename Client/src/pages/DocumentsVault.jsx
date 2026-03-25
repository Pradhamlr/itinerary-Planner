import { useEffect, useState } from 'react'
import api from '../services/api'

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'aadhar', label: 'Aadhar' },
  { value: 'visa', label: 'Visa' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'other', label: 'Other' },
]

function formatBytes(value) {
  const size = Number(value || 0)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value) {
  if (!value) return 'Recently added'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently added'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date)
}

export default function DocumentsVault() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    documentType: 'passport',
    label: '',
    file: null,
  })

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/documents')
      setDocuments(response.data.data || [])
      setError('')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!form.file || !form.label.trim()) {
      setError('Please choose a document and give it a clear label.')
      return
    }

    const payload = new FormData()
    payload.append('document', form.file)
    payload.append('documentType', form.documentType)
    payload.append('label', form.label.trim())

    try {
      setUploading(true)
      setError('')
      const response = await api.post('/documents', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setDocuments((prev) => [response.data.data, ...prev])
      setForm({
        documentType: 'passport',
        label: '',
        file: null,
      })
      const input = document.getElementById('traveler-document-file')
      if (input) input.value = ''
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to upload document.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId) => {
    try {
      await api.delete(`/documents/${documentId}`)
      setDocuments((prev) => prev.filter((document) => document._id !== documentId))
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to delete document.')
    }
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[32px] bg-brand-palm px-8 py-8 text-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)]">
        <p className="field-label text-[#8cf0f2]">Secure traveler vault</p>
        <h1 className="editorial-title mt-3 text-4xl font-semibold">Travel documents, ready when you are.</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[#d6e3ff]">
          Upload essential travel records like passport, Aadhar, visa, and insurance copies into one secure workspace. Cloudinary storage can be enabled by filling the placeholders in `Backend/.env.example`.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <form onSubmit={handleUpload} className="rounded-[30px] bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.38)]">
          <div>
            <p className="field-label">Upload document</p>
            <h2 className="mt-2 text-2xl font-semibold text-brand-palm">Add a new file</h2>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="documentType" className="field-label mb-2 block">Document type</label>
              <select
                id="documentType"
                value={form.documentType}
                onChange={(event) => setForm((prev) => ({ ...prev, documentType: event.target.value }))}
                className="input-minimal"
              >
                {DOCUMENT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="documentLabel" className="field-label mb-2 block">Label</label>
              <input
                id="documentLabel"
                value={form.label}
                onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
                placeholder="Rahul passport scan"
                className="input-minimal"
              />
            </div>

            <div>
              <label htmlFor="traveler-document-file" className="field-label mb-2 block">File</label>
              <input
                id="traveler-document-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(event) => setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                className="input-minimal file:mr-3 file:rounded-full file:border-0 file:bg-brand-surfaceHigh file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-palm"
              />
            </div>
          </div>

          {error ? <p className="mt-4 rounded-2xl bg-[#f5ddd8] px-4 py-3 text-sm text-[#8a3022]">{error}</p> : null}

          <button type="submit" disabled={uploading} className="btn-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
            {uploading ? 'Uploading...' : 'Upload to vault'}
          </button>

          <div className="mt-6 rounded-[24px] bg-brand-surfaceLow p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">Vault guidance</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-brand-onSurfaceVariant">
              <li>Use clear labels like `Primary passport` or `Travel insurance copy`.</li>
              <li>PDF, JPG, PNG, and WEBP files are supported up to 10 MB.</li>
              <li>Once Cloudinary keys are configured, uploads will persist automatically.</li>
            </ul>
          </div>
        </form>

        <div className="rounded-[30px] bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.38)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="field-label">Stored files</p>
              <h2 className="mt-2 text-2xl font-semibold text-brand-palm">Your travel records</h2>
            </div>
            <span className="rounded-full bg-brand-surfaceLow px-4 py-2 text-sm font-semibold text-brand-onSurfaceVariant">
              {documents.length} items
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-[24px] bg-brand-surfaceLow p-5 text-sm text-brand-onSurfaceVariant">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="rounded-[24px] bg-brand-surfaceLow p-8 text-center">
                <p className="text-lg font-semibold text-brand-palm">No documents yet</p>
                <p className="mt-2 text-sm text-brand-onSurfaceVariant">Upload your first passport, visa, or identity copy to begin building the vault.</p>
              </div>
            ) : (
              documents.map((document) => (
                <article key={document._id} className="rounded-[24px] border border-brand-surfaceHigh bg-brand-surfaceLowest p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-secondary">{document.documentType}</p>
                      <h3 className="mt-2 text-xl font-semibold text-brand-palm">{document.label}</h3>
                      <p className="mt-2 text-sm text-brand-onSurfaceVariant">
                        {document.fileName || 'Stored file'} • {formatBytes(document.fileSize)} • Uploaded {formatDate(document.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {document.secureUrl ? (
                        <a
                          href={document.secureUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary px-4 py-2"
                        >
                          Open
                        </a>
                      ) : null}
                      <button type="button" onClick={() => handleDelete(document._id)} className="rounded-full bg-[#ffdad6] px-4 py-2 text-sm font-semibold text-[#93000a] transition hover:brightness-95">
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
