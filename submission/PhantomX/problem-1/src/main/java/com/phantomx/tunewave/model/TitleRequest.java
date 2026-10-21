package com.phantomx.tunewave.model;

import jakarta.validation.constraints.NotBlank;

public record TitleRequest(
        @NotBlank(message = "Song name is required.") String title
) {
}
