# Implementation Guide: Building a Truecaller-like Intelligence System

This guide outlines the technical steps to implement the five core data-gathering and processing techniques used by apps like Truecaller within your **Aepttas Shield** project.

---

## 1. Contact List Syncing (The Network Effect)

To build a reverse-lookup database, you must securely aggregate how users name their contacts.

### Android Implementation (Background Sync)
Use `WorkManager` and `ContactsContract` to extract and batch-upload contact mapping.

#### `ContactSyncWorker.java` (Logic)
```java
public class ContactSyncWorker extends Worker {
    public Result doWork() {
        ContentResolver resolver = getApplicationContext().getContentResolver();
        Cursor cursor = resolver.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            new String[]{Phone.DISPLAY_NAME, Phone.NUMBER}, null, null, null);

        JSONArray contactList = new JSONArray();
        while (cursor.moveToNext()) {
            JSONObject contact = new JSONObject();
            contact.put("name", cursor.getString(0));
            contact.put("phone", sanitize(cursor.getString(1)));
            contactList.put(contact);
        }
        cursor.close();

        // Upload to: Config.BACKEND_URL + "/api/sync/contacts"
        return uploadBatch(contactList);
    }
}
```

### Backend Implementation
*   **Database:** Use a many-to-one mapping (`phone_number` -> `list of names`).
*   **Ranking:** The most frequent name assigned to a number becomes the "Primary Display Name."

---

## 2. Scraping & External Data Indexing

This is primarily a server-side task to supplement user-generated data.

### Workflow
1.  **Crawlers:** Build scrapers for public business directories (Yellow Pages, Google Maps API).
2.  **Normalization:** Clean data into E.164 format.
3.  **Priority:** Public business data should override user-provided contact names to prevent "trolling" names for businesses.

---

## 3. Social Identity Integration

Cross-referencing phone numbers with social profiles increases identity confidence.

### Integration Steps
*   **Google Sign-In:** Request `profile` and `email` scopes. Map the user's verified name to their SIM phone number.
*   **Avatar Sync:** Use the Google/Microsoft profile picture URL as the default caller ID image if no local contact exists.

---

## 4. Aggregated Spam Reporting

Community-driven moderation is the heart of spam protection.

### Implementation in `PopupService.java`
Add a "Report Spam" button that sends a POST request to your backend.

```java
private void reportSpam(String phoneNumber, String category) {
    // API: POST /api/spam/report
    // Body: { "number": "...", "category": "Telemarketer", "reporter_uid": "..." }
    Toast.makeText(this, "Spam Reported. Thank you!", Toast.LENGTH_SHORT).show();
}
```

### Risk Engine Logic
*   **Threshold:** A number is flagged as "Spam" only after `N` reports from unique users within `T` time.
*   **Tags:** Allow users to tag as "Fraud," "Political," or "Debt Collection."

---

## 5. Regional Privacy & GDPR Compliance

Handling data differently based on the user's jurisdiction is a legal requirement.

### Compliance Strategy
1.  **Geo-Fencing:** Check the SIM Card MCC (Mobile Country Code) or IP address on signup.
2.  **Conditional Execution:**
    ```java
    if (UserLocation.isInEU()) {
        // DO NOT upload contacts.
        // Perform lookups ONLY using the local database or anonymized hashes.
        Config.CONTACT_SYNC_ENABLED = false;
    }
    ```
3.  **Data Deletion:** Provide an "Unlist my number" web portal to comply with Right to be Forgotten.

---

## Next Steps for Aepttas Shield
1.  **Implement `ContactSyncHelper`**: To handle the background extraction.
2.  **Update `PopupService`**: To include UI for reporting spam.
3.  **Backend Expansion**: Create the `/api/sync/contacts` and `/api/spam/report` endpoints.
