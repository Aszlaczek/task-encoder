package com.adrianwzorek.taskencoder.message;

import com.adrianwzorek.taskencoder.crypto.CryptoService;
import com.adrianwzorek.taskencoder.message.api.MessagePageResponse;
import com.adrianwzorek.taskencoder.message.api.MessagePlaintextResponse;
import com.adrianwzorek.taskencoder.message.api.MessageResponse;
import com.adrianwzorek.taskencoder.message.api.MessageSummaryResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final CryptoService cryptoService;

    public MessageService(MessageRepository messageRepository, CryptoService cryptoService) {
        this.messageRepository = messageRepository;
        this.cryptoService = cryptoService;
    }

    @Transactional
    public MessageResponse create(String plaintext, UUID ownerId) {
        String packet = cryptoService.encrypt(plaintext, ownerId);
        Message saved = messageRepository.save(new Message(ownerId, packet));
        return new MessageResponse(saved.getId(), saved.getCreatedAt(), saved.getEncryptedPacket());
    }

    @Transactional(readOnly = true)
    public MessagePageResponse list(UUID ownerId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        Page<Message> result = messageRepository.findByOwnerId(ownerId, pageable);

        List<MessageSummaryResponse> items = result.getContent().stream()
                .map(message -> new MessageSummaryResponse(message.getId(), message.getCreatedAt()))
                .toList();

        return new MessagePageResponse(items, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public MessageResponse get(UUID ownerId, UUID messageId) {
        Message message = findOwnedMessage(ownerId, messageId);
        return new MessageResponse(message.getId(), message.getCreatedAt(), message.getEncryptedPacket());
    }

    @Transactional(readOnly = true)
    public MessagePlaintextResponse decrypt(UUID ownerId, UUID messageId) {
        Message message = findOwnedMessage(ownerId, messageId);
        String plaintext = cryptoService.decrypt(message.getEncryptedPacket(), ownerId);
        return new MessagePlaintextResponse(plaintext);
    }

    @Transactional
    public void delete(UUID ownerId, UUID messageId) {
        Message message = findOwnedMessage(ownerId, messageId);
        messageRepository.delete(message);
    }

    private Message findOwnedMessage(UUID ownerId, UUID messageId) {
        return messageRepository.findByIdAndOwnerId(messageId, ownerId)
                .orElseThrow(() -> new MessageNotFoundException(messageId));
    }
}
