package com.medico.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MlInteractionRequest {
    private List<String> medications;
}
