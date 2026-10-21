package com.phantomx.tunewave.model;

import jakarta.validation.constraints.NotBlank;

public record SongRequest(
        @NotBlank(message = "Song name is required.") String title,
        String artist
) {
}
