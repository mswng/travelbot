package com.tourism.app.security.oauth2;

import com.tourism.app.security.jwt.JwtTokenProvider;
import com.tourism.app.security.jwt.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider tokenProvider;

    // Hardcode ở đây, không dùng @Value nữa để tránh lỗi yml
    private static final List<String> AUTHORIZED_REDIRECT_URIS = List.of(
            "http://localhost:5173/oauth2/redirect",
            "http://localhost:3000/oauth2/redirect",
            "http://localhost:8080/oauth2/redirect"
    );

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        String targetUrl = determineTargetUrl(request, response, authentication);
        if (response.isCommitted()) return;
        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    @Override
    protected String determineTargetUrl(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) {
        String redirectUri = request.getParameter("redirect_uri");

        String targetUrl = (redirectUri != null && isAuthorizedRedirectUri(redirectUri))
                ? redirectUri
                : AUTHORIZED_REDIRECT_URIS.get(0);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String token = tokenProvider.generateTokenFromEmail(userPrincipal.getEmail());

        return UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("token", token)
                .build().toUriString();
    }

    private boolean isAuthorizedRedirectUri(String uri) {
        return AUTHORIZED_REDIRECT_URIS.stream()
                .anyMatch(authorizedUri -> authorizedUri.equalsIgnoreCase(uri));
    }
}
