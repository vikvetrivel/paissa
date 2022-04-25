import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { iTrades } from "./iTrades";

export interface TradesState {
    trades: iTrades[];
    selectedTrade: string;
}

const initialState: TradesState = {
    trades: [],
    selectedTrade: "",
};

export const TradesSlice = createSlice({
    name: "trades",
    initialState,
    reducers: {
        setTrades: (state, action: PayloadAction<iTrades[]>) => {
            state.trades = action.payload;
        },

        setSelectedTrade: (state, action: PayloadAction<string>) => {
            state.selectedTrade = action.payload;
        },
    },
});

// Action creators are generated for each case reducer function
export const { setTrades, setSelectedTrade } = TradesSlice.actions;

export default TradesSlice.reducer;
