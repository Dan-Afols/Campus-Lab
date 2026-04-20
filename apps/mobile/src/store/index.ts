import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

type SessionState = {
  accessToken: string | null;
  fullName: string;
};

const initialState: SessionState = { accessToken: null, fullName: "Student" };

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<SessionState>) {
      state.accessToken = action.payload.accessToken;
      state.fullName = action.payload.fullName;
    },
    clearSession(state) {
      state.accessToken = null;
      state.fullName = "Student";
    }
  }
});

export const { setSession, clearSession } = sessionSlice.actions;

export const store = configureStore({
  reducer: {
    session: sessionSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
