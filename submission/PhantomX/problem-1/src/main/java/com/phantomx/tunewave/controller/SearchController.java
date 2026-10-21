package com.phantomx.tunewave.controller;

import com.phantomx.tunewave.model.SearchResponse;
import com.phantomx.tunewave.service.TuneWaveService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
public class SearchController {
    private final TuneWaveService service;

    public SearchController(TuneWaveService service) {
        this.service = service;
    }

    @GetMapping
    public SearchResponse find(@RequestParam String title) {
        return service.findSong(title);
    }

    @GetMapping("/prefix")
    public SearchResponse prefix(@RequestParam(name = "q", defaultValue = "") String query) {
        return service.prefixSearch(query);
    }
}
