import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  widgets: {
    upcomingReminders: 0,
    adherenceScore: 0,
    medicinesTracked: 0,
    monthlySavings: 0,
  },
  adherenceTrend: [],
  recentSearches: [],
  remindersPreview: [],
  medicinesToday: [],
  cheapestPicks: [],
  todayProgress: {},
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboardData: (state, action) => {
      state.widgets = action.payload.widgets || state.widgets;
      state.adherenceTrend = action.payload.adherenceTrend || state.adherenceTrend;
      state.recentSearches = action.payload.recentSearches || [];
      state.remindersPreview = action.payload.remindersPreview || [];
      state.medicinesToday = action.payload.medicinesToday || [];
      state.cheapestPicks = action.payload.cheapestPicks || [];
      state.todayProgress = action.payload.todayProgress || {};
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    resetDashboard: () => initialState,
  },
});

export const { setDashboardData, setLoading, setError, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
