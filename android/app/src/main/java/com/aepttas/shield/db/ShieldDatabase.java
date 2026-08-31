package com.aepttas.shield.db;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

@Database(entities = {CallerEntity.class}, version = 1, exportSchema = false)
public abstract class ShieldDatabase extends RoomDatabase {
    private static volatile ShieldDatabase INSTANCE;

    public abstract CallerDao callerDao();

    public static ShieldDatabase getDatabase(final Context context) {
        if (INSTANCE == null) {
            synchronized (ShieldDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(context.getApplicationContext(),
                                    ShieldDatabase.class, "shield_database")
                            .fallbackToDestructiveMigration()
                            .build();
                }
            }
        }
        return INSTANCE;
    }
}