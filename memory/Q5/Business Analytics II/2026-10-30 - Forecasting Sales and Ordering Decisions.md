# Digest: Forecasting Sales and Ordering Decisions

*Business Analytics II · 2026-10-30 · source: `classes/Q5/Business Analytics II/2026-10-30 - Forecasting Sales and Ordering Decisions.md`*

## Summary
Holt-Winters forecasting smooths past sales into three pieces (level, trend, season), each with its own smoothing dial. Smoothing is a weighted average: new level = a * this week + (1 - a) * old level, so a high alpha reacts fast and a low alpha is calm. A single forecast is almost never exactly right, so it is turned into a range using past actual/forecast ratios. The critical ratio Cu / (Cu + Co) then tells you how high in that range to order.

## Key concepts

### Smoothing is a weighted average
- New level = a * this week + (1 - a) * old level; weight a on this week, (1 - a) on the old level.
- Graph 1 (weights on the last 8 weeks): alpha = 0.5 gives about 50%, 25%, 12%, 6%, 3%, 2%, 1%, 0%; only the last few weeks matter. Alpha = 0.2 gives about 20%, 16%, 13%, 10%, 8%, 7%, 5%, 4%; older weeks still count a lot.
- Every past week counts a little, fading by (1 - alpha) each week back. High alpha reacts fast; low alpha is calm.

### Three pieces, three dials
- Level: where sales are right now, smoothed.
- Trend: how much the level is changing each week.
- Season: how far this week of the year usually runs above or below the level.
- Each piece has its own smoothing setting (dial).

### Additive Holt-Winters
- Use when the seasonal swing stays about the same.
- Example: a garden center's spring rush adds about 20,000 a week, in a strong year or a weak one.

### Multiplicative Holt-Winters
- Use when the seasonal swing grows with the business.
- Example: a fast-growing online gift shop sells about twice an average week in November; when the business doubles, the November jump doubles too.

### A forecast is a range
- Look back: for past weeks, divide actual by forecast.
- Take the middle 80% of those ratios (example 0.85 to 1.25) as the 80% range.
- Stretch the forecast: multiply the new forecast by both ends.
- Check it: an 80% range should catch about 8 weeks in 10; fewer means too narrow.
- Watch out: ranges built from quiet months or only a few weeks are too narrow for the busy season.
- Graph 2 (a sketch, not real data): forecast starts near 150 with range roughly 128 to 188 (matches x0.85 and x1.25); the band is wider where the forecast is higher and follows its jump and dip.

### How much to order: the critical ratio
- Order too little: each 1 dollar of unfilled demand costs the lost margin, Cu.
- Order too much: each 1 dollar of leftover stock costs what you lose clearing it, Co.
- Critical ratio = Cu / (Cu + Co). Order the amount that past errors say sales will stay under that share of the time.
- Maya's example: Cu = 0.40, Co = 0.15, ratio = 0.40 / 0.55, about 73% (to the right of the 50% middle).
- Margins up (Cu up): ratio up, order more. Clearance costlier (Co up): ratio down, order less. Equal costs: 50%, order the middle.

## Key terms
- **Smoothing (exponential smoothing)**: weighted average of this week and the old level; older weeks count less and less.
- **Alpha (a)**: weight on the newest week; high = fast, low = calm.
- **Level / Trend / Season**: as above.
- **Additive / Multiplicative Holt-Winters**: as above.
- **80% range**: middle 80% of past actual/forecast ratios, multiplied onto a new forecast; should catch about 8 weeks in 10.
- **Cu / Co**: lost margin per unfilled dollar / clearance loss per leftover dollar.
- **Critical ratio**: Cu / (Cu + Co).

## Unclear or missing
- Graphs 1 to 3 are described only in the notes; Graph 2 is explicitly a sketch with approximate values.
- The note says each piece has its own dial but gives no dial names or how to choose their values (names are added context).
- How to combine level, trend and season into a forecast is not given as class content (formulas are added context).
- "Middle 80%" is not spelled out (which percentiles define it), and how many past weeks are enough is not stated beyond "not just a few".
- How to turn the critical ratio into an actual order quantity is only stated as "the amount sales stay under that share of the time"; no worked quantity is given.
- Whether Maya's Cu and Co are per dollar or per unit, and what she sells, is not stated in the notes.

## Questions worth reviewing
1. Write the smoothing formula for the new level. What happens to the forecast when alpha is high versus low?
2. What do the level, trend and season each describe?
3. For a business whose November jump doubles when the business doubles, would you use additive or multiplicative Holt-Winters, and why?
4. How do you build an 80% range around a forecast, and how do you check that it is wide enough?
5. Maya has Cu = 0.40 and Co = 0.15. What is her critical ratio, and how does it change if clearance gets costlier?
6. Why are ranges built from quiet months or only a few weeks too narrow?

## Background (not from notes)
These points appear in the note only as "added context, not from class".
- Alpha is between 0 and 1; because the old level contains all earlier weeks, every past week still has some (shrinking) influence.
- In Holt-Winters the dials are usually called alpha (level), beta (trend) and gamma (season).
- Additive: forecast is roughly level + trend + season (garden center season about +20,000 in rush weeks). Multiplicative: roughly (level + trend) * seasonal factor (gift shop November factor about 2).
- Example: forecast 200 with range 0.85 to 1.25 gives 170 to 250. A ratio above 1 means sales beat the forecast; below 1 means they fell short.
- Cu is cost of underage, Co is cost of overage; this is standard newsvendor logic.
