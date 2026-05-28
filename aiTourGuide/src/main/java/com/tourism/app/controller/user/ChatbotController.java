package com.tourism.app.controller.user;

import com.tourism.app.dto.request.ChatRequest;
import com.tourism.app.dto.response.ApiResponse;
import com.tourism.app.dto.response.ChatResponse;
import com.tourism.app.entity.ChatMessage;
import com.tourism.app.security.jwt.UserPrincipal;
import com.tourism.app.service.impl.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    /**
     * POST /api/chatbot/chat
     * Gửi message và nhận response từ AI
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        String email = userPrincipal != null ? userPrincipal.getEmail() : null;
        return ResponseEntity.ok(ApiResponse.success(chatbotService.chat(request, email)));
    }

    /**
     * GET /api/chatbot/history/{sessionId}
     */
    @GetMapping("/history/{sessionId}")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getHistory(@PathVariable String sessionId) {
        return ResponseEntity.ok(ApiResponse.success(chatbotService.getChatHistory(sessionId)));
    }

    /**
     * DELETE /api/chatbot/session/{sessionId}
     */
    @DeleteMapping("/session/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> clearSession(@PathVariable String sessionId) {
        chatbotService.clearSession(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Xóa lịch sử chat thành công", null));
    }
}
