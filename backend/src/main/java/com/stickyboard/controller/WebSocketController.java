package com.stickyboard.controller;

import com.stickyboard.dto.CommentDto;
import com.stickyboard.dto.StickyNoteDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/note/create")
    @SendTo("/topic/notes")
    public StickyNoteDto createNote(StickyNoteDto note) {
        return note;
    }

    @MessageMapping("/note/move")
    @SendTo("/topic/notes/move")
    public Map<String, Object> moveNote(Map<String, Object> payload) {
        return payload;
    }

    @MessageMapping("/note/delete")
    @SendTo("/topic/notes/delete")
    public Long deleteNote(Long noteId) {
        return noteId;
    }

    @MessageMapping("/comment/add")
    @SendTo("/topic/comments")
    public CommentDto addComment(CommentDto comment) {
        return comment;
    }
}
