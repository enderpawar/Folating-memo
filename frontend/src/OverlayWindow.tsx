import { useState, useEffect } from 'react';
import './OverlayWindow.css';

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
  }, []);

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.close-btn')) return;
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    
    setIsDragging(true);
    setWasDragged(false);
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
    
    if (!noteId || !window.electronAPI) return;

    try {
      const size = await window.electronAPI.getWindowSize(noteId);
      
      setIsResizing(true);
      setResizeStart({
        mouseX: e.screenX,
        mouseY: e.screenY,
        width: size.width,
        height: size.height
      });
      
      console.log('[Resize] Started with size:', size);
    } catch (error) {
      console.error('[Resize] Failed to get window size:', error);
    }
  };

  // 전역 마우스 이동 처리
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && noteId && window.electronAPI) {
        setWasDragged(true);
        const deltaX = e.screenX - dragStart.mouseX;
        const deltaY = e.screenY - dragStart.mouseY;
        
        const newX = dragStart.windowX + deltaX;
        const newY = dragStart.windowY + deltaY;
        
        window.electronAPI.updateOverlayPosition(noteId, Math.round(newX), Math.round(newY));
      }

      if (isResizing && noteId && window.electronAPI) {
        const deltaX = e.screenX - resizeStart.mouseX;
        const deltaY = e.screenY - resizeStart.mouseY;
        
        const newWidth = Math.max(250, resizeStart.width + deltaX);
        const newHeight = Math.max(200, resizeStart.height + deltaY);
        
        console.log(`[Resize] Moving: delta=(${deltaX}, ${deltaY}), new size=${newWidth}x${newHeight}`);
        
        window.electronAPI.updateOverlaySize(noteId, Math.round(newWidth), Math.round(newHeight));
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setTimeout(() => setWasDragged(false), 50);
      }
      
      if (isResizing) {
        console.log('[Resize] Finished');
        setIsResizing(false);
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, noteId]);

  const handleClose = () => {
    if (noteId && window.electronAPI) {
      window.electronAPI.closeOverlay(noteId);
    }
  };

  // 이미지인지 텍스트인지 확인
  const isImage = content.startsWith('data:image/');

  return (
    <div 
      className="overlay-window"
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className="content">
        {isImage ? (
          <img 
            src={content} 
            alt="sticky note" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            draggable={false}
          />
        ) : (
          <div className="text-content">{content}</div>
        )}
      </div>

      <button className="close-btn" onClick={handleClose}>
        ✕
      </button>

      <div 
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
        style={{ cursor: isResizing ? 'nwse-resize' : 'nwse-resize' }}
      />
    </div>
  );
}
