package com.adrianwzorek.taskencoder.message;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.adrianwzorek.taskencoder.crypto.CryptoService;
import com.adrianwzorek.taskencoder.message.api.MessagePageResponse;
import com.adrianwzorek.taskencoder.message.api.MessagePlaintextResponse;
import com.adrianwzorek.taskencoder.message.api.MessageResponse;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private CryptoService cryptoService;

    private MessageService messageService;

    private final UUID ownerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID messageId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    @BeforeEach
    void setUp() {
        messageService = new MessageService(messageRepository, cryptoService);
    }

    @Test
    void createEncryptsAndSavesMessage() {
        when(cryptoService.encrypt("tajne", ownerId)).thenReturn("v1.nonce.ct");
        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> {
            Message message = invocation.getArgument(0);
            ReflectionTestUtils.setField(message, "id", messageId);
            ReflectionTestUtils.setField(message, "createdAt", Instant.parse("2026-11-16T12:00:00Z"));
            return message;
        });

        MessageResponse response = messageService.create("tajne", ownerId);

        ArgumentCaptor<Message> captor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(captor.capture());
        assertThat(captor.getValue().getOwnerId()).isEqualTo(ownerId);
        assertThat(captor.getValue().getEncryptedPacket()).isEqualTo("v1.nonce.ct");
        assertThat(response.id()).isEqualTo(messageId);
        assertThat(response.packet()).isEqualTo("v1.nonce.ct");
    }

    @Test
    void listReturnsOnlySummaries() {
        Message message = new Message(ownerId, "v1.nonce.ct");
        ReflectionTestUtils.setField(message, "id", messageId);
        ReflectionTestUtils.setField(message, "createdAt", Instant.parse("2026-11-16T12:00:00Z"));
        when(messageRepository.findByOwnerId(eq(ownerId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(message)));

        MessagePageResponse page = messageService.list(ownerId, 0, 10);

        assertThat(page.items()).hasSize(1);
        assertThat(page.items().get(0).id()).isEqualTo(messageId);
        assertThat(page.totalElements()).isEqualTo(1);
    }

    @Test
    void decryptReturnsPlaintextForOwnedMessage() {
        Message message = new Message(ownerId, "v1.nonce.ct");
        ReflectionTestUtils.setField(message, "id", messageId);
        when(messageRepository.findByIdAndOwnerId(messageId, ownerId)).thenReturn(Optional.of(message));
        when(cryptoService.decrypt("v1.nonce.ct", ownerId)).thenReturn("jawny tekst");

        MessagePlaintextResponse response = messageService.decrypt(ownerId, messageId);

        assertThat(response.plaintext()).isEqualTo("jawny tekst");
    }

    @Test
    void getThrowsWhenMessageMissingOrNotOwned() {
        when(messageRepository.findByIdAndOwnerId(messageId, ownerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messageService.get(ownerId, messageId))
                .isInstanceOf(MessageNotFoundException.class);
    }

    @Test
    void deleteRemovesOwnedMessage() {
        Message message = new Message(ownerId, "v1.nonce.ct");
        ReflectionTestUtils.setField(message, "id", messageId);
        when(messageRepository.findByIdAndOwnerId(messageId, ownerId)).thenReturn(Optional.of(message));

        messageService.delete(ownerId, messageId);

        verify(messageRepository).delete(message);
    }
}
