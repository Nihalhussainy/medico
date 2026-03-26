package com.medico.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@ConditionalOnProperty(value = "app.storage.type", havingValue = "LOCAL", matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService {

    private final Path uploadPath;
    private final String baseUrl;

    public LocalFileStorageService(
        @Value("${app.upload.dir}") String uploadDir,
        @Value("${app.base-url}") String baseUrl
    ) {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath();
        this.baseUrl = baseUrl;
    }

    @Override
    public StorageResult store(MultipartFile file) throws IOException {
        Files.createDirectories(uploadPath);
        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String extension = "";
        int dotIndex = original.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = original.substring(dotIndex);
        }
        String storageKey = UUID.randomUUID() + extension;
        Path target = uploadPath.resolve(storageKey);
        Files.write(target, file.getBytes());
        String url = baseUrl + "/files/" + storageKey;
        return new StorageResult(url, storageKey);
    }
}
