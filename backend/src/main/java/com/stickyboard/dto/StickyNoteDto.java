package com.stickyboard.dto;

import com.stickyboard.model.StickyNote;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StickyNoteDto {
    private Long id;
    private StickyNote.NoteType type;
    private String content;
    private Double positionX;
    private Double positionY;
    private Integer width;
    private Integer height;
    private String color;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
