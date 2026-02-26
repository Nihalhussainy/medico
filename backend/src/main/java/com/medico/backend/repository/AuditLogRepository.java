package com.medico.backend.repository;

import com.medico.backend.entity.AuditLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
	List<AuditLog> findAllByOrderByCreatedAtDesc();
	List<AuditLog> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds);
}
