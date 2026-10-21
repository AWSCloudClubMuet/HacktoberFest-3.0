package com.phantomx.tunewave.controller;

import com.phantomx.tunewave.model.ActionResponse;
import com.phantomx.tunewave.model.TitleRequest;
import com.phantomx.tunewave.service.TuneWaveService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/queue")
public class QueueController {
    private final TuneWaveService service;

    public QueueController(TuneWaveService service) {
        this.service = service;
    }

    @PostMapping
    public ActionResponse enqueue(@Valid @RequestBody TitleRequest request) {
        return service.addToUpNext(request.title());
    }
}
