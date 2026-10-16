# Clustering Members with Unsupervised Learning

*Business Analytics II · 2026-10-16*

> The session contrasted supervised and unsupervised data, then explained how similarity is measured as distance. It covered the four steps of K-means and how to use an elbow plot to choose K.

## Supervised vs. Unsupervised Data

The key difference between the two is the Renewed column. Supervised data includes it. Unsupervised data does not.

- Supervised columns: Member, Visits/month, Extra $/month, Renewed?
- Unsupervised columns: Member, Visits/month, Extra $/month.

## Similarity Is Distance

- Plot two members on their features. The straight line between them shows how different they are.
- A small distance means the members are similar.
- A large distance means the members are different.
- With more features, add one more square gap for each feature. The idea does not change.

## K-Means in Four Steps

- Step 1, Choose K: Pick K starting centers. The example used three, with two of them crowded together.
- Step 2, Assign: Every member joins its nearest center.
- Step 3, Move: Each center jumps to the mean of its members.
- Step 4, Repeat: Steps 2 and 3 are repeated until each center is lined up with the mean of its members.

## The Elbow Plot

Variation always falls as K rises. With one cluster per member, variation reaches 0. To choose K, look for the bend in the plot. Past the bend, each extra cluster lowers variation by almost nothing.

- K = 1: variation 100
- K = 3: variation 25
- K = 5: variation 6
- K = 6: variation 5
- K = 7: variation 4
- In this example, the bend is at K = 5.

## Key terms

- **Supervised**: (not explained in class notes)
- **Unsupervised**: (not explained in class notes)
- **K-means**: (not explained in class notes)
- **K**: The number of clusters.
- **Elbow plot**: (not explained in class notes)
- **Variation**: (not explained in class notes)

## Takeaways

- Unsupervised data has no Renewed column.
- A small distance between members means they are similar.
- K-means repeats the assign and move steps until each center lines up with the mean of its members.
- Choose K at the bend of the elbow plot, where adding another cluster does very little.
