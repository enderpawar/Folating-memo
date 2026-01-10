import { useState, useEffect } from 'react';
import './SettingsWindow.css';

interface StickyNote {
  id: number;
  content: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  createdAt: string;
}

declare global {
  interface Window {
    electronAPI?: {
      createNote: (noteData: any) => Promise<StickyNote>;
      getAllNotes: () => Promise<StickyNote[]>;
      deleteNote: (noteId: number) => Promise<void>;
      updateNote: (noteId: number, updates: any) => Promise<StickyNote>;
      onNoteCreated: (callback: (note: StickyNote) => void) => void;
      onNoteUpdated: (callback: (note: StickyNote) => void) => void;
      onNoteDeleted: (callback: (noteId: number) => void) => void;
      isElectron: boolean;
    };
  }
}

export default function SettingsWindow() {
  const [notes, setNotes] = useState<StickyNote[]>([]);

  // 초기 노트 로드
  useEffect(() => {
    if (window.electronAPI) {
      loadNotes();
      
      // 실시간 이벤트 리스너 등록
      window.electronAPI.onNoteCreated((note) => {
        setNotes(prev => [...prev, note]);
      });
      
      window.electronAPI.onNoteUpdated((note) => {
        setNotes(prev => prev.map(n => n.id === note.id ? note : n));
      });
      
      window.electronAPI.onNoteDeleted((noteId) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
      });
    }
  }, []);

  const loadNotes = async () => {
    if (window.electronAPI) {
      const allNotes = await window.electronAPI.getAllNotes();
      setNotes(allNotes);
    }
  };

  // 클립보드 붙여넣기
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            await createNote(base64);
          };
          reader.readAsDataURL(file);
        }
      } else if (item.type === 'text/plain') {
        item.getAsString(async (text) => {
          await createNote(text);
        });
      }
    }
  };

  // 드래그 & 드롭 처리
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    const items = e.dataTransfer.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            await createNote(base64);
          };
          reader.readAsDataURL(file);
        }
      } else if (item.type === 'text/plain') {
        item.getAsString(async (text) => {
          await createNote(text);
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 노트 생성
  const createNote = async (content: string) => {
    if (!window.electronAPI) return;
    
    const noteData = {
      content,
      positionX: Math.random() * (window.screen.width - 300),
      positionY: Math.random() * (window.screen.height - 300),
      width: 300,
      height: 200
    };

    try {
      const newNote = await window.electronAPI.createNote(noteData);
      console.log('Note created:', newNote);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  // 노트 삭제
  const handleDelete = async (id: number) => {
    if (!window.electronAPI) return;
    
    try {
      await window.electronAPI.deleteNote(id);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // 이미지 여부 확인
  const isImage = (content: string) => content.startsWith('data:image/');

  return (
    <div 
      className="settings-window" 
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="header">
        <h1>🎯 Sticky Board</h1>
        <p>Ctrl+V로 클립보드의 이미지나 텍스트를 바탕화면에 띄우세요!</p>
        <p className="note-count">현재 {notes.length}개의 포스트잇이 있습니다</p>
      </div>

      <div className="content">
        <div className="notes-grid">
          <h2>포스트잇 목록</h2>
          
          {notes.length === 0 ? (
            <div className="empty-state">
              <p>📝 포스트잇이 없습니다</p>
              <p>Ctrl+V로 이미지나 텍스트를 붙여넣어보세요!</p>
            </div>
          ) : (
            <div className="grid">
              {notes.map(note => (
                <div key={note.id} className="note-card">
                  {isImage(note.content) ? (
                    <img src={note.content} alt="sticky note" className="note-preview-image" />
                  ) : (
                    <div className="note-preview-text">{note.content}</div>
                  )}
                  <div className="note-info">
                    <span className="note-id">#{note.id}</span>
                    <span className="note-size">{note.width}x{note.height}</span>
                  </div>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(note.id)}
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="footer">
        <p>💡 드래그 & 드롭으로도 추가할 수 있습니다!</p>
      </div>
    </div>
  );
}
