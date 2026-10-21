package com.phantomx.tunewave.controller;

import com.phantomx.tunewave.model.ActionResponse;
import com.phantomx.tunewave.model.PlayerStateDto;
import com.phantomx.tunewave.service.TuneWaveService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/player")
public class PlayerController {
    private final TuneWaveService service;

    public PlayerController(TuneWaveService service) {
        this.service = service;
    }

    @GetMapping
    public PlayerStateDto state() {
        return service.state();
    }

    @PostMapping("/next")
    public ActionResponse next() {
        return service.next();
    }

    @PostMapping("/previous")
    public ActionResponse previous() {
        return service.previous();
    }

    @PostMapping("/repeat")
    public ActionResponse repeat() {
        return service.toggleRepeat();
    }

    @PostMapping("/play-next")
    public ActionResponse playNext() {
        return service.playNext();
    }

    @PostMapping("/back")
    public ActionResponse back() {
        return service.back();
    }
}
