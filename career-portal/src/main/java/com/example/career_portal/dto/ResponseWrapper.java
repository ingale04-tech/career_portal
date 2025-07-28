package com.example.career_portal.dto;

import java.util.Map;

public class ResponseWrapper<T> {
    private boolean success;
    private String message;
    private T data;
    private Object errors;

    // Constructor for success response
    public ResponseWrapper(String message, T data) {
        this.success = true;
        this.message = message;
        this.data = data;
        this.errors = null;
    }

    // Constructor for error response with message only
    public ResponseWrapper(String errorMessage) {
        this.success = false;
        this.message = errorMessage;
        this.data = null;
        this.errors = Map.of("error", errorMessage);
    }

    // Getters and setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public Object getErrors() {
        return errors;
    }

    public void setErrors(Object errors) {
        this.errors = errors;
    }
}