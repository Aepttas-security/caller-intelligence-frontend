package com.aepttas.shield.helpers;

import android.content.Context;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.aepttas.shield.db.CallerEntity;
import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber;

import java.util.Calendar;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CustomMethods {

    private static final String TAG = "CustomMethods";

    // Clean phone number for comparison
    public static String cleanPhoneNumber(String phoneNumber) {
        if (phoneNumber == null) return "";
        String cleaned = phoneNumber.replaceAll("[^0-9+]", "");
        return cleaned;
    }

    // Check if two numbers match
    public static boolean numbersMatch(String num1, String num2) {
        if (num1 == null || num2 == null) return false;
        
        String clean1 = cleanPhoneNumber(num1);
        String clean2 = cleanPhoneNumber(num2);
        
        if (clean1.equals(clean2)) return true;
        
        if (clean1.length() >= 10 && clean2.length() >= 10) {
            String last10_1 = clean1.substring(clean1.length() - 10);
            String last10_2 = clean2.substring(clean2.length() - 10);
            if (last10_1.equals(last10_2)) return true;
        }
        
        if (clean1.length() > clean2.length() && clean1.endsWith(clean2)) return true;
        if (clean2.length() > clean1.length() && clean2.endsWith(clean1)) return true;
        
        return false;
    }

    public static boolean isValidPhoneNumber(String phoneNumber) {
        if (phoneNumber == null) return false;
        String nationalNumber = phoneNumber.replaceAll("\\D", "");
        return nationalNumber.matches("\\d{7,13}");
    }

    public static String getDeviceId(Context context) {
        return Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
    }

    public static boolean isDeclaredTelemarketingNumber(String rawNumber) {
        if (rawNumber == null) return false;
        String cleaned = rawNumber.replaceAll("[\\s\\-()]", "");
        return cleaned.matches("^(\\+91)?0?140\\d{7,8}$");
    }

    public static boolean isServiceCall(String rawNumber) {
        if (rawNumber == null) return false;
        String cleaned = rawNumber.replaceAll("[\\s\\-()]", "");
        return cleaned.matches("^(\\+91)?0?160\\d{7,8}$");
    }

    public static boolean hasRepeatingPatterns(String phoneNumber) {
        if (phoneNumber == null) return false;
        String digits = phoneNumber.replaceAll("\\D", "");
        if (digits.length() < 6) return false;
        
        if (digits.matches(".*(\\d)\\1{3,}.*")) return true;
        if (digits.matches(".*(\\d{2})\\1{2,}.*")) return true;
        
        return false;
    }

    public static boolean hasSequentialPatterns(String phoneNumber) {
        if (phoneNumber == null) return false;
        String digits = phoneNumber.replaceAll("\\D", "");
        if (digits.length() < 5) return false;

        String sequential = "01234567890 9876543210";
        for (int i = 0; i <= digits.length() - 5; i++) {
            if (sequential.contains(digits.substring(i, i + 5))) return true;
        }
        return false;
    }

    public static boolean isOffHoursCall() {
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        return (hour >= 22 || hour < 6);
    }

    public static int getCountryRiskWeight(String phoneNumber) {
        if (phoneNumber == null) return 0;
        
        if (phoneNumber.startsWith("+41")) return 40;
        if (phoneNumber.startsWith("+234")) return 45;
        if (phoneNumber.startsWith("+92")) return 40;
        if (phoneNumber.startsWith("+86")) return 35;
        if (phoneNumber.startsWith("+55")) return 30;
        
        if (phoneNumber.startsWith("+") && !phoneNumber.startsWith("+91")) return 15;
        
        return 0;
    }

    public static int calculateAdvancedRiskScore(CallerEntity caller) {
        if (caller == null) return 50;
        
        // 🛡️ FULL CHECK: Advanced Weighted Risk Score Formula (Prompt 5)
        // risk_score = (total_reports * 0.30) + (call_frequency * 0.25) + (avg_duration_risk * 0.15) 
        // + (pickup_rate_score * 0.15) + (feedback_ratio_score * 0.10) + (recency_weight * 0.05)

        // 1. Total Reports Score (0.30)
        float reportsScore = Math.min(caller.totalReports * 10, 100);
        
        // 2. Call Frequency Score (0.25)
        float frequencyScore = Math.min(caller.callFrequency * 5, 100);
        
        // 3. Duration Risk (0.15)
        float durationRisk = 0;
        if (caller.avgDuration > 0) {
            if (caller.avgDuration < 10) durationRisk = 100;
            else if (caller.avgDuration > 3600) durationRisk = 80;
            else if (caller.avgDuration > 30 && caller.avgDuration < 600) durationRisk = 0;
            else durationRisk = 30;
        }

        // 4. Pickup Rate Score (0.15)
        float pickupRate = 1.0f;
        if (caller.totalCalls > 0) {
            pickupRate = (float) caller.answeredCalls / caller.totalCalls;
        }
        float pickupScore = (1.0f - pickupRate) * 100;

        // 5. Feedback Ratio Score (0.10)
        float feedbackRatio = 0.5f;
        int totalFeedback = caller.totalReports + caller.safeReports;
        if (totalFeedback > 0) {
            feedbackRatio = (float) caller.totalReports / totalFeedback;
        }
        float feedbackScore = feedbackRatio * 100;

        // 6. Recency Weight (0.05)
        float recencyWeight = 0;
        if (caller.lastReportDate != null) {
            long diff = System.currentTimeMillis() - caller.lastReportDate.getTime();
            long days = diff / (24 * 60 * 60 * 1000);
            if (days <= 7) recencyWeight = 100;
            else if (days <= 30) recencyWeight = 70;
            else if (days <= 90) recencyWeight = 40;
            else recencyWeight = 20;
        }

        float finalScore = (reportsScore * 0.30f) + 
                          (frequencyScore * 0.25f) + 
                          (durationRisk * 0.15f) + 
                          (pickupScore * 0.15f) + 
                          (feedbackScore * 0.10f) + 
                          (recencyWeight * 0.05f);

        return Math.min((int) finalScore, 100);
    }

    // Compatibility method for stateless lookups (e.g., CallScreening)
    public static int computeAdvancedRiskScore(String phoneNumber, boolean isInContacts, int reportCount) {
        if (isInContacts) return 0;
        int score = reportCount * 5;
        if (isDeclaredTelemarketingNumber(phoneNumber)) score += 40;
        if (hasRepeatingPatterns(phoneNumber)) score += 20;
        return Math.min(score, 100);
    }

    public static String getDetectionReason(String phoneNumber, int score) {
        if (score <= 20) return "Safe Caller";
        
        if (isDeclaredTelemarketingNumber(phoneNumber)) return "Verified Telemarketer (140)";
        if (phoneNumber != null && (phoneNumber.startsWith("+41") || phoneNumber.startsWith("+234"))) return "High-Risk International Code";
        if (hasRepeatingPatterns(phoneNumber)) return "Suspicious Number Pattern";
        if (hasSequentialPatterns(phoneNumber)) return "Auto-Generated Number Pattern";
        if (isOffHoursCall()) return "Unusual Calling Hours";
        
        if (score > 60) return "High Likelihood of Spam";
        return "Unknown / Potential Spam";
    }

    public static String getThreatLevel(int score) {
        if (score < 25) return "Safe";
        if (score < 50) return "Low";
        if (score < 75) return "Medium";
        if (score < 90) return "High";
        return "Critical";
    }
}