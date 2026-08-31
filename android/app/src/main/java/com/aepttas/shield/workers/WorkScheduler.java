package com.aepttas.shield.workers;

import android.content.Context;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;

public class WorkScheduler {
    public static void schedulePeriodicTasks(Context context) {
        WorkManager workManager = WorkManager.getInstance(context);

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build();

        // 1. Sync Task - Every 4 hours
        PeriodicWorkRequest syncRequest = new PeriodicWorkRequest.Builder(SyncWorker.class, 4, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build();
        workManager.enqueueUniquePeriodicWork("ShieldSync", ExistingPeriodicWorkPolicy.KEEP, syncRequest);

        // 2. Auto-Block Audit - Every 4 hours
        PeriodicWorkRequest blockRequest = new PeriodicWorkRequest.Builder(AutoBlockWorker.class, 4, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build();
        workManager.enqueueUniquePeriodicWork("ShieldAutoBlock", ExistingPeriodicWorkPolicy.KEEP, blockRequest);

        // 3. Risk Score Update - Every 1 hour
        PeriodicWorkRequest riskRequest = new PeriodicWorkRequest.Builder(RiskScoreWorker.class, 1, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build();
        workManager.enqueueUniquePeriodicWork("ShieldRiskScore", ExistingPeriodicWorkPolicy.KEEP, riskRequest);
    }
}