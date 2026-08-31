package com.aepttas.shield.db;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

import java.util.Date;
import java.util.UUID;

@Entity(tableName = "apt_callers_b", indices = {@Index(value = {"phone_number"}, unique = true)})
public class CallerEntity {
    
    @PrimaryKey
    @NonNull
    @ColumnInfo(name = "id")
    public UUID id;

    @NonNull
    @ColumnInfo(name = "phone_number")
    public String phoneNumber;

    @ColumnInfo(name = "caller_name")
    public String callerName;

    @ColumnInfo(name = "carrier")
    public String carrier;

    @ColumnInfo(name = "location")
    public String location;

    @ColumnInfo(name = "risk_score")
    public int riskScore;

    @ColumnInfo(name = "reputation_score")
    public int reputationScore;

    @ColumnInfo(name = "total_reports")
    public int totalReports;

    @ColumnInfo(name = "call_frequency")
    public int callFrequency;

    @ColumnInfo(name = "avg_duration")
    public int avgDuration;

    @ColumnInfo(name = "answered_calls")
    public int answeredCalls;

    @ColumnInfo(name = "total_calls")
    public int totalCalls;

    @ColumnInfo(name = "safe_reports")
    public int safeReports;

    @ColumnInfo(name = "last_report_date")
    public Date lastReportDate;

    @ColumnInfo(name = "previous_risk_score")
    public int previousRiskScore;

    @ColumnInfo(name = "risk_trend")
    public float riskTrend;

    @ColumnInfo(name = "is_spam")
    public boolean isSpam;

    @ColumnInfo(name = "is_blocked")
    public boolean isBlocked;

    @ColumnInfo(name = "created_at")
    public Date createdAt;

    @ColumnInfo(name = "updated_at")
    public Date updatedAt;

    public CallerEntity() {
        this.id = UUID.randomUUID();
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.reputationScore = 50;
    }
}