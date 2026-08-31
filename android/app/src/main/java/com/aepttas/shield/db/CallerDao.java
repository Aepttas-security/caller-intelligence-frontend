package com.aepttas.shield.db;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface CallerDao {
    @Query("SELECT * FROM apt_callers_b WHERE phone_number = :phoneNumber LIMIT 1")
    CallerEntity getByPhoneNumber(String phoneNumber);

    @Query("SELECT * FROM apt_callers_b WHERE phone_number LIKE '%' || :partialNumber")
    List<CallerEntity> searchByPartialNumber(String partialNumber);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertOrUpdate(CallerEntity caller);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<CallerEntity> callers);

    @Update
    void update(CallerEntity caller);

    @Query("DELETE FROM apt_callers_b")
    void deleteAll();
}