import { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import {
  createJournal,
  deleteJournal,
  getJournals,
  updateJournal,
} from '../services/api';

const STRIPE_COLORS = ['#f9b2d7', '#b2def9', '#b2f9c8', '#f9f0b2'];

function previewOf(body) {
  const firstLine = (body || '').split('\n')[0].trim();
  return firstLine.length > 80 ? firstLine.slice(0, 80) + '…' : firstLine || '(empty)';
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function JournalModal({ open, mode, initialBody, onClose, onSave, saving }) {
  const [body, setBody] = useState(initialBody || '');

  useEffect(() => {
    setBody(initialBody || '');
  }, [initialBody, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'var(--overlay-bg)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] rounded-[24px] p-[32px] md:p-[40px] flex flex-col gap-[24px] relative overflow-hidden max-h-[90vh]"
        style={{
          backgroundColor: 'var(--card-bg)',
          boxShadow: 'var(--shadow-card)',
          transition: 'background-color 0.3s',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-[6px] flex">
          <div className="flex-1 bg-[#f9b2d7]" />
          <div className="flex-1 bg-[#b2def9]" />
          <div className="flex-1 bg-[#b2f9c8]" />
          <div className="flex-1 bg-[#f9f0b2]" />
        </div>

        <h2
          className="font-semibold text-[24px] md:text-[28px] tracking-tight m-0"
          style={{ color: 'var(--heading-color)' }}
        >
          {mode === 'edit' ? 'Edit entry' : 'New journal entry'}
        </h2>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's on your mind today?"
          rows={10}
          autoFocus
          className="w-full rounded-2xl focus:ring-4 focus:ring-[#b2def9]/10 focus:outline-none p-[16px] text-[16px] resize-none transition-all"
          style={{
            backgroundColor: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--body-color)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#b2def9';
            e.target.style.backgroundColor = 'var(--input-focus-bg)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.backgroundColor = 'var(--input-bg)';
          }}
        />

        <div className="flex items-center justify-end gap-[12px]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="font-semibold text-[16px] px-6 py-3 bg-transparent border-none cursor-pointer disabled:opacity-60 transition-colors"
            style={{ color: 'var(--secondary-color)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--heading-color)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--secondary-color)')}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(body)}
            disabled={saving || !body.trim()}
            className="bg-[#b2def9] rounded-[16px] flex items-center justify-center px-[32px] h-[48px] hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed border-none cursor-pointer shadow-[0px_4px_16px_rgba(178,222,249,0.4)]"
          >
            <span className="font-semibold text-[16px] text-white tracking-wide">
              {saving ? 'Saving…' : 'Save'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Journals() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', id: null, body: '' });
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await getJournals();
      data.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setJournals(data);
    } catch {
      setError('Could not load journal entries.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  function openCreate() {
    setModal({ open: true, mode: 'create', id: null, body: '' });
  }

  function openEdit(entry) {
    setModal({ open: true, mode: 'edit', id: entry.id, body: entry.body });
  }

  function closeModal() {
    setModal((m) => ({ ...m, open: false }));
  }

  async function handleSave(body) {
    setSaving(true);
    try {
      if (modal.mode === 'edit') {
        await updateJournal(modal.id, { body });
      } else {
        await createJournal({ body });
      }
      closeModal();
      await refresh();
    } catch {
      setError('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!confirm('Delete this journal entry? This cannot be undone.')) return;
    try {
      await deleteJournal(entry.id);
      await refresh();
    } catch {
      setError('Could not delete entry.');
    }
  }

  const filtered = search.trim()
    ? journals.filter((j) => j.body.toLowerCase().includes(search.toLowerCase()))
    : journals;

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: 'var(--page-bg)', transition: 'background-color 0.3s' }}
    >
      <AppHeader title="Mental Health" logout />

      <main className="flex-1 w-full max-w-[1200px] mx-auto p-[32px] md:p-[64px] flex flex-col gap-[32px] md:gap-[48px]">
        <div className="flex w-full items-center justify-between gap-4 flex-wrap">
          <h1
            className="font-semibold text-[32px] md:text-[48px] tracking-tight m-0"
            style={{ color: 'var(--heading-color)' }}
          >
            My Journal Entries
          </h1>
          <button
            type="button"
            onClick={openCreate}
            className="bg-[#f9b2d7] rounded-[16px] shadow-[0px_8px_24px_rgba(249,178,215,0.4)] flex items-center justify-center px-[32px] h-[56px] hover:opacity-90 transition-opacity border-none cursor-pointer"
          >
            <span className="font-semibold text-[18px] text-white tracking-wide">+ New Entry</span>
          </button>
        </div>

        <div
          className="w-full h-[64px] rounded-[20px] shadow-sm flex items-center px-[24px] gap-[16px] transition-all"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="var(--muted-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 21L16.65 16.65" stroke="var(--muted-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries"
            className="flex-1 h-full bg-transparent text-[18px] focus:outline-none border-none"
            style={{ color: 'var(--body-color)' }}
          />
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)' }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center py-12" style={{ color: 'var(--muted-color)' }}>Loading entries…</p>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-16 rounded-[24px]"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
            }}
          >
            <p className="text-[18px] mb-4" style={{ color: 'var(--secondary-color)' }}>
              {journals.length === 0
                ? "You haven't written any entries yet."
                : 'No entries match your search.'}
            </p>
            {journals.length === 0 && (
              <button
                type="button"
                onClick={openCreate}
                className="bg-[#b2def9] text-white font-semibold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity border-none cursor-pointer"
              >
                Write your first entry
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] md:gap-[32px] w-full">
            {filtered.map((entry, idx) => {
              const stripe = STRIPE_COLORS[idx % STRIPE_COLORS.length];
              return (
                <div
                  key={entry.id}
                  className="group flex flex-col gap-[20px] rounded-[24px] p-[32px] md:p-[40px] shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-light)',
                  }}
                  onClick={() => openEdit(entry)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-full h-[6px]"
                    style={{ backgroundColor: stripe }}
                  />
                  <div className="flex flex-col gap-[8px]">
                    <span className="font-medium text-[16px]" style={{ color: 'var(--muted-color)' }}>
                      {formatDate(entry.created_at)}
                    </span>
                    <p
                      className="font-medium text-[20px] md:text-[24px] leading-snug m-0 line-clamp-3"
                      style={{ color: 'var(--body-color)' }}
                    >
                      {previewOf(entry.body)}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-[16px] mt-auto pt-[24px] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ borderTop: '1px solid var(--border-light)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openEdit(entry)}
                      className="font-medium text-[16px] text-[#b2def9] hover:text-[#7bbce8] bg-transparent border-none cursor-pointer p-0"
                    >
                      Edit
                    </button>
                    <span style={{ color: 'var(--chart-label)' }}>|</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      className="font-medium text-[16px] text-[#f9b2d7] hover:text-[#e88ebf] bg-transparent border-none cursor-pointer p-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <JournalModal
        open={modal.open}
        mode={modal.mode}
        initialBody={modal.body}
        onClose={closeModal}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
