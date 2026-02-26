package com.medico.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MlRecommendRequest {
    private String disease;
    private int age;
    private String gender;
    private String bloodGroup;
    private List<String> allergies;
    private int topK = 5;
}
