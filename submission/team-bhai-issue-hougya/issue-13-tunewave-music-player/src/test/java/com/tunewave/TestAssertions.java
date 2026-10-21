package com.tunewave;

import java.util.Objects;

/**
 * Lightweight, zero-dependency test assertions.
 * Throws java.lang.AssertionError on mismatch with clear diff diagnostics.
 */
public final class TestAssertions {

    private TestAssertions() {}

    public static void assertEquals(Object expected, Object actual, String message) {
        if (!Objects.equals(expected, actual)) {
            throw new AssertionError(String.format("%s => Expected: <%s>, but was: <%s>", 
                message, expected, actual));
        }
    }

    public static void assertEquals(Object expected, Object actual) {
        assertEquals(expected, actual, "Assertion failed");
    }

    public static void assertEquals(int expected, int actual, String message) {
        if (expected != actual) {
            throw new AssertionError(String.format("%s => Expected: <%d>, but was: <%d>", 
                message, expected, actual));
        }
    }

    public static void assertEquals(int expected, int actual) {
        assertEquals(expected, actual, "Assertion failed");
    }

    public static void assertTrue(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(String.format("%s => Expected true, but was false", message));
        }
    }

    public static void assertTrue(boolean condition) {
        assertTrue(condition, "Assertion failed");
    }

    public static void assertFalse(boolean condition, String message) {
        if (condition) {
            throw new AssertionError(String.format("%s => Expected false, but was true", message));
        }
    }

    public static void assertFalse(boolean condition) {
        assertFalse(condition, "Assertion failed");
    }

    public static void assertNull(Object actual, String message) {
        if (actual != null) {
            throw new AssertionError(String.format("%s => Expected null, but was: <%s>", message, actual));
        }
    }

    public static void assertNull(Object actual) {
        assertNull(actual, "Assertion failed");
    }

    public static void assertNotNull(Object actual, String message) {
        if (actual == null) {
            throw new AssertionError(String.format("%s => Expected non-null, but was null", message));
        }
    }

    public static void assertNotNull(Object actual) {
        assertNotNull(actual, "Assertion failed");
    }

    public static void assertNotEquals(Object unexpected, Object actual, String message) {
        if (Objects.equals(unexpected, actual)) {
            throw new AssertionError(String.format("%s => Expected value different from: <%s>", message, unexpected));
        }
    }

    public static void assertNotEquals(Object unexpected, Object actual) {
        assertNotEquals(unexpected, actual, "Assertion failed");
    }
}
