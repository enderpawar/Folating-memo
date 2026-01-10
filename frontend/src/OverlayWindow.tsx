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
      updateOverlaySize: (noteId: number, width: number, height: number) => Promise<void>;
      getWindowSize: (noteId: number) => Promise<{ width: number; height: number }>;
      closeOverlay: (noteId: number) => Promise<void>;
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
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, windowX: 0, windowY: 0 });
  const [wasDragged, setWasDragged] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ mouseX: 0, mouseY: 0, width: 0, height: 0 });

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
    if ((e.target as HTMLElement).closest('.close-btn')) return;
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    
    setIsDragging(true);
    setWasDragged(false);
    // 마우스 위치와 창 위치 모두 저장
    setDragStart({
      mouseX: e.screenX,
      mouseY: e.screenY,
      windowX: window.screenX,
      windowY: window.screenY
    });
  };

  // 크기 조정 시작
  const handleResizeMouseDown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log('[Resize] Handle clicked!');
    
    if (!noteId || !window.electronAPI) {
      console.log('[Resize] noteId or electronAPI missing');
      return;
    }
    
    // Electron에서 실제 창 크기 가져오기
    const actualSize = await window.electronAPI.getWindowSize(noteId);
    
    console.log(`[Resize] Start - actual window size: ${actualSize.width}x${actualSize.height}, mouse: ${e.screenX},${e.screenY}`);
    
    setIsResizing(true);
    setResizeStart({
      mouseX: e.screenX,
      mouseY: e.screenY,
      width: actualSize.width,
      height: actualSize.height
    });
  };

  // 클릭 처리 (드래그가 아닐 때만)
  const handleClick = () => {
    if (!wasDragged) {
      setShowComments(!showComments);
    }
  };

  // 닫기 버튼
  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (noteId && window.electronAPI) {
      await window.electronAPI.closeOverlay(noteId);
    }
  };

  // 드래그 중
  useEffect(() => {
    if (!isDragging || !noteId) return;

    let hasMoved = false;
    let lastUpdateTime = 0;
    const updateThrottle = 16; // 약 60fps

    const handleMouseMove = (e: MouseEvent) => {
      // 시작점으로부터 마우스가 얼마나 이동했는지 계산
      const deltaX = e.screenX - dragStart.mouseX;
      const deltaY = e.screenY - dragStart.mouseY;

      // 움직임이 있으면 드래그로 판단
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        hasMoved = true;
        setWasDragged(true);

        // 쓰로틀링: 너무 자주 업데이트하지 않음
        const now = Date.now();
        if (now - lastUpdateTime < updateThrottle) {
          return;
        }
        lastUpdateTime = now;

        // 시작 창 위치 + 마우스 이동량 = 새 창 위치
        const newX = dragStart.windowX + deltaX;
        const newY = dragStart.windowY + deltaY;

        // Electron API로 창 위치 업데이트
        if (window.electronAPI) {
          window.electronAPI.updateOverlayPosition(noteId, Math.round(newX), Math.round(newY));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // 드래그하지 않았으면 wasDragged를 false로 유지
      if (!hasMoved) {
        setWasDragged(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, noteId, dragStart]);

  // 크기 조정 중
  useEffect(() => {
    if (!isResizing || !noteId) return;

    let lastUpdateTime = 0;
    const updateThrottle = 50; // 20fps

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdateTime < updateThrottle) {
        return;
      }
      lastUpdateTime = now;

      const deltaX = e.screenX - resizeStart.mouseX;
      const deltaY = e.screenY - resizeStart.mouseY;

      const newWidth = Math.max(150, resizeStart.width + deltaX);
      const newHeight = Math.max(150, resizeStart.height + deltaY);

      if (window.electronAPI) {
        window.electronAPI.updateOverlaySize(noteId, Math.round(newWidth), Math.round(newHeight));
      }
    };

    const handleMouseUp = () => {
      console.log('[Resize] Mouse up - resize ended');
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, noteId, resizeStart]);

  // 이미지인지 텍스트인지 확인
  const isImage = content.startsWith('data:image/');

  return (
    <div 
      className="overlay-window"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <button 
        className="close-btn" 
        onClick={handleClose}
        onMouseDown={(e) => e.stopPropagation()}
      >
        ✕
      </button>
      
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

      <div 
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
  