package com.medico.backend.service;

public class StorageResult {

    private final String url;
    private final String storageKey;

    public StorageResult(String url, String storageKey) {
        this.url = url;
        this.storageKey = storageKey;
    }

    public String getUrl() {
        return url;
    }

    public String getStorageKey() {
        return storageKey;
    }
}
