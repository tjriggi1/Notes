# Forecasting Foundations: Smoothing, Splits, Baselines

*Business Analytics II · 2026-10-27*

> This session covered how to separate trend, season and noise using smoothing. It then covered how to test forecasts fairly with time-ordered splits and walk-forward backtests. Finally it compared four simple baseline forecasting methods.

## Smoothing shows the trend

Every time series can be thought of as a trend, a season and noise added together. Smoothing is a way to strip away the noise and the season so the underlying trend is easier to see.

- Smoothing works by averaging each point with its neighbors.
    - The neighbors are taken from both sides of the point, and the noise cancels out in the average.
- A wider window gives a smoother line.
    - A wider window flattens the peaks. At 13 months the season disappears and only the trend is left.
- Smoothing describes the past only.
    - The neighbors on the right do not exist yet, so a centered smooth cannot forecast.

**Every series is trend + season + noise**

![Graph 1](images/2026-10-27%20-%20Forecasting%20Foundations%20Smoothing,%20Splits,%20Baselines%20-%20Graph%201.png)

The slide shows three separate components: a trend that drifts steadily upward, a season that repeats on the calendar, and random noise. Adding them gives the jagged series on the right, which rises over three years with repeating seasonal bumps. The slide marks it as a sketch, not real data. Its message is to find each part before you forecast, because a method that misses one of them will miss in a predictable way. This is the idea that smoothing then exploits.

**Monthly sales with 5-month and 13-month centered averages**

![Graph 2](images/2026-10-27%20-%20Forecasting%20Foundations%20Smoothing,%20Splits,%20Baselines%20-%20Graph%202.png)

The jagged black line is monthly sales over about three years. The dashed 5-month centered average follows the ups and downs of the data fairly closely but is smoother. The green 13-month centered average is much smoother and rises slowly, so the seasonal swings are gone and only the trend remains. This matches the note that a wider window is smoother and that at 13 months the season disappears. Both averaged lines stop before the end of the sales line, which fits the note that smoothing needs neighbors on both sides and so cannot forecast. The slide marks it as a sketch, not real data.

*Added context (not from class):*

> A centered moving average needs data on both sides of each point. That is why it can be computed only for the middle of a series and not for the most recent periods.

> The 13-month window is useful for monthly data because it covers a full year, so each average includes every calendar month once. This is why the seasonal pattern cancels out.

## Never shuffle time

When you test a forecasting model, the order of time must be respected. The split between training data and test data has to follow the calendar.

- Random split (the wrong way)
    - Test weeks sit between training weeks, so the model gets to see the week after each test week.
    - The score looks great and means nothing.
- Time split (the right way)
    - Train on everything up to a date and test on the weeks after it.
    - This is exactly what the business faces on the day it plans.

**Random split**

![Graph 3](images/2026-10-27%20-%20Forecasting%20Foundations%20Smoothing,%20Splits,%20Baselines%20-%20Graph%203.png)

A row of blocks represents weeks in time order. Most are blue (training), and a handful of yellow (test) blocks are scattered among them. Every test week has training weeks on both sides, so the model sees what happens just after each test week. This is the leak described in the notes.

**Time split**

![Graph 4](images/2026-10-27%20-%20Forecasting%20Foundations%20Smoothing,%20Splits,%20Baselines%20-%20Graph%204.png)

The same kind of row of blocks is split cleanly. All the blue training blocks come first, then all the yellow test blocks come at the end. The model trains on the past and is tested on the weeks after, which mirrors the real planning situation.

*Added context (not from class):*

> Letting a model see information from the future is called data leakage. It makes accuracy look better than it will be in real use, because on planning day the future is unknown.

> A random split is fine for many non-time-series problems. It fails here because neighboring weeks are closely related, so a test week is easy to guess from the training weeks on either side of it.

## Backtest by walking forward

- To backtest, stand at a past plan date, forecast the next stretch, score it, then step forward and repeat.
    - Average the error across windows.

**Walk-forward windows**

![Graph 5](images/2026-10-27%20-%20Forecasting%20Foundations%20Smoothing,%20Splits,%20Baselines%20-%20Graph%205.png)

Three rows (Window 1, 2 and 3) each show blue training blocks followed by four yellow test blocks. In each later window the plan date moves forward, so the training section gets longer and the test section moves later in time. The pale blocks to the right are weeks that have not been used yet. The error from each window's test blocks is averaged to give the backtest score.

*Added context (not from class):*

> A backtest repeats the time split several times, so you are not relying on one lucky or unlucky test period. This is often called walk-forward validation or rolling-origin evaluation.

> Each window uses only data available at its plan date, so every test is fair.

## Four baselines

A baseline is a simple forecast that any more complex model must beat. The class covered four of them, each with a particular strength and weakness.

- Naive
    - Fine when the series barely moves.
    - Lags every turn.
- Simple MA (K)
    - Smooths noise.
    - It gives a flat line, so it cannot see a season coming.
- Weighted MA
    - Reacts faster than the simple MA.
    - It is still a flat line.
- Seasonal naive
    - Catches the season.
    - It copies last year's noise and cannot see growth.

**Four baselines side by side**

![Graph 6](images/2026-10-27%20-%20Forecasting%20Foundations%20Smoothing,%20Splits,%20Baselines%20-%20Graph%206.png)

Four panels use the same sales history with a dashed forecast at the end. Naive, simple MA and weighted MA each give a flat dashed line after the last point. The seasonal naive panel instead gives a short dashed line with a shape, because it repeats the pattern from the same weeks last year. The captions match the notes: naive lags every turn, MAs smooth but stay flat, and seasonal naive catches the season but cannot see growth.

**The simple MA's window k is a dial**

![Graph 7](images/2026-10-27%20-%20Forecasting%20Foundations%20Smoothing,%20Splits,%20Baselines%20-%20Graph%207.png)

Weekly sales (a sketch, not real data) step up around week 20. The green k = 2 line reacts quickly after the step but also follows every bump of noise. The dashed k = 12 line is much smoother but takes many weeks to catch up to the new level. The slide's points are that a small k reacts fast and chases noise, and a large k is smooth but slow to notice change. It also says this is the same trade-off as k in KNN, and that you choose k on a time-ordered test.

**Weighted MA: you set the weights**

![Graph 8](images/2026-10-27%20-%20Forecasting%20Foundations%20Smoothing,%20Splits,%20Baselines%20-%20Graph%208.png)

A table shows sales for the last four weeks: 120, 110, 100 and 90 (£k), from 1 to 4 weeks ago. The simple MA gives each week a 25% weight. The weighted MA gives 40%, 30%, 20% and 10%, scaled from 4-3-2-1 to add to 100%. The simple average is 105 and the weighted average is 110. Because sales are climbing, the simple average lags behind, and leaning on recent weeks catches up faster. The catch is that it also reacts faster to a noisy week, so the weights must be tested like k.

**Chart: Simple vs weighted MA weights**

Weights from the slide's worked example. Both sets add to 100%, but the weighted MA puts more weight on recent weeks.

| How long ago | Simple MA weight | Weighted MA weight |
|---|---|---|
| 1 week ago | 25 | 40 |
| 2 weeks ago | 25 | 30 |
| 3 weeks ago | 25 | 20 |
| 4 weeks ago | 25 | 10 |

*Added context (not from class):*

> Naive forecast: next week equals last week. Simple MA: the next value is the equal-weight average of the last k weeks. Weighted MA: the next value is the average of the last k weeks, with recent weeks counting more. Seasonal naive: next value equals the same week last year.

> On the slide, the simple MA's window k works like a dial. A small k reacts fast but chases every bump of noise. A large k is smooth but takes weeks to notice that sales have changed. This is the same trade-off as k in KNN, where few neighbors memorize and many neighbors blur. You choose k with a time-ordered test.

> In the weighted example, the weights 4-3-2-1 are scaled to add to 100%, giving 40%, 30%, 20% and 10%. The simple average of 120, 110, 100 and 90 is 105, and the weighted average is 110. Leaning on recent weeks helps catch up when sales are climbing, but it also reacts faster to a noisy week. The weights are a choice you test, not a choice you assume.

## Key terms

- **Trend**: The long drift of a series, such as steady growth over time.
- **Season**: A pattern that repeats on the calendar.
- **Noise**: What is left over after the trend and season are removed.
- **Smoothing**: Averaging each point with its neighbors so that noise cancels out and the trend shows. It describes the past only and cannot forecast.
- **Window**: The number of neighboring points included in each average. A wider window gives a smoother line. At 13 months the season disappears.
- **Centered moving average**: A moving average that uses the same number of neighbors on each side of a point. It cannot be computed for the latest periods because the right-hand neighbors do not exist yet. *(added, not from class)*
- **Random split**: A split that scatters test weeks among training weeks. The model sees the week after each test week, so the score looks great and means nothing.
- **Time split**: Training on everything up to a date and testing on the weeks after it. This is exactly what the business faces on the day it plans.
- **Data leakage**: When information from the future (or from the test data) gets into model training. It makes performance look better than it will be in practice. *(added, not from class)*
- **Training set**: The data a model learns from. *(added, not from class)*
- **Test set**: Data held back to score the model. For forecasting, it comes after the training period. *(added, not from class)*
- **Backtest (walk-forward)**: Standing at a past plan date, forecasting the next stretch, scoring it, then stepping forward and repeating. The error is averaged across windows.
- **Baseline**: A simple forecasting method used as a benchmark. A more complex model should beat it to be worth using. *(added, not from class)*
- **Naive forecast**: The next value equals last week's value. It is fine when the series barely moves and lags every turn.
- **Simple moving average (MA, k)**: A forecast equal to the equal-weight average of the last k weeks. It smooths noise but gives a flat line, so it cannot see a season coming.
- **Weighted moving average**: A forecast equal to the average of the last k weeks with recent weeks counting more. It reacts faster than the simple MA but is still a flat line.
- **Seasonal naive**: The next value equals the same week last year. It catches the season but copies last year's noise and cannot see growth.
- **k (window size)**: The number of recent weeks the simple MA averages. It is a trade-off: small k reacts fast but chases noise, and large k is smooth but slow to notice change. Choose it with a time-ordered test.
- **KNN (k-nearest neighbors)**: A method that predicts from the k most similar past examples. It has the same trade-off as MA: few neighbors memorize, and many neighbors blur. *(added, not from class)*

## Takeaways

- Every series is trend + season + noise, so find each part before you forecast.
- Smoothing averages neighbors on both sides to reveal the trend. A wider window is smoother, and a 13-month window removes the monthly season.
- Centered smoothing only describes the past and cannot forecast.
- Never shuffle time. Use a time split so the test comes after the training data, as it does on planning day.
- Backtest by walking forward through several plan dates and averaging the error across windows.
- Naive, simple MA and weighted MA give flat forecasts. Seasonal naive catches the season but cannot see growth.
- Choices like k and the weights are tested on time-ordered data, not assumed.

## Review questions

1. Why does averaging a point with neighbors on both sides reveal the trend, and why can't this method forecast?
2. What happens to a 13-month smooth of monthly data, and why?
3. Why does a random split give a misleading score for a forecasting model, and how does a time split fix this?
4. Describe the steps of a walk-forward backtest and say how the final error is calculated.
5. For each of the four baselines, state its strength and its weakness. How does the choice of k affect the simple MA?
