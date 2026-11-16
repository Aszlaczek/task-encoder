package com.adrianwzorek.taskencoder.message;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Zapisana wiadomość użytkownika. W bazie przechowywany jest wyłącznie pakiet
 * szyfrogramu, nigdy treść jawna.
 */
@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "encrypted_packet", nullable = false, columnDefinition = "text")
    private String encryptedPacket;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Message() {
    }

    public Message(UUID ownerId, String encryptedPacket) {
        this.ownerId = ownerId;
        this.encryptedPacket = encryptedPacket;
    }

    public UUID getId() {
        return id;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public String getEncryptedPacket() {
        return encryptedPacket;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
