package com.tourism.app.service.impl;

import com.tourism.app.dto.request.ChatRequest;
import com.tourism.app.dto.response.ChatResponse;
import com.tourism.app.entity.ChatMessage;
import com.tourism.app.entity.User;
import com.tourism.app.repository.ChatMessageRepository;
import com.tourism.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    // URL của FastAPI chatbot service
    private static final String CHATBOT_SERVICE_URL = "http://localhost:8001";

    private final WebClient webClient = WebClient.builder()
            .baseUrl(CHATBOT_SERVICE_URL)
            .build();

    @Transactional
    public ChatResponse chat(ChatRequest request, String userEmail) {
        String sessionId = (request.getSessionId() != null && !request.getSessionId().isBlank())
                ? request.getSessionId()
                : UUID.randomUUID().toString();

        User user = null;
        if (userEmail != null) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }

        // Lưu message user
        chatMessageRepository.save(ChatMessage.builder()
                .user(user).sessionId(sessionId)
                .role(ChatMessage.MessageRole.USER)
                .content(request.getMessage())
                .build());

        // Lấy lịch sử để gửi sang FastAPI
        List<ChatMessage> history = chatMessageRepository
                .findBySessionIdOrderByCreatedAtAsc(sessionId);

        List<Map<String, String>> historyPayload = history.stream()
                .filter(m -> !m.getContent().equals(request.getMessage()))
                .map(m -> Map.of(
                        "role", m.getRole().name().toLowerCase(),
                        "content", m.getContent()
                ))
                .toList();

        // Gọi FastAPI chatbot service
        String botReply;
        try {
            Map<String, Object> payload = Map.of(
                    "message", request.getMessage(),
                    "history", historyPayload,
                    "session_id", sessionId
            );

            Map response = webClient.post()
                    .uri("/chat")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            botReply = response != null ? (String) response.get("answer") : "Xin lỗi, có lỗi xảy ra.";

        } catch (WebClientResponseException e) {
            log.error("Chatbot service error: {}", e.getMessage());
            botReply = "Chatbot service đang không khả dụng, vui lòng thử lại sau.";
        } catch (Exception e) {
            log.error("Unexpected error calling chatbot: {}", e.getMessage());
            botReply = "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn.";
        }

        // Lưu response của bot
        chatMessageRepository.save(ChatMessage.builder()
                .user(user).sessionId(sessionId)
                .role(ChatMessage.MessageRole.ASSISTANT)
                .content(botReply)
                .build());

        return ChatResponse.builder()
                .sessionId(sessionId)
                .message(botReply)
                .role("ASSISTANT")
                .build();
    }

    public List<ChatMessage> getChatHistory(String sessionId) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    @Transactional
    public void clearSession(String sessionId) {
        chatMessageRepository.deleteBySessionId(sessionId);
    }
}
