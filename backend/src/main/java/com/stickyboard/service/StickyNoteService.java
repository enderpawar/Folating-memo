package com.stickyboard.service;

import com.stickyboard.dto.StickyNoteDto;
import com.stickyboard.model.StickyNote;
import com.stickyboard.repository.StickyNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StickyNoteService {

    private final StickyNoteRepository stickyNoteRepository;

    public List<StickyNoteDto> getAllNotes() {
        return stickyNoteRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public StickyNoteDto createNote(StickyNoteDto dto) {
        StickyNote note = new StickyNote();
        note.setType(dto.getType());
        note.setContent(dto.getContent());
        note.setPositionX(dto.getPositionX() != null ? dto.getPositionX() : 100.0);
        note.setPositionY(dto.getPositionY() != null ? dto.getPositionY() : 100.0);
        note.setWidth(dto.getWidth() != null ? dto.getWidth() : 200);
        note.setHeight(dto.getHeight() != null ? dto.getHeight() : 200);
        note.setColor(dto.getColor() != null ? dto.getColor() : "#FFEB3B");
        note.setCreatedBy(dto.getCreatedBy() != null ? dto.getCreatedBy() : "Anonymous");
        
        StickyNote saved = stickyNoteRepository.save(note);
        return convertToDto(saved);
    }

    public StickyNoteDto updateNotePosition(Long id, Double x, Double y) {
        StickyNote note = stickyNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        note.setPositionX(x);
        note.setPositionY(y);
        return convertToDto(note);
    }

    public void deleteNote(Long id) {
        stickyNoteRepository.deleteById(id);
    }

    private StickyNoteDto convertToDto(StickyNote note) {
        return new StickyNoteDto(
                note.getId(),
                note.getType(),
                note.getContent(),
                note.getPositionX(),
                note.getPositionY(),
                note.getWidth(),
                note.getHeight(),
                note.getColor(),
                note.getCreatedBy(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
