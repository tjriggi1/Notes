# Digest: K-means Clustering and Choosing K

*Business Analytics II · 2026-10-22 · source: `classes/Q5/Business Analytics II/2026-10-22 - K-means Clustering and Choosing K.md`*

## Summary
The teacher showed a bar chart of K-means clustering with K from 1 to 10 on the x-axis and variation from 0 to 100 on the y-axis. The pattern is that variation falls as K increases, with the K = 1 bar the tallest. The notes record the axes and trend only, not the actual bar heights.

## Key concepts

### K-means: Variation as K Increases
- The graph is a bar chart with one bar per K value, 1 to 10.
- The x-axis is K (number of clusters); the y-axis is variation, scaled 0 to 100.
- Trend: variation goes down as K goes up; K = 1 is the tallest bar and bars shrink toward K = 10.
- The table of bar heights in the note (100, 62, 42, ...) is explicitly labeled illustrative, not recorded from class. Do not treat those numbers as the teacher's data.

## Key terms
- The note's definitions (K-means, K, variation, cluster, centroid, elbow method) are all marked "added, not from class". The teacher's own definitions are not recorded.

## Unclear or missing
- Actual bar heights were not recorded.
- How the teacher measured "variation" is not stated.
- The notes do not say the graph was used for the elbow method; that is flagged as a guess ("check with your teacher or the slides").
- No K was chosen from this graph in the notes.

## Questions worth reviewing
- What do the x-axis and y-axis show, and over what ranges?
- What happens to variation as K increases?
- Why might the lowest variation not be the best K? (The note gives this reasoning as outside context.)
- How does this relate to the elbow plot from 2026-10-16, where the bend was at K = 5?

## Background (not from notes)
- These points appear in the note only as added context, not from class.
- Variation usually means total within-cluster variation: distance of points from their own cluster center.
- Variation always shrinks as K grows; at K equal to the number of points it is zero, so the minimum does not identify the best K.
- The elbow method picks K where extra clusters stop reducing variation much.
- A centroid is the mean position of the points in a cluster.
- Connection to class: the 2026-10-16 digest records choosing K at the bend of an elbow plot, which fits this graph.
