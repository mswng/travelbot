package com.tourism.app.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@Slf4j
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private static final String DEFAULT_REDIRECT = "http://localhost:5173/oauth2/redirect";

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        log.error("OAuth2 authentication failed: {}", exception.getMessage());
        String targetUrl = UriComponentsBuilder.fromUriString(DEFAULT_REDIRECT)
                .queryParam("error", exception.getLocalizedMessage())
                .build().toUriString();
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
