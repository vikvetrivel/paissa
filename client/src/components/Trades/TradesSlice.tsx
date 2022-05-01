import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { iTrades } from "./iTrades";

export interface TradesState {
    trades: iTrades[];
    selectedTrade: string;
    underlyingChanged: boolean;
}

const initialState: TradesState = {
    trades: [],
    selectedTrade: "",
    underlyingChanged: false,
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

        setUnderlyingChanged: (state, action: PayloadAction<boolean>) => {
            state.underlyingChanged = action.payload;
        },
    },
});

// Action creators are generated for each case reducer function
export const { setTrades, setSelectedTrade, setUnderlyingChanged } =
    TradesSlice.actions;

export default TradesSlice.reducer;
