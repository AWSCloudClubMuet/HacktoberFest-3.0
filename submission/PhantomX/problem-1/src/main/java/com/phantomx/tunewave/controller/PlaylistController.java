package com.phantomx.tunewave.controller;

import com.phantomx.tunewave.model.ActionResponse;
import com.phantomx.tunewave.model.SongRequest;
import com.phantomx.tunewave.service.TuneWaveService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/songs")
public class PlaylistController {
    private final TuneWaveService service;

    public PlaylistController(TuneWaveService service) {
        this.service = service;
    }

    @PostMapping
    public ActionResponse add(@Valid @RequestBody SongRequest request) {
        return service.addSong(request.title(), request.artist());
    }

    @DeleteMapping
    public ActionResponse remove(@RequestParam String title) {
        return service.removeSong(title);
    }
}
