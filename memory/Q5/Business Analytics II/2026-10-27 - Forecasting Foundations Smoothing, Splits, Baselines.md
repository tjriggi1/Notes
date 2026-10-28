# Digest: Forecasting Foundations: Smoothing, Splits, Baselines

*Business Analytics II · 2026-10-27 · source: `classes/Q5/Business Analytics II/2026-10-27 - Forecasting Foundations Smoothing, Splits, Baselines.md`*

## Summary
Every time series is trend + season + noise, and smoothing (averaging each point with neighbors) strips noise and season to show the trend, but it describes the past only and cannot forecast. To test forecasts fairly, never shuffle time: use a time split, and backtest by walking forward through several plan dates and averaging the error. The class then compared four baselines (naive, simple MA, weighted MA, seasonal naive), each with a strength and a weakness.

## Key concepts

### Smoothing shows the trend
- Every series is trend + season + noise; find each part before forecasting, because a method that misses one will miss in a predictable way.
- Smoothing averages each point with neighbors from both sides, so the noise cancels.
- A wider window gives a smoother line; at 13 months the season disappears and only the trend is left.
- Smoothing describes the past only: the right-hand neighbors do not exist yet, so a centered smooth cannot forecast.
- Monthly sales graph (a sketch, not real data): the 5-month centered average follows the data closely but is smoother; the 13-month average is much smoother and rises slowly. Both averaged lines stop before the end of the sales line.

### Never shuffle time
- Random split (wrong): test weeks sit between training weeks, so the model sees the week after each test week. The score looks great and means nothing.
- Time split (right): train on everything up to a date, test on the weeks after. This is what the business faces on the day it plans.

### Backtest by walking forward
- Stand at a past plan date, forecast the next stretch, score it, step forward, repeat. Average the error across windows.
- Slide: three windows, each with training blocks then four test blocks; the plan date moves forward so training grows and the test section moves later.

### Four baselines
- Naive: fine when the series barely moves; lags every turn.
- Simple MA (K): smooths noise; flat line, so it cannot see a season coming.
- Weighted MA: reacts faster than the simple MA; still a flat line.
- Seasonal naive: catches the season; copies last year's noise and cannot see growth.
- Window k is a dial (weekly sales step up around week 20): k = 2 reacts quickly but follows every bump of noise; k = 12 is smooth but takes many weeks to catch the new level. Same trade-off as k in KNN; choose k on a time-ordered test.
- Weighted MA worked example (last 4 weeks, £k: 120, 110, 100, 90, from 1 to 4 weeks ago): simple MA weights 25% each, average 105; weighted MA weights 40/30/20/10% (scaled from 4-3-2-1), average 110. Weighted catches up faster when sales climb but also reacts faster to a noisy week, so test the weights like k.

## Key terms
(Definitions the notes give as class content; items the note labels "added, not from class" are listed under Background.)
- **Trend**: the long drift of a series, such as steady growth.
- **Season**: a pattern that repeats on the calendar.
- **Noise**: what is left after trend and season are removed.
- **Smoothing**: averaging each point with its neighbors so noise cancels; describes the past only.
- **Window**: number of neighboring points in each average; wider = smoother.
- **Random split / Time split**: as above.
- **Backtest (walk-forward)**: as above.
- **Naive, Simple MA (k), Weighted MA, Seasonal naive**: as above.
- **k (window size)**: small = fast but chases noise; large = smooth but slow.

## Unclear or missing
- The 5-month vs 13-month graph and the k = 2 / k = 12 graph are sketches, not real data; no actual values are given.
- How error is measured when scoring each window (e.g. which error metric) is not stated.
- How many weeks/windows or what window length to use in a backtest is not stated.
- How to choose weighted-MA weights beyond "test them" is not stated.
- Seasonal naive's "same week last year" is stated, but how it handles a series shorter than a year is not.
- The note says a 13-month smooth removes the season but does not explain why in class terms (the explanation is added context).

## Questions worth reviewing
1. Why does averaging a point with neighbors on both sides reveal the trend, and why can't this method forecast?
2. What happens to a 13-month smooth of monthly data, and why?
3. Why does a random split give a misleading score, and how does a time split fix it?
4. Describe the steps of a walk-forward backtest and how the final error is calculated.
5. For each of the four baselines, state its strength and weakness. How does k affect the simple MA?
6. In the worked example, why is the weighted average (110) higher than the simple average (105), and what is the downside?

## Background (not from notes)
These points appear in the note only as "added context, not from class".
- A centered moving average needs data on both sides, so it can be computed only for the middle of a series, not the most recent periods.
- A 13-month window on monthly data covers a full year, so every calendar month appears once and the seasonal pattern cancels.
- Letting a model see future information is called data leakage; random splits are fine for many non-time-series problems but fail here because neighboring weeks are closely related.
- Walk-forward backtesting is also called rolling-origin evaluation; it repeats the time split so one lucky or unlucky test period does not decide the result.
- A baseline is a simple benchmark that a more complex model should beat; KNN predicts from the k most similar past examples.
