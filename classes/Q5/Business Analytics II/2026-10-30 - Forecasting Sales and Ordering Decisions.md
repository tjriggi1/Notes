# Forecasting Sales and Ordering Decisions

*Business Analytics II · 2026-10-30*

> This session covered how Holt-Winters forecasting smooths past sales into level, trend and season. It then covered turning a single forecast into a range, and using the critical ratio to decide how much to order.

## Smoothing is a weighted average

Smoothing updates the estimate of current sales by mixing the newest week with the previous estimate. The formula is: new level = a * this week + (1 - a) * old level.

- The new level is a weighted average of this week's sales and the old level.
    - The weight on this week is a (alpha).
    - The weight on the old level is (1 - a).

**How much each past week counts for alpha = 0.5 and alpha = 0.2**

![Graph 1](images/2026-10-30%20-%20Forecasting%20Sales%20and%20Ordering%20Decisions%20-%20Graph%201.png)

The two bar charts show the weight given to each of the last 8 weeks. With alpha = 0.5, last week gets about 50%, then 25%, 12%, 6%, 3%, 2%, 1% and 0% for week 8. The weights drop quickly, so only the last few weeks matter. With alpha = 0.2, the weights start at about 20% and fade slowly: 16%, 13%, 10%, 8%, 7%, 5% and 4%. Older weeks still count for a lot. The slide's message is that every past week counts a little, fading by (1 - alpha) each week back. A high alpha reacts fast and a low alpha is calm. This is the same weighted average as the formula above, shown week by week.

*Added context (not from class):*

> Alpha is a number between 0 and 1. Because the old level already contains all earlier weeks, every past week still has some influence. Its influence shrinks each week it goes back. This is called exponential smoothing.

## Three pieces, three dials

The forecasting model splits sales into three pieces. Each piece has its own smoothing setting, or dial.

- Level
    - Where sales are right now, smoothed.
- Trend
    - How much the level is changing each week.
- Season
    - How far this week of the year usually runs above or below the level.

*Added context (not from class):*

> Each dial has its own smoothing weight. In Holt-Winters these are usually called alpha for level, beta for trend and gamma for season. A forecast combines the three pieces.

## Additive Holt-Winters

- Business example
    - A garden center's spring rush adds about 20,000 a week, whether it is a strong year or a weak one.
    - Use it when the seasonal swing stays about the same.

*Added context (not from class):*

> In the additive version the season is a fixed amount added to the level and trend. The forecast is roughly level + trend + season. In the garden center case the season piece is about +20,000 in the rush weeks.

## Multiplicative Holt-Winters

- Business example
    - A fast-growing online gift shop sells about twice an average week in November. When the business doubles, the November jump doubles too.
    - Use it when the seasonal swing grows with the business.

*Added context (not from class):*

> In the multiplicative version the season is a factor that multiplies the level and trend. The forecast is roughly (level + trend) * seasonal factor. For the gift shop the November factor is about 2. Whatever the level is, November is forecast at about twice that.

## A forecast is a range

A single forecast number will almost never be exactly right. The method below turns past forecast errors into a range.

- Look back
    - For past weeks, divide actual by forecast.
- Take the middle
    - The middle 80% of those ratios, say 0.85 to 1.25, is the 80% range.
- Stretch the forecast
    - Multiply the new forecast by both ends.
- Check it
    - An 80% range should catch about 8 weeks in 10.
    - If it catches fewer, it is too narrow.
- Watch out
    - A range built from quiet months, or from only a few weeks, will be too narrow for the busy season.

**Forecast with an 80% range (a sketch, not real data)**

![Graph 2](images/2026-10-30%20-%20Forecasting%20Sales%20and%20Ordering%20Decisions%20-%20Graph%202.png)

A thick line shows the forecast. It rises over time, jumps up part-way through, peaks, dips slightly and then rises a little at the end. Two dashed lines show the top and bottom of the 80% range around it. The slide labels the picture as a sketch, so the values are only approximate. The forecast starts near 150, with the range roughly 128 to 188. That matches multiplying by 0.85 and 1.25. The band is wider when the forecast is higher, because the forecast is multiplied by the ratios. The band follows the forecast's shape, including its jump and dip.

*Added context (not from class):*

> Example: with a forecast of 200 and a range of 0.85 to 1.25, the 80% range is 170 to 250. A ratio above 1 means actual sales beat the forecast, and a ratio below 1 means they fell short.

## How much to order: the critical ratio

Once you have a range of possible demand, the order quantity depends on which mistake costs more: ordering too little or too much.

- Order too little
    - Each 1 dollar of demand that can't be filled costs the lost margin: Cu.
- Order too much
    - Each 1 dollar of stock left over costs what you lose clearing it: Co.
- Critical ratio = Cu / (Cu + Co)

**Critical ratio, Maya's example and how it moves**

![Graph 3](images/2026-10-30%20-%20Forecasting%20Sales%20and%20Ordering%20Decisions%20-%20Graph%203.png)

The slide gives the formula critical ratio = Cu / (Cu + Co). In Maya's example Cu = 0.40 and Co = 0.15, so the ratio is 0.40 / (0.40 + 0.15), or about 73%. A slider from 0% to 100% marks 50% as the middle and shows the order point at 73%, to the right of the middle. The slide says to order the amount that past errors say sales will stay under 73% of the time. A table shows how the ratio moves. If margins rise (Cu up), the ratio goes up and you order more. If clearance gets costlier (Co up), the ratio goes down and you order less. If both costs are equal, the ratio is 50% and you order the middle.

*Added context (not from class):*

> Cu is the cost of underage (ordering too little). Co is the cost of overage (ordering too much). The critical ratio is the chance of not running out that you should aim for. This is the standard newsvendor logic. Use the range method from the previous section to find the order quantity that sales stay under that share of the time.

## Key terms

- **Smoothing (exponential smoothing)**: A weighted average of this week's sales and the old level: new level = a * this week + (1 - a) * old level. Older weeks count less and less.
- **Alpha (a)**: The smoothing weight on the newest week. A high alpha reacts fast to new data, and a low alpha is calm and changes slowly.
- **Level**: Where sales are right now, smoothed.
- **Trend**: How much the level is changing each week.
- **Season**: How far this week of the year usually runs above or below the level.
- **Holt-Winters**: A forecasting method that tracks level, trend and seasonality and updates each by smoothing. It comes in additive and multiplicative versions. *(added, not from class)*
- **Additive Holt-Winters**: The version to use when the seasonal swing stays about the same size, such as a garden center's spring rush adding about 20,000 a week in strong and weak years.
- **Multiplicative Holt-Winters**: The version to use when the seasonal swing grows with the business, such as a gift shop selling about twice an average week in November, whatever its size.
- **80% range**: The range built from the middle 80% of past actual/forecast ratios, for example 0.85 to 1.25. You multiply a new forecast by both ends. It should catch about 8 weeks in 10.
- **Actual/forecast ratio**: A past week's actual sales divided by that week's forecast. Values above 1 mean sales beat the forecast, and values below 1 mean they fell short. *(added, not from class)*
- **Cu (cost of underage)**: The cost of each 1 dollar of demand you can't fill because you ordered too little. It equals the lost margin.
- **Co (cost of overage)**: The cost of each 1 dollar of leftover stock because you ordered too much. It equals what you lose clearing it.
- **Critical ratio**: Cu / (Cu + Co). Order the amount that past errors say sales will stay under that share of the time. For Maya, 0.40 / (0.40 + 0.15) is about 73%.

## Takeaways

- Smoothing is a weighted average: new level = a * this week + (1 - a) * old level. High alpha reacts fast, and low alpha is calm.
- Holt-Winters tracks three pieces: level, trend and season.
- Use additive Holt-Winters when the seasonal swing stays about the same. Use multiplicative when the swing grows with the business.
- A forecast should be given as a range. Build it by multiplying the forecast by the middle 80% of past actual/forecast ratios.
- Check the range. An 80% range should catch about 8 weeks in 10. Ranges built from quiet months or from only a few weeks come out too narrow.
- The critical ratio Cu / (Cu + Co) tells you how high in the range to order. Higher margins mean order more, costlier clearance means order less, and equal costs mean the middle.

## Review questions

1. Write the smoothing formula for the new level. What happens to the forecast when alpha is high versus low?
2. What do the level, trend and season each describe?
3. For a business whose November jump doubles when the business doubles, would you use additive or multiplicative Holt-Winters, and why?
4. How do you build an 80% range around a forecast, and how do you check that it is wide enough?
5. Maya has Cu = 0.40 and Co = 0.15. What is her critical ratio, and how does it change if clearance gets costlier?
