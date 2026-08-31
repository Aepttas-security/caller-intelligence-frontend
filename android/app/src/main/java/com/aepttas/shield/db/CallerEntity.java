package com.aepttas.shield.db;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "apt_callers_b")
public class CallerEntity {
    
    @PrimaryKey
    @NonNull
    @ColumnInfo(name = "phone_number")
    public String phoneNumber;

    @ColumnInfo(name = "caller_name")
    public String callerName;

    @ColumnInfo(name = "risk_score")
    public int riskScore;

    @ColumnInfo(name = "reputation_score")
    public int reputationScore;

    @ColumnInfo(name = "total_reports")
    public int totalReports;

    @ColumnInfo(name = "call_frequency")
    public int callFrequency;

    @ColumnInfo(name = "is_spam")
    public boolean isSpam;

    @ColumnInfo(name = "is_blocked")
    public boolean isBlocked;

    @ColumnInfo(name = "carrier")
    public String carrier;

    @ColumnInfo(name = "location")
    public String location;

    @ColumnInfo(name = "aliases")
    public String aliases; // Store as JSON string

    @ColumnInfo(name = "last_updated")
    public long lastUpdated;

    public CallerEntity() {}

    public CallerEntity(@NonNull String phoneNumber, String callerName) {
        this.phoneNumber = phoneNumber;
        this.callerName = callerName;
        this.reputationScore = 50;
        this.totalReports = 1;
        this.lastUpdated = System.currentTimeMillis();
    }
}