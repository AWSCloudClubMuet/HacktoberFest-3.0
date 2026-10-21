package com.phantomx.tunewave.model;

import java.util.List;

public record RecommendResponse(boolean ok, List<String> artists) {
}
