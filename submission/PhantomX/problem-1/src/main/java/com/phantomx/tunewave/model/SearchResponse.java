package com.phantomx.tunewave.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SearchResponse(boolean ok, List<SongDto> songs, List<String> titles) {
    public static SearchResponse songs(List<SongDto> songs) {
        return new SearchResponse(true, songs, null);
    }

    public static SearchResponse titles(List<String> titles) {
        return new SearchResponse(true, null, titles);
    }

    public static SearchResponse prefix(List<SongDto> songs, List<String> titles) {
        return new SearchResponse(true, songs, titles);
    }
}
