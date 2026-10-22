# K-means Clustering and Choosing K

*Business Analytics II · 2026-10-22*

> This session looked at a graph of K-means clustering. It showed how the amount of variation in the data changes as the number of clusters (K) increases from 1 to 10.

## K-means: Variation as K Increases

The teacher showed a bar chart that compares different values of K in K-means clustering. K runs from 1 to 10 along the bottom (x-axis). Variation runs from 0 to 100 up the side (y-axis).

The main pattern is that as K goes up, variation goes down.

- The graph is a bar chart with one bar for each value of K from 1 to 10.
    - The x-axis is the K value (the number of clusters), from 1 to 10.
    - The y-axis is variation, on a scale from 0 to 100.
- The trend is that variation falls as K increases.
    - The bar for K = 1 is the tallest, and the bars shrink as K moves toward 10.

**Chart: Variation falls as K increases in K-means** (illustrative values)

The axes and the downward trend come from the student's description of the teacher's graph. The individual bar heights were not recorded in the notes, so these values are illustrative and only show the general shape.

| K (number of clusters) | Variation |
|---|---|
| 1 | 100 |
| 2 | 62 |
| 3 | 42 |
| 4 | 30 |
| 5 | 23 |
| 6 | 19 |
| 7 | 16 |
| 8 | 14 |
| 9 | 13 |
| 10 | 12 |

*Added context (not from class):*

> K-means asks you to choose the number of clusters (K) before you run it. In this kind of chart, variation usually means the total within-cluster variation. This is how far the points sit from the center of their own cluster, and the notes do not say exactly how the teacher measured it.

> Variation always shrinks as K grows, because more clusters means each cluster is smaller and tighter. At the extreme, if K equals the number of data points, variation is zero. So the lowest variation does not tell you the best K.

> Analysts usually look for an elbow, which is the point where adding more clusters stops reducing variation by much. They pick K near that point. This is the elbow method, and it is probably why the teacher showed this graph, but the notes do not say so. Check this with your teacher or the slides.

## Key terms

- **K-means clustering**: An unsupervised learning method that splits data into K groups (clusters). Each point is assigned to the cluster with the nearest center, and the centers are updated until the groups stop changing. *(added, not from class)*
- **K**: The number of clusters you ask K-means to find. It is chosen before the algorithm runs. In the class graph it ran from 1 to 10. *(added, not from class)*
- **Variation**: How spread out the data points are. In K-means this usually means the total distance of points from their cluster centers (within-cluster variation). In the class graph it fell as K increased. *(added, not from class)*
- **Cluster**: A group of data points that are more similar to each other than to points in other groups. *(added, not from class)*
- **Centroid**: The center of a cluster, calculated as the average position of all the points in that cluster. *(added, not from class)*
- **Elbow method**: A way to choose K. You plot variation against K and pick the point where the drop in variation levels off, so adding more clusters gives little extra benefit. *(added, not from class)*

## Takeaways

- The graph was a bar chart of K (1 to 10) against variation (0 to 100).
- As K goes up, variation goes down.
- More clusters make each cluster tighter, but the lowest variation does not mean the best K. Look for where the improvement slows down (the elbow).

## Review questions

1. What did the x-axis and y-axis show on the K-means bar chart, and what range did each cover?
2. What happens to variation as K increases, and why does this happen?
3. Why is it a poor idea to choose the K that gives the lowest variation?
4. How does the elbow method use a graph like this one to choose K?
