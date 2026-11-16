package com.adrianwzorek.taskencoder.message;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    Page<Message> findByOwnerId(UUID ownerId, Pageable pageable);

    Optional<Message> findByIdAndOwnerId(UUID id, UUID ownerId);
}
