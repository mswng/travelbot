package com.tourism.app.exception;

public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) { super(message); }
}
