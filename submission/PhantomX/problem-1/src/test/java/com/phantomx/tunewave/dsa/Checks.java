package com.phantomx.tunewave.dsa;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

final class Checks {
    private int passed;
    private int failed;

    void eq(Object expected, Object actual, String name) {
        if (Objects.equals(expected, actual)) {
            passed++;
        } else {
            failed++;
            System.out.println("  FAIL " + name + " expected=" + expected + " actual=" + actual);
        }
    }

    void eqList(List<?> expected, List<?> actual, String name) {
        eq(expected, actual, name);
    }

    void isTrue(boolean condition, String name) {
        eq(Boolean.TRUE, Boolean.valueOf(condition), name);
    }

    void isFalse(boolean condition, String name) {
        eq(Boolean.FALSE, Boolean.valueOf(condition), name);
    }

    void isNull(Object actual, String name) {
        eq(null, actual, name);
    }

    int failed() {
        return failed;
    }

    void printSummary(String suite) {
        System.out.println(suite + ": " + passed + " passed, " + failed + " failed");
    }

    static List<String> ids(String... values) {
        return Arrays.asList(values);
    }

    static Song song(String id, String title) {
        return new Song(id, title, "artist");
    }
}
