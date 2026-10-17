# Digest: Clustering Members with Unsupervised Learning

*Business Analytics II · 2026-10-16 · source: `classes/Q5/Business Analytics II/2026-10-16 - Clustering Members with Unsupervised Learning.md`*

## Summary
The session contrasted supervised and unsupervised data, then explained how similarity between members is measured as distance. It covered the four steps of K-means and how to use an elbow plot to choose K.

## Key concepts

### Supervised vs. Unsupervised Data
- The key difference is the Renewed column: supervised data includes it, unsupervised data does not.
- Supervised columns: Member, Visits/month, Extra $/month, Renewed?
- Unsupervised columns: Member, Visits/month, Extra $/month.

### Similarity Is Distance
- Plot two members on their features; the straight line between them shows how different they are.
- Small distance = similar members; large distance = different members.
- With more features, add one more square gap per feature. The idea does not change.

### K-Means in Four Steps
- Step 1, Choose K: pick K starting centers. The example used three, with two crowded together.
- Step 2, Assign: every member joins its nearest center.
- Step 3, Move: each center jumps to the mean of its members.
- Step 4, Repeat: repeat steps 2 and 3 until each center lines up with the mean of its members.

### The Elbow Plot
- Variation always falls as K rises; with one cluster per member, variation reaches 0.
- To choose K, look for the bend; past it, each extra cluster lowers variation by almost nothing.
- Example: K=1: 100; K=3: 25; K=5: 6; K=6: 5; K=7: 4. The bend is at K = 5.

## Key terms
- **K**: the number of clusters.
- (Supervised, Unsupervised, K-means, Elbow plot and Variation are listed in the notes without definitions.)

## Unclear or missing
- Definitions of supervised, unsupervised, K-means, elbow plot and variation are not given.
- How variation is calculated is not explained.
- The notes do not say what the distance formula is beyond "square gaps" per feature.
- No K = 2 or K = 4 values are given in the elbow example.
- How the starting centers are picked is not stated.

## Questions worth reviewing
- What distinguishes supervised from unsupervised data in the member example?
- How does adding features change the distance calculation?
- Walk through the four K-means steps. When does the algorithm stop?
- Why does variation always fall as K rises, and why is the lowest variation not the best K?
- In the example, why is K = 5 chosen rather than 7?
