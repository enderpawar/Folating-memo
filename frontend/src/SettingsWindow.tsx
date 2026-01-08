import { useState, useEffect } from 'react';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import './SettingsWindow.css';

interface StickyNote {
  id: number;
  type: 'TEXT' | 'IMAGE';
  content: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  color: string;
  createdBy: string;
}

interface Comment {
  id?: number;
  content: string;
  author: string;
  createdAt?: string;
}

declare global {
  interface Window {
    electronAPI?: {
      createOverlay: (noteData: any) => Promise<void>;
      closeOverlay: (noteId: number) => Promise<void>;
      isElectron: boolean;
    };
  }
}

export default function SettingsWindow() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [username, setUsername] = useState('');
  const [selectedNote, setSelectedNote] = useState<StickyNote | null>(null);
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({});
  const [newComment, setNewComment] = useState('');

  // WebSocket 연결
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('WebSocket Connected');
        
        // 새 노트 구독
        client.subscribe('/topic/notes', (message) => {
          const newNote = JSON.parse(message.body);
          setNotes(prev => [...prev, newNote]);
        });

        // 노트 삭제 구독
        client.subscribe('/topic/notes/delete', (message) => {
          const deletedId = parseInt(message.body);
          setNotes(prev => prev.filter(note => note.id !== deletedId));
        });

        // 코멘트 구독
        client.subscribe('/topic/comments', (message) => {
          const comment = JSON.parse(message.body);
          const noteId = comment.stickyNote?.id;
          if (noteId) {
            setComments(prev => ({
              ...prev,
              [noteId]: [...(prev[noteId] || []), comment]
            }));
          }
        });
      }
    });

    client.activate();
    setStompClient(client);

    // 기존 노트 불러오기
    axios.get<StickyNote[]>('http://localhost:8080/api/notes')
      .then(response => setNotes(response.data))
      .catch(error => console.error('Failed to load notes:', error));

    return () => {
      client.deactivate();
    };
  }, []);

  // 사용자명 설정
  useEffect(() => {
    const name = localStorage.getItem('username') || `User${Math.floor(Math.random() * 1000)}`;
    setUsername(name);
    localStorage.setItem('username', name);
  }, []);

  // 클립보드 붙여넣기
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            await createNote('IMAGE', base64);
          };
          reader.readAsDataURL(file);
        }
      } else if (item.type === 'text/plain') {
        item.getAsString(async (text) => {
          await createNote('TEXT', text);
        });
      }
    }
  };

  // 노트 생성
  const createNote = async (type: 'TEXT' | 'IMAGE', content: string) => {
    const noteData = {
      type,
      content,
      positionX: Math.random() * (window.screen.width - 300),
      positionY: Math.random() * (window.screen.height - 300),
      width: 300,
      height: type === 'IMAGE' ? 300 : 150,
      color: type === 'TEXT' ? '#ffeb3b' : '#ffffff',
      createdBy: username
    };

    try {
      const response = await axios.post<StickyNote>('http://localhost:8080/api/notes', noteData);
      const newNote = response.data;
      
      // WebSocket으로 브로드캐스트 (연결되어 있을 때만)
      if (stompClient && stompClient.connected) {
        stompClient.publish({
          destination: '/app/note/create',
          body: JSON.stringify(newNote)
        });
      }

      // Electron 오버레이 창 생성
      if (window.electronAPI) {
        await window.electronAPI.createOverlay(newNote);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  // 노트 삭제
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8080/api/notes/${id}`);
      
      if (stompClient) {
        stompClient.publish({
          destination: '/app/note/delete',
          body: id.toString()
        });
      }

      // Electron 오버레이 창 닫기
      if (window.electronAPI) {
        await window.electronAPI.closeOverlay(id);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // 코멘트 로드
  const loadComments = async (noteId: number) => {
    try {
      const response = await axios.get<Comment[]>(`http://localhost:8080/api/comments/note/${noteId}`);
      setComments(prev => ({
        ...prev,
        [noteId]: response.data
      }));
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  // 코멘트 추가
  const handleAddComment = async () => {
    if (!selectedNote || !newComment.trim()) return;

    const commentData = {
      content: newComment,
      author: username,
      stickyNoteId: selectedNote.id
    };

    try {
      await axios.post('http://localhost:8080/api/comments', commentData);
      
      if (stompClient) {
        stompClient.publish({
          destination: '/app/comment/add',
          body: JSON.stringify(commentData)
        });
      }

      setNewComment('');
      await loadComments(selectedNote.id);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  // 노트 클릭
  const handleNoteClick = (note: StickyNote) => {
    setSelectedNote(note);
    loadComments(note.id);
  };

  return (
    <div className="settings-window" onPaste={handlePaste}>
      <div className="header">
        <h1>🎯 Sticky Board - 설정</h1>
        <p>Ctrl+V로 클립보드의 이미지나 텍스트를 바탕화면에 띄우세요!</p>
      </div>

      <div className="content">
        <div className="notes-grid">
          <h2>포스트잇 목록</h2>
          <div className="grid">
            {notes.map(note => (
              <div 
                key={note.id} 
                className="note-card"
                onClick={() => handleNoteClick(note)}
              >
                {note.type === 'IMAGE' ? (
                  <img src={note.content} alt="note" />
                ) : (
                  <p>{note.content}</p>
                )}
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(note.id);
                  }}
                >
                  ×
                </button>
                <div className="note-info">
                  <span>{note.createdBy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedNote && (
          <div className="comments-panel">
            <h2>코멘트</h2>
            <div className="comments-list">
              {(comments[selectedNote.id] || []).map((comment, idx) => (
                <div key={idx} className="comment">
                  <strong>{comment.author}</strong>: {comment.content}
                  {comment.createdAt && (
                    <span className="time">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="comment-input">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="코멘트 입력..."
              />
              <button onClick={handleAddComment}>전송</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
