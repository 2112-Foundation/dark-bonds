import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type InitialState = {
  value: BondDisplayState;
};

type BondDisplayState = {
  isOpen: boolean;
  bondId: string;
};

const initialState = {
  value: { isOpen: false, bondId: "" } as BondDisplayState,
} as InitialState;

export const displayBond = createSlice({
  name: "displayBond",
  initialState,
  reducers: {
    showBond: (_, action: PayloadAction<string>) => {
      return { value: { isOpen: true, bondId: action.payload } };
    },
    hideBond: () => {
      return initialState;
    },
  },
});

export const { showBond, hideBond } = displayBond.actions;
export default displayBond.reducer;
