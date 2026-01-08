import { useState, useEffect } from 'react';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import './OverlayWindow.css';

interface Comment {
  id?: number;
  content: string;
  author: string;
  createdAt?: string;
}

declare global {
  interface Window {
    electronAPI?: {
      updateOverlayPosition: (noteId: number, x: number, y: number) => Promise<void>;
      isElectron: boolean;
    };
  }
}

export default function OverlayWindow() {
  const [noteId, setNoteId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // URL 파라미터에서 noteId와 content 가져오기
    const params = new URLSearchParams(window.location.search);
    const id = params.get('noteId');
    const contentParam = params.get('content');
    
    if (id) setNoteId(parseInt(id));
    if (contentParam) setContent(decodeURIComponent(contentParam));

    // WebSocket 연결
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Overlay WebSocket Connected');
        
        // 코멘트 구독
        client.subscribe('/topic/comments', (message) => {
          const comment = JSON.parse(message.body);
          if (id && comment.stickyNote?.id === parseInt(id)) {
            setComments(prev => [...prev, comment]);
          }
        });
      }
    });

    client.activate();
    setStompClient(client);

    // 기존 코멘트 불러오기
    if (id) {
      axios.get<Comment[]>(`http://localhost:8080/api/comments/note/${id}`)
        .then(response => setComments(response.data))
        .catch(error => console.error('Failed to load comments:', error));
    }

    return () => {
      client.deactivate();
    };
  }, []);

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.comments-popup')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - window.screenX,
      y: e.clientY - window.screenY
    });
  };

  // 드래그 중
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !noteId) return;

      const newX = e.screenX - dragStart.x;
      const newY = e.screenY - dragStart.y;

      // Electron API로 창 위치 업데이트
      if (window.electronAPI) {
        window.electronAPI.updateOverlayPosition(noteId, newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, noteId, dragStart]);

  // 이미지인지 텍스트인지 확인
  const isImage = content.startsWith('data:image/');

  return (
    <div 
      className="overlay-window"
      onMouseDown={handleMouseDown}
      onClick={() => setShowComments(!showComments)}
    >
      {isImage ? (
        <img src={content} alt="sticky note" draggable={false} />
      ) : (
        <div className="text-content">{content}</div>
      )}

      {showComments && comments.length > 0 && (
        <div 
          className="comments-popup"
          onClick={(e) => e.stopPropagation()}
        >
          <h3>💬 코멘트 ({comments.length})</h3>
          <div className="comments-list">
            {comments.map((comment, idx) => (
              <div key={idx} className="comment">
                <strong>{comment.author}</strong>
                <p>{comment.content}</p>
                {comment.createdAt && (
                  <span className="time">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {comments.length > 0 && (
        <div className="comment-badge">{comments.length}</div>
      )}
    </div>
  );
}
