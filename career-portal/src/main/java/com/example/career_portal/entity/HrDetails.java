package com.example.career_portal.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "hr_details")
@Data
public class HrDetails {
    @Id
    @Column(name = "hr_id")
    private Long hrId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "hr_id")
    private User hr;

    @Column(name = "company_name")
    private String companyName;

    private String designation;

    @Version
    @Column(name = "version", nullable = false)
    private Long version; // Optimistic locking field

    // Constructors
    public HrDetails() {}

    public HrDetails(User hr, String companyName, String designation) {
        this.hr = hr;
        this.hrId = hr != null ? hr.getId() : null;
        this.companyName = companyName;
        this.designation = designation;
    }

    // Override setter for hr to sync hrId
    public void setHr(User hr) {
        this.hr = hr;
        this.hrId = hr != null ? hr.getId() : null;
    }
}