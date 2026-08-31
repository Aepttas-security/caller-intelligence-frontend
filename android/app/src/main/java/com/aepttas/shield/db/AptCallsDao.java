package com.aepttas.shield.db;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;

import java.util.List;

@Dao
public interface AptCallsDao {
    @Insert
    void insert(AptCallsEntity call);

    @Query("SELECT * FROM apt_calls_b ORDER BY call_timestamp DESC")
    List<AptCallsEntity> getAllHistory();

    @Query("SELECT * FROM apt_calls_b WHERE is_synced = 0")
    List<AptCallsEntity> getUnsyncedHistory();

    @Query("UPDATE apt_calls_b SET is_synced = 1 WHERE call_uuid = :uuid")
    void markAsSynced(java.util.UUID uuid);

    @Query("DELETE FROM apt_calls_b")
    void deleteAll();
}