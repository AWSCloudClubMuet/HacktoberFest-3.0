package tunewave.datastructures;

import java.util.ArrayList;
import java.util.List;

/**
 * Custom Hash Map implementation using Separate Chaining.
 * Provides O(1) average-time complexity for get, put, containsKey, and remove.
 *
 * @param <K> Key type
 * @param <V> Value type
 */
public class CustomHashMap<K, V> {

    private static final int DEFAULT_CAPACITY = 16;
    private static final float LOAD_FACTOR = 0.75f;

    public static class Entry<K, V> {
        public final K key;
        public V value;
        public Entry<K, V> next;

        public Entry(K key, V value, Entry<K, V> next) {
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    private Entry<K, V>[] buckets;
    private int size;
    private int capacity;

    @SuppressWarnings("unchecked")
    public CustomHashMap(int initialCapacity) {
        this.capacity = initialCapacity;
        this.buckets = new Entry[capacity];
        this.size = 0;
    }

    public CustomHashMap() {
        this(DEFAULT_CAPACITY);
    }

    private int getBucketIndex(K key) {
        if (key == null) return 0;
        int hash = key.hashCode();
        return Math.abs(hash) % capacity;
    }

    /**
     * Associates the specified value with the specified key.
     * @param key Key
     * @param value Value
     * @return Old value if key already existed, or null
     */
    public V put(K key, V value) {
        int index = getBucketIndex(key);
        Entry<K, V> current = buckets[index];

        while (current != null) {
            if ((key == null && current.key == null) || (key != null && key.equals(current.key))) {
                V oldVal = current.value;
                current.value = value;
                return oldVal;
            }
            current = current.next;
        }

        // Add to front of bucket chain
        buckets[index] = new Entry<>(key, value, buckets[index]);
        size++;

        if ((float) size / capacity >= LOAD_FACTOR) {
            resize();
        }

        return null;
    }

    /**
     * Returns the value associated with the specified key, or null if not found.
     */
    public V get(K key) {
        int index = getBucketIndex(key);
        Entry<K, V> current = buckets[index];

        while (current != null) {
            if ((key == null && current.key == null) || (key != null && key.equals(current.key))) {
                return current.value;
            }
            current = current.next;
        }

        return null;
    }

    /**
     * Checks if the map contains the given key.
     */
    public boolean containsKey(K key) {
        return get(key) != null;
    }

    /**
     * Removes the mapping for the key if present.
     * @param key Key to remove
     * @return Removed value or null
     */
    public V remove(K key) {
        int index = getBucketIndex(key);
        Entry<K, V> current = buckets[index];
        Entry<K, V> prev = null;

        while (current != null) {
            if ((key == null && current.key == null) || (key != null && key.equals(current.key))) {
                if (prev == null) {
                    buckets[index] = current.next;
                } else {
                    prev.next = current.next;
                }
                size--;
                return current.value;
            }
            prev = current;
            current = current.next;
        }

        return null;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public void clear() {
        @SuppressWarnings("unchecked")
        Entry<K, V>[] newBuckets = new Entry[DEFAULT_CAPACITY];
        this.buckets = newBuckets;
        this.capacity = DEFAULT_CAPACITY;
        this.size = 0;
    }

    public List<K> keys() {
        List<K> keyList = new ArrayList<>();
        for (Entry<K, V> head : buckets) {
            Entry<K, V> curr = head;
            while (curr != null) {
                keyList.add(curr.key);
                curr = curr.next;
            }
        }
        return keyList;
    }

    public List<V> values() {
        List<V> valList = new ArrayList<>();
        for (Entry<K, V> head : buckets) {
            Entry<K, V> curr = head;
            while (curr != null) {
                valList.add(curr.value);
                curr = curr.next;
            }
        }
        return valList;
    }

    @SuppressWarnings("unchecked")
    private void resize() {
        int newCapacity = capacity * 2;
        Entry<K, V>[] oldBuckets = buckets;
        buckets = new Entry[newCapacity];
        capacity = newCapacity;
        size = 0;

        for (Entry<K, V> head : oldBuckets) {
            Entry<K, V> curr = head;
            while (curr != null) {
                put(curr.key, curr.value);
                curr = curr.next;
            }
        }
    }
}
