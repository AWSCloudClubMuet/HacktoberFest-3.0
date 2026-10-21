package com.phantomx.tunewave.model;

import java.util.List;

public record PlayerStateDto(
        List<SongDto> playlist,
        SongDto current,
        SongDto playing,
        boolean repeat,
        List<SongDto> upNext,
        List<SongDto> history,
        int historyMax
) {
}
