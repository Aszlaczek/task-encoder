package com.adrianwzorek.taskencoder.message.api;

import com.adrianwzorek.taskencoder.auth.AppUserDetails;
import com.adrianwzorek.taskencoder.message.MessageService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse create(
            @AuthenticationPrincipal AppUserDetails user,
            @Valid @RequestBody CreateMessageRequest request) {
        return messageService.create(request.plaintext(), user.getId());
    }

    @GetMapping
    public MessagePageResponse list(
            @AuthenticationPrincipal AppUserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size;
        if (safeSize < 1) {
            safeSize = 10;
        }
        if (safeSize > 50) {
            safeSize = 50;
        }
        return messageService.list(user.getId(), safePage, safeSize);
    }

    @GetMapping("/{id}")
    public MessageResponse get(
            @AuthenticationPrincipal AppUserDetails user,
            @PathVariable UUID id) {
        return messageService.get(user.getId(), id);
    }

    @PostMapping("/{id}/decrypt")
    public MessagePlaintextResponse decrypt(
            @AuthenticationPrincipal AppUserDetails user,
            @PathVariable UUID id) {
        return messageService.decrypt(user.getId(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal AppUserDetails user,
            @PathVariable UUID id) {
        messageService.delete(user.getId(), id);
    }
}
