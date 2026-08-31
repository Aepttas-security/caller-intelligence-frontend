import { configureStore } from '@reduxjs/toolkit';
import callDetectionSlice from '../modules/callDetection/store/callDetectionSlice';

export const store = configureStore({
  reducer: {
    callDetection: callDetectionSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;