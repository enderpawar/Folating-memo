package com.stickyboard.repository;

import com.stickyboard.model.StickyNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StickyNoteRepository extends JpaRepository<StickyNote, Long> {
}
