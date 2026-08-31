// ios/CallDetection/CallDetectionModule.swift
import Foundation
import React
import CallKit
import AVFoundation

@objc(CallDetectionModule)
class CallDetectionModule: RCTEventEmitter {
    private var hasListeners = false
    private var callObserver: CXCallObserver?
    private let appGroup = "group.com.aepttas.shield"

    // Tracking for duration parity with Android
    private var callConnectTime: Date?
    private var callAnswered = false

    override init() {
        super.init()
        setupCallObserver()
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    private func setupCallObserver() {
        callObserver = CXCallObserver()
        callObserver?.setDelegate(self, queue: nil)
    }
    
    @objc
    override func supportedEvents() -> [String]! {
        return ["onCallDetected", "onDetectionStatus", "onCallStateChanged"]
    }

    @objc
    func setDirectoryData(_ blocked: [String], labels: [String: String], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let sharedDefaults = UserDefaults(suiteName: appGroup) else {
            reject("E_SHARED_STORAGE", "Could not access App Group shared storage", nil)
            return
        }

        let cleanedBlocked = blocked.map { $0.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression) }
                                   .compactMap { Int64($0) }
                                   .sorted()

        var cleanedLabels: [String: String] = [:]
        for (number, label) in labels {
            let digits = number.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
            if let _ = Int64(digits) {
                cleanedLabels[digits] = label
            }
        }

        sharedDefaults.set(cleanedBlocked, forKey: "blockedNumbers")
        sharedDefaults.set(cleanedLabels, forKey: "labelNumbers")
        sharedDefaults.synchronize()

        CXCallDirectoryManager.sharedInstance.reloadExtension(withIdentifier: "com.aepttas.shield.ShieldCallDirectory") { error in
            if let error = error {
                reject("E_RELOAD_FAILED", error.localizedDescription, error)
            } else {
                resolve(true)
            }
        }
    }
    
    @objc
    func startDetection() {
        hasListeners = true
        sendEvent(withName: "onDetectionStatus", body: ["status": "started"])
    }
    
    @objc
    func stopDetection() {
        hasListeners = false
        sendEvent(withName: "onDetectionStatus", body: ["status": "stopped"])
    }
    
    override func startObserving() {
        hasListeners = true
    }
    
    override func stopObserving() {
        hasListeners = false
    }
}

extension CallDetectionModule: CXCallObserverDelegate {
    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        if !hasListeners { return }

        let state: String
        var duration: Double = 0

        if call.hasConnected {
            if callConnectTime == nil {
                callConnectTime = Date()
                callAnswered = true
            }
            state = "OFFHOOK"
        } else if call.hasEnded {
            state = "IDLE"
            if let connectTime = callConnectTime {
                duration = Date().timeIntervalSince(connectTime)
            }
        } else if call.isOutgoing {
            state = "OUTGOING"
        } else {
            state = "INCOMING"
            callConnectTime = nil
            callAnswered = false
        }

        // ✅ Parity with Android: Send duration and answered flag
        sendEvent(withName: "onCallStateChanged", body: [
            "type": state,
            "phoneNumber": "", // Hidden on iOS
            "duration": duration,
            "answered": callAnswered
        ])

        // Reset tracking on idle
        if call.hasEnded {
            callConnectTime = nil
            callAnswered = false
        }
    }
}
