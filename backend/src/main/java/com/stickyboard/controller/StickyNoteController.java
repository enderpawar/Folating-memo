package com.stickyboard.controller;

import com.stickyboard.dto.StickyNoteDto;
import com.stickyboard.service.StickyNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class StickyNoteController {

    private final StickyNoteService stickyNoteService;

    @GetMapping
    public ResponseEntity<List<StickyNoteDto>> getAllNotes() {
        return ResponseEntity.ok(stickyNoteService.getAllNotes());
    }

    @PostMapping
    public ResponseEntity<StickyNoteDto> createNote(@RequestBody StickyNoteDto dto) {
        return ResponseEntity.ok(stickyNoteService.createNote(dto));
    }

    @PutMapping("/{id}/position")
    public ResponseEntity<StickyNoteDto> updatePosition(
            @PathVariable Long id,
            @RequestParam Double x,
            @RequestParam Double y) {
        return ResponseEntity.ok(stickyNoteService.updateNotePosition(id, x, y));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        stickyNoteService.deleteNote(id);
        return ResponseEntity.ok().build();
    }
}
