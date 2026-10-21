package com.phantomx.tunewave.dsa;

import java.util.ArrayList;
import java.util.List;

final class SimpleHashMap<K, V> {
    private static final float LOAD = 0.75f;

    private static final class Entry<K, V> {
        final K key;
        V value;
        Entry<K, V> next;

        Entry(K key, V value, Entry<K, V> next) {
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    private Entry<K, V>[] table;
    private int size;

    @SuppressWarnings("unchecked")
    SimpleHashMap() {
        table = (Entry<K, V>[]) new Entry<?, ?>[16];
    }

    int size() {
        return size;
    }

    boolean isEmpty() {
        return size == 0;
    }

    boolean containsKey(K key) {
        return find(key) != null;
    }

    V get(K key) {
        Entry<K, V> entry = find(key);
        return entry == null ? null : entry.value;
    }

    void put(K key, V value) {
        if (key == null) {
            return;
        }
        int index = index(key);
        for (Entry<K, V> entry = table[index]; entry != null; entry = entry.next) {
            if (key.equals(entry.key)) {
                entry.value = value;
                return;
            }
        }
        table[index] = new Entry<K, V>(key, value, table[index]);
        size++;
        if (size > (int) (table.length * LOAD)) {
            resize();
        }
    }

    List<K> keys() {
        List<K> keys = new ArrayList<K>();
        for (Entry<K, V> head : table) {
            for (Entry<K, V> entry = head; entry != null; entry = entry.next) {
                keys.add(entry.key);
            }
        }
        return keys;
    }

    V remove(K key) {
        if (key == null) {
            return null;
        }
        int index = index(key);
        Entry<K, V> previous = null;
        for (Entry<K, V> entry = table[index]; entry != null; previous = entry, entry = entry.next) {
            if (key.equals(entry.key)) {
                if (previous == null) {
                    table[index] = entry.next;
                } else {
                    previous.next = entry.next;
                }
                size--;
                return entry.value;
            }
        }
        return null;
    }

    private Entry<K, V> find(K key) {
        if (key == null) {
            return null;
        }
        for (Entry<K, V> entry = table[index(key)]; entry != null; entry = entry.next) {
            if (key.equals(entry.key)) {
                return entry;
            }
        }
        return null;
    }

    private int index(K key) {
        return (key.hashCode() & 0x7fffffff) % table.length;
    }

    @SuppressWarnings("unchecked")
    private void resize() {
        Entry<K, V>[] old = table;
        table = (Entry<K, V>[]) new Entry<?, ?>[old.length << 1];
        size = 0;
        for (Entry<K, V> head : old) {
            for (Entry<K, V> entry = head; entry != null; entry = entry.next) {
                put(entry.key, entry.value);
            }
        }
    }
}
