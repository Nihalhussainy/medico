package com.medico.backend.service;

import java.io.IOException;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    StorageResult store(MultipartFile file) throws IOException;
}
