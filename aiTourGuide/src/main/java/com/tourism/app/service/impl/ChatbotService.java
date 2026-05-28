package com.tourism.app.service.impl;

import com.tourism.app.dto.request.ChatRequest;
import com.tourism.app.dto.response.ChatResponse;
import com.tourism.app.entity.ChatMessage;
import com.tourism.app.entity.User;
import com.tourism.app.repository.ChatMessageRepository;
import com.tourism.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    // TODO: Inject AI client của cậu ở đây
    // @Value("${app.chatbot.api-key}") private String apiKey;
    // @Value("${app.chatbot.api-url}") private String apiUrl;

    @Transactional
    public ChatResponse chat(ChatRequest request, String userEmail) {
        // Tạo session mới nếu chưa có
        String sessionId = (request.getSessionId() != null && !request.getSessionId().isBlank())
                ? request.getSessionId()
                : UUID.randomUUID().toString();

        // Lấy user nếu đã đăng nhập
        User user = null;
        if (userEmail != null) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }

        // Lưu message của user
        ChatMessage userMessage = ChatMessage.builder()
                .user(user)
                .sessionId(sessionId)
                .role(ChatMessage.MessageRole.USER)
                .content(request.getMessage())
                .build();
        chatMessageRepository.save(userMessage);

        // Lấy lịch sử chat cho context
        List<ChatMessage> history = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        // ================================================================
        // TODO: Gọi AI model của cậu ở đây
        // String aiReply = callYourAIModel(request.getMessage(), history);
        // ================================================================
        String aiReply = buildPlaceholderResponse(request.getMessage());

        // Lưu response của bot
        ChatMessage botMessage = ChatMessage.builder()
                .user(user)
                .sessionId(sessionId)
                .role(ChatMessage.MessageRole.ASSISTANT)
                .content(aiReply)
                .build();
        chatMessageRepository.save(botMessage);

        return ChatResponse.builder()
                .sessionId(sessionId)
                .message(aiReply)
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

    // ================================================================
    // TODO: Cậu thay thế method này bằng logic gọi AI thật
    // Ví dụ: Gemini, OpenAI, Ollama...
    //
    // private String callYourAIModel(String message, List<ChatMessage> history) {
    //     // Build prompt với history
    //     // Gọi API
    //     // Return response
    // }
    // ================================================================
    private String buildPlaceholderResponse(String message) {
        return "[AI Placeholder] Bạn hỏi: \"" + message + "\". " +
               "Vui lòng tích hợp AI model thực tế vào ChatbotService.callYourAIModel()";
    }
}
