package com.medico.backend.controller;

import com.medico.backend.dto.UserResponse;
import com.medico.backend.entity.User;
import com.medico.backend.service.AuthService;
import com.medico.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(authService.buildUserResponse(user));
    }
}
