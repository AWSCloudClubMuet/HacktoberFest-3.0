package com.phantomx.tunewave.dsa;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DsaSuiteTest {
    @Test
    void existingSuitePasses() {
        assertEquals(0, TestRunner.runAll());
    }
}
