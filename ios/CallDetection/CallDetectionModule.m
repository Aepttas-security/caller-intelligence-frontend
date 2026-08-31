// ios/CallDetection/CallDetectionModule.m
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(CallDetectionModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startDetection)
RCT_EXTERN_METHOD(stopDetection)
RCT_EXTERN_METHOD(setDirectoryData:(NSArray *)blocked
                  labels:(NSDictionary *)labels
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
