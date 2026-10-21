package com.phantomx.tunewave.config;

import com.phantomx.tunewave.dsa.TuneWavePlayer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PlayerConfig {
    @Bean
    public TuneWavePlayer tuneWavePlayer(@Value("${tunewave.seed:true}") boolean seed) {
        TuneWavePlayer player = new TuneWavePlayer();
        if (seed) {
            DemoCatalog.seed(player);
        }
        return player;
    }
}
