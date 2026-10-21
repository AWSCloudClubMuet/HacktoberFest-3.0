package com.phantomx.tunewave.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PlayerApiTest {
    @Autowired
    private MockMvc mvc;

    @Test
    void playerStateIncludesSeededPlaylist() throws Exception {
        mvc.perform(get("/api/player"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.playing.title").value("Bohemian Rhapsody"))
                .andExpect(jsonPath("$.current.title").value("Bohemian Rhapsody"))
                .andExpect(jsonPath("$.repeat").value(false))
                .andExpect(jsonPath("$.historyMax").value(10));
    }

    @Test
    void addAndRemoveSongByTitle() throws Exception {
        mvc.perform(post("/api/songs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Imagine\",\"artist\":\"John Lennon\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.song.title").value("Imagine"));

        mvc.perform(delete("/api/songs").param("title", "Imagine"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
    }

    @Test
    void queuePlayNextKeepsPlaylistCursor() throws Exception {
        mvc.perform(post("/api/queue")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Blinding Lights\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/player/play-next"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.song.title").value("Blinding Lights"))
                .andExpect(jsonPath("$.source").value("queue"));

        mvc.perform(get("/api/player"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.playing.title").value("Blinding Lights"))
                .andExpect(jsonPath("$.current.title").value("Bohemian Rhapsody"));
    }

    @Test
    void searchAndPrefix() throws Exception {
        mvc.perform(get("/api/search").param("title", "Billie Jean"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.songs[0].title").value("Billie Jean"));

        mvc.perform(get("/api/search/prefix").param("q", "Bl"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titles", hasItem("Blinding Lights")))
                .andExpect(jsonPath("$.songs[?(@.id == 's5')].title", hasItem("Blinding Lights")))
                .andExpect(jsonPath("$.songs[?(@.id == 's5')].artist", hasItem("The Weeknd")));
    }

    @Test
    void twoHopRecommendations() throws Exception {
        mvc.perform(get("/api/artists/recommendations").param("artist", "The Weeknd"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.artists", hasItem("Justice")));
    }

    @Test
    void nextPreviousRepeatAndBack() throws Exception {
        mvc.perform(post("/api/player/next"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.song.title").value("Billie Jean"));

        mvc.perform(post("/api/player/previous"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.song.title").value("Bohemian Rhapsody"));

        mvc.perform(post("/api/player/repeat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.repeat").value(true));

        mvc.perform(post("/api/player/play-next")).andExpect(status().isOk());
        mvc.perform(post("/api/player/back"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));

        mvc.perform(post("/api/player/back"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.error").value("History is empty."));
    }

    @Test
    void invalidRequestsReturnErrorBody() throws Exception {
        mvc.perform(post("/api/songs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.ok").value(false));

        mvc.perform(delete("/api/songs").param("title", "Missing"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No song named \"Missing\"."));

        mvc.perform(post("/api/artists/relations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"artistA\":\"Adele\",\"artistB\":\"Adele\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Artists must be different."));

        mvc.perform(post("/api/songs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid request body."));

        mvc.perform(post("/api/player/back"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("History is empty."));
    }
}
