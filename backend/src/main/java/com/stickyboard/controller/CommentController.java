package com.stickyboard.controller;

import com.stickyboard.dto.CommentDto;
import com.stickyboard.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/note/{noteId}")
    public ResponseEntity<List<CommentDto>> getComments(@PathVariable Long noteId) {
        return ResponseEntity.ok(commentService.getCommentsByNoteId(noteId));
    }

    @PostMapping
    public ResponseEntity<CommentDto> addComment(@RequestBody CommentDto dto) {
        return ResponseEntity.ok(commentService.addComment(dto));
    }
}
