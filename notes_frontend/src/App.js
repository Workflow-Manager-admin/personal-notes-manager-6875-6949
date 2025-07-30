import React, { useState, useEffect } from 'react';
import './App.css';

// Helper function to create a new note object
function createNewNote() {
  return {
    id: 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2),
    title: '',
    content: '',
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
}

// PUBLIC_INTERFACE
export default function App() {
  // State for notes, selected note, editing mode, theme
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('notes-app-notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editorValue, setEditorValue] = useState({ title: '', content: '' });
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('notes-app-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const note = notes.find(n => n.id === selectedNoteId);
    setEditMode(false);
    setEditorValue(note ? { title: note.title, content: note.content } : { title: '', content: '' });
  }, [selectedNoteId, notes]);

  // PUBLIC_INTERFACE
  function handleCreateNote() {
    const newNote = createNewNote();
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
    setEditMode(true);
    setEditorValue({ title: '', content: '' });
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(noteId) {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    setNotes(notes.filter(n => n.id !== noteId));
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      setEditMode(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleSelectNote(noteId) {
    setSelectedNoteId(noteId);
    setEditMode(false);
  }

  // PUBLIC_INTERFACE
  function handleEditNote(noteId) {
    setSelectedNoteId(noteId);
    setEditMode(true);
    const note = notes.find(n => n.id === noteId);
    setEditorValue(note ? { title: note.title, content: note.content } : { title: '', content: '' });
  }

  // PUBLIC_INTERFACE
  function handleSaveNote() {
    setNotes(notes =>
      notes.map(n => n.id === selectedNoteId
        ? { ...n, title: editorValue.title.trim(), content: editorValue.content, lastModified: new Date().toISOString() }
        : n
      )
    );
    setEditMode(false);
  }

  function handleEditorChange(e) {
    const { name, value } = e.target;
    setEditorValue(val => ({ ...val, [name]: value }));
  }

  // PUBLIC_INTERFACE
  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  const sortedNotes = [...notes].sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;

  return (
    <div className="notes-app-root">
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <div className="notes-main-content">
        <NotesListPanel
          notes={sortedNotes}
          selectedNoteId={selectedNoteId}
          onSelectNote={handleSelectNote}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          onCreateNote={handleCreateNote}
        />
        <NoteEditorViewerPanel
          note={selectedNote}
          isEditing={editMode}
          editorValue={editorValue}
          onChange={handleEditorChange}
          onEdit={() => handleEditNote(selectedNoteId)}
          onSave={handleSaveNote}
          onCancel={() => setEditMode(false)}
        />
      </div>
    </div>
  );
}

// Minimalistic Navbar
function Navbar({ theme, onToggleTheme }) {
  return (
    <nav className="navbar">
      <span className="navbar-logo">
        <span style={{ color: 'var(--primary-color)' }}>📝</span>
        <span className="navbar-title">Notes</span>
      </span>
      <button className="theme-toggle-btn" onClick={onToggleTheme} aria-label="Toggle theme">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </nav>
  );
}

// List Panel
function NotesListPanel({ notes, selectedNoteId, onSelectNote, onEditNote, onDeleteNote, onCreateNote }) {
  return (
    <aside className="notes-list-panel">
      <div className="notes-list-header">
        <button className="btn-accent" onClick={onCreateNote}>+ New Note</button>
      </div>
      <ul className="notes-list-ul">
        {notes.length === 0 && (
          <li className="notes-list-empty">No notes yet.</li>
        )}
        {notes.map(note =>
          <li
            key={note.id}
            className={note.id === selectedNoteId ? 'notes-list-item selected' : 'notes-list-item'}
            tabIndex={0}
            onClick={() => onSelectNote(note.id)}
          >
            <div className="note-list-title">{note.title || <span className="untitled">Untitled</span>}</div>
            <div className="note-list-date">
              <small>{note.lastModified ? (new Date(note.lastModified)).toLocaleString() : ''}</small>
            </div>
            <div className="note-list-actions">
              <button
                className="icon-btn"
                title="Edit"
                onClick={e => {
                  e.stopPropagation();
                  onEditNote(note.id);
                }}
              >✏️</button>
              <button
                className="icon-btn"
                title="Delete"
                onClick={e => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                }}
              >🗑️</button>
            </div>
          </li>
        )}
      </ul>
    </aside>
  );
}

// Note Editor/Viewer Panel
function NoteEditorViewerPanel({ note, isEditing, editorValue, onChange, onEdit, onSave, onCancel }) {
  if (!note && !isEditing) {
    return (
      <section className="note-editor-panel note-empty-panel">
        <div className="note-empty-message">Select or create a note to begin.</div>
      </section>
    );
  }

  if (isEditing) {
    return (
      <section className="note-editor-panel">
        <form
          className="note-form"
          onSubmit={e => {
            e.preventDefault();
            if (!editorValue.title.trim()) return;
            onSave();
          }}
        >
          <input
            className="note-title-input"
            name="title"
            type="text"
            placeholder="Title"
            value={editorValue.title}
            onChange={onChange}
            autoFocus
            minLength={1}
            maxLength={100}
            required
          />
          <textarea
            className="note-content-input"
            name="content"
            placeholder="Start typing your note..."
            value={editorValue.content}
            onChange={onChange}
            rows={12}
            required
          />
          <div className="note-form-actions">
            <button className="btn-primary" type="submit">Save</button>
            <button className="btn-muted" type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="note-editor-panel">
      <div className="note-view-content">
        <h2 className="note-view-title">
          {note?.title ? note.title : <span className="untitled">Untitled</span>}
          <button className="icon-btn edit-btn" title="Edit" onClick={onEdit}>✏️</button>
        </h2>
        <div className="note-view-body">
          {note?.content || <span className="empty-content">No content.</span>}
        </div>
        <div className="note-meta">
          <small>
            Last Modified: {note?.lastModified ? (new Date(note.lastModified)).toLocaleString() : ''}
          </small>
        </div>
      </div>
    </section>
  );
}
