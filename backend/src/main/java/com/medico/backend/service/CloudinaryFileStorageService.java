package com.medico.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@ConditionalOnProperty(value = "app.storage.type", havingValue = "CLOUDINARY")
public class CloudinaryFileStorageService implements FileStorageService {

    private final Cloudinary cloudinary;

    public CloudinaryFileStorageService(
        @Value("${cloudinary.cloud-name}") String cloudName,
        @Value("${cloudinary.api-key}") String apiKey,
        @Value("${cloudinary.api-secret}") String apiSecret
    ) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret,
            "secure", true
        ));
    }

    @Override
    public StorageResult store(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String publicId = "medico/" + UUID.randomUUID();
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        String resourceType = contentType.startsWith("image/") ? "image" : "raw";

        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "public_id", publicId,
                "resource_type", resourceType,
                "type", "upload",
                "access_mode", "public",
                "filename_override", original,
                "use_filename", false,
                "overwrite", true
            )
        );

        String url = String.valueOf(uploadResult.get("secure_url"));
        String storageKey = String.valueOf(uploadResult.get("public_id"));
        return new StorageResult(url, storageKey);
    }
}
