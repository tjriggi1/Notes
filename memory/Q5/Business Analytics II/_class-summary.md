# Business Analytics II: rolling class summary

Newest last. Source notes are under `classes/Q5/Business Analytics II/`.

## 2026-10-16: Clustering Members with Unsupervised Learning
Supervised data includes the Renewed column; unsupervised data does not. Similarity is distance between members on their features (small = similar). K-means: choose K centers, assign each member to the nearest center, move centers to the mean of their members, repeat until centers line up with their members' means. Choose K at the bend of the elbow plot (example: bend at K = 5, variation 6).
Digest: `2026-10-16 - Clustering Members with Unsupervised Learning.md`

## 2026-10-20: Dimension Reduction and Neighbor-Based Prediction
PCA squeezes many columns into a few new axes; keep the components with the most spread (example: PC1+PC2 = 77%). Scale first, fit on training data, and remember PCA ignores the outcome. KNN lets the k closest customers vote; vote share is a probability. Too few neighbors memorize, too many blur; pick K by cross-validation and scale first. Cutoff = false alarm cost / (false alarm cost + miss cost), e.g. 6/(6+14) = 30%.
Digest: `2026-10-20 - Dimension Reduction and Neighbor-Based Prediction.md`
