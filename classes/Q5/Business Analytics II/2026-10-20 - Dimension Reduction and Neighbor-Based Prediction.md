# Dimension Reduction and Neighbor-Based Prediction

*Business Analytics II · 2026-10-20*

> The session covered principal component analysis (PCA), which compresses many columns into a few new axes, and K nearest neighbors (KNN), which predicts by letting the closest customers vote. It also covered how to choose K and how to set a cost-based cutoff.

## PCA squeezes many columns into a few new axes

Keep the components that hold the most spread. In the example, PC1 and PC2 hold 77% of the spread and PC3 and PC4 hold 23%, so only PC1 and PC2 are kept.

- PCA stands for principal component analysis.
- PCA will not do three things for you.
- Scale first: otherwise dollars outvote counts.
- Fit on training data: then apply the result to new customers.
- PCA ignores the outcome: the most spread does not mean the most predictive.

## KNN: K nearest neighbors

KNN lets the k closest customers vote. The vote share is a probability, and costs set the cutoff.

- Example with K=3: 2 of 3 neighbors reordered, so predict that the customer reorders.
- Example with K=7: 4 of 7 neighbors left, so predict that the customer is one-and-done.
- Too few neighbors memorize the data. Too many blur it.
- Choose K with cross-validation, where training and new data cross.
- Scale first, or dollars decide who counts as close.
- Cutoff = false alarm cost / (false alarm cost + miss cost).
- Example: a wasted gift card costs $6 and a lost customer costs $14, so the cutoff is 6/(6+14) = 30%.

## Key terms

- **PCA (principal component analysis)**: A method that squeezes many columns into a few new axes.
- **Principal components (PC1, PC2, and so on)**: The new axes PCA produces. Keep the ones that hold the most spread.
- **Spread**: (not explained in class notes)
- **KNN (K nearest neighbors)**: A method in which the k closest customers vote to make the prediction.
- **K**: The number of nearest neighbors that vote. Too few memorize and too many blur.
- **Cross-validation**: The way to choose K, described in the notes as when training and new data cross.
- **Vote share**: The share of neighbors voting for an outcome, treated as a probability.
- **Cutoff**: The vote share threshold for a prediction, set by costs: false alarm cost / (false alarm cost + miss cost).

## Takeaways

- Scale the data before using PCA or KNN, or dollars will dominate counts.
- Fit PCA on training data, then apply it to new customers.
- The components with the most spread are not necessarily the most predictive.
- Choose K with cross-validation to avoid memorizing or blurring.
- Set the KNN cutoff from the costs of false alarms and misses, not by default.
