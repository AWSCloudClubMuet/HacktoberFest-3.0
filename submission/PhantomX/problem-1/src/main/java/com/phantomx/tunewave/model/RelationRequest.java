package com.phantomx.tunewave.model;

import jakarta.validation.constraints.NotBlank;

public record RelationRequest(
        @NotBlank(message = "Both artist names are required.") String artistA,
        @NotBlank(message = "Both artist names are required.") String artistB
) {
}
