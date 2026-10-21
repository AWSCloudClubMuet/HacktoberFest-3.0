package com.phantomx.tunewave.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ActionResponse(
        boolean ok,
        String error,
        Boolean end,
        SongDto song,
        Boolean repeat,
        String source
) {
    public static ActionResponse ok(SongDto song) {
        return new ActionResponse(true, null, null, song, null, null);
    }

    public static ActionResponse end(SongDto song) {
        return new ActionResponse(true, null, true, song, null, null);
    }

    public static ActionResponse repeat(boolean on) {
        return new ActionResponse(true, null, null, null, on, null);
    }

    public static ActionResponse queued(SongDto song) {
        return new ActionResponse(true, null, null, song, null, "queue");
    }

    public static ActionResponse play(SongDto song, String source) {
        return new ActionResponse(true, null, null, song, null, source);
    }
}
