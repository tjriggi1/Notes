# Digest: Dimension Reduction and Neighbor-Based Prediction

*Business Analytics II · 2026-10-20 · source: `classes/Q5/Business Analytics II/2026-10-20 - Dimension Reduction and Neighbor-Based Prediction.md`*

## Summary
The session covered principal component analysis (PCA), which squeezes many columns into a few new axes, and K nearest neighbors (KNN), which predicts by letting the closest customers vote. It also covered choosing K with cross-validation and setting a cost-based cutoff.

## Key concepts

### PCA squeezes many columns into a few new axes
- Keep the components that hold the most spread. Example: PC1 and PC2 hold 77% of the spread, PC3 and PC4 hold 23%, so only PC1 and PC2 are kept.
- PCA "will not do three things for you":
  - Scale first, otherwise dollars outvote counts.
  - Fit on training data, then apply the result to new customers.
  - PCA ignores the outcome: the most spread does not mean the most predictive.

### KNN: K nearest neighbors
- The k closest customers vote; the vote share is a probability, and costs set the cutoff.
- K=3 example: 2 of 3 neighbors reordered, so predict the customer reorders.
- K=7 example: 4 of 7 neighbors left, so predict the customer is one-and-done.
- Too few neighbors memorize the data; too many blur it.
- Choose K with cross-validation (training and new data cross).
- Scale first, or dollars decide who counts as close.
- Cutoff = false alarm cost / (false alarm cost + miss cost). Example: wasted gift card $6, lost customer $14, cutoff = 6/(6+14) = 30%.

## Key terms
- **PCA (principal component analysis)**: squeezes many columns into a few new axes.
- **Principal components (PC1, PC2, ...)**: the new axes; keep those with the most spread.
- **KNN (K nearest neighbors)**: the k closest customers vote to make the prediction.
- **K**: number of neighbors that vote; too few memorize, too many blur.
- **Cross-validation**: the way to choose K; described as "when training and new data cross".
- **Vote share**: share of neighbors voting for an outcome, treated as a probability.
- **Cutoff**: vote-share threshold for a prediction, set by costs.
- **Spread**: listed without an explanation.

## Unclear or missing
- "Spread" is not defined (presumably variance, but the notes do not say).
- How cross-validation actually works is only hinted at.
- The notes say PCA "will not do three things" but the list reads as three cautions; what each means in practice is brief.
- How "closest" is measured in KNN is not restated (the 10-16 notes cover distance as similarity).
- Which side of the cutoff triggers action (e.g. the gift-card decision) is not spelled out; the 30% example does not say whether it applies to the churn or reorder probability.
- Whether the 77%/23% example is a cumulative or per-component figure beyond the stated split is not shown.

## Questions worth reviewing
- Why must data be scaled before PCA or KNN?
- Why fit PCA on training data only?
- Why might the components with the most spread not be the most predictive?
- With K=3 vs K=7, how does each vote turn into a prediction?
- What goes wrong with too small or too large K, and how is K chosen?
- Compute the cutoff for a $6 false alarm and a $14 miss. Why is it 30% and not 50%?
