package com.phantomx.tunewave.model;

public record ErrorResponse(boolean ok, String error) {
    public static ErrorResponse of(String message) {
        return new ErrorResponse(false, message);
    }
}
