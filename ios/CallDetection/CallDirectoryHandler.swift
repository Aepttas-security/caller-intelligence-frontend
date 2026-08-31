// ios/CallDetection/CallDirectoryHandler.swift
import Foundation
import CallKit

class CallDirectoryHandler: CXCallDirectoryProvider {

    private let appGroup = "group.com.aepttas.shield"

    override func beginRequest(with context: CXCallDirectoryExtensionContext) {
        context.delegate = self

        // 1. Add Blocked Numbers
        if !addAllBlockingPhoneNumbers(to: context) {
            let error = NSError(domain: "CallDirectoryHandler", code: 1, userInfo: nil)
            context.cancelRequest(withError: error)
            return
        }

        // 2. Add Identification Labels (Caller ID)
        if !addAllIdentificationPhoneNumbers(to: context) {
            let error = NSError(domain: "CallDirectoryHandler", code: 2, userInfo: nil)
            context.cancelRequest(withError: error)
            return
        }

        context.completeRequest()
    }

    private func addAllBlockingPhoneNumbers(to context: CXCallDirectoryExtensionContext) -> Bool {
        guard let sharedDefaults = UserDefaults(suiteName: appGroup),
              let blockedNumbers = sharedDefaults.array(forKey: "blockedNumbers") as? [Int64] else {
            return true // No numbers to block
        }

        for number in blockedNumbers {
            context.addBlockingEntry(withNextSequentialPhoneNumber: number)
        }

        return true
    }

    private func addAllIdentificationPhoneNumbers(to context: CXCallDirectoryExtensionContext) -> Bool {
        guard let sharedDefaults = UserDefaults(suiteName: appGroup),
              let labels = sharedDefaults.dictionary(forKey: "labelNumbers") as? [String: String] else {
            return true // No labels to show
        }

        // iOS requires numbers to be added in strictly increasing order
        let sortedNumbers = labels.keys.compactMap { Int64($0) }.sorted()

        for number in sortedNumbers {
            if let label = labels[String(number)] {
                context.addIdentificationEntry(withNextSequentialPhoneNumber: number, label: "🛡️ \(label)")
            }
        }

        return true
    }
}

extension CallDirectoryHandler: CXCallDirectoryExtensionContextDelegate {
    func requestFailed(for extensionContext: CXCallDirectoryExtensionContext, withError error: Error) {
        print("❌ Call Directory Extension request failed: \(error.localizedDescription)")
    }
}
