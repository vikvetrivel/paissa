import { configureStore } from "@reduxjs/toolkit";
import TradesReducer from "./components/Trades/TradesSlice";

export const store = configureStore({
    reducer: { trades: TradesReducer },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
