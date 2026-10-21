package com.phantomx.tunewave.controller;

import com.phantomx.tunewave.model.ActionResponse;
import com.phantomx.tunewave.model.RecommendResponse;
import com.phantomx.tunewave.model.RelationRequest;
import com.phantomx.tunewave.service.TuneWaveService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/artists")
public class ArtistController {
    private final TuneWaveService service;

    public ArtistController(TuneWaveService service) {
        this.service = service;
    }

    @PostMapping("/relations")
    public ActionResponse relate(@Valid @RequestBody RelationRequest request) {
        return service.addRelation(request.artistA(), request.artistB());
    }

    @GetMapping("/recommendations")
    public RecommendResponse recommend(@RequestParam String artist) {
        return service.recommend(artist);
    }
}
