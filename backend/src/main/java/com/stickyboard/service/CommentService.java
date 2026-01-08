package com.stickyboard.service;

import com.stickyboard.dto.CommentDto;
import com.stickyboard.model.Comment;
import com.stickyboard.model.StickyNote;
import com.stickyboard.repository.CommentRepository;
import com.stickyboard.repository.StickyNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final StickyNoteRepository stickyNoteRepository;

    public List<CommentDto> getCommentsByNoteId(Long noteId) {
        return commentRepository.findByStickyNoteId(noteId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public CommentDto addComment(CommentDto dto) {
        StickyNote note = stickyNoteRepository.findById(dto.getStickyNoteId())
                .orElseThrow(() -> new RuntimeException("StickyNote not found"));

        Comment comment = new Comment();
        comment.setContent(dto.getContent());
        comment.setAuthor(dto.getAuthor() != null ? dto.getAuthor() : "Anonymous");
        comment.setStickyNote(note);

        Comment saved = commentRepository.save(comment);
        return convertToDto(saved);
    }

    private CommentDto convertToDto(Comment comment) {
        return new CommentDto(
                comment.getId(),
                comment.getContent(),
                comment.getAuthor(),
                comment.getStickyNote().getId(),
                comment.getCreatedAt()
        );
    }
}
