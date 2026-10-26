# Lean Thinking and Agile Delivery Approaches

*Project Mangment · 2026-10-26*

> This session introduced Lean management, which aims to cut waste, lead time and work in process, and listed the kinds of waste Lean targets. It then compared iteration-based Agile, which uses fixed-length sprints, with flow-based Agile, which delivers continuously.

## Lean Management

Lean management is an approach for making production processes more efficient. It does this by removing anything that slows work down or does not benefit the customer.

- Purpose: to increase efficiency in production processes.
    - Reduce lead time in production.
    - Reduce response time from suppliers and customers.
    - Reduce the use of resources that do not add value for the customer.
    - Reduce waste.
- Target: reduce the volume of work in process (WIP).
    - Reduce the wait time before work moves from one stage to another.

*Added context (not from class):*

> Lead time is the total time from when a request is made to when it is delivered. WIP is work that has been started but is not yet finished. When a lot of work is in progress at once, each item waits longer between stages, so lead time grows. Limiting WIP is therefore one of the main ways Lean shortens lead time.

## Targets of the Lean Approach

Lean looks for the kinds of waste that use time, effort or materials without adding value for the customer. The notes list eight targets.

- Delay and waiting time.
- Production of more than is needed (overproduction).
- Overprocessing.
- Non-value-adding activities.
- Transportation.
- Unnecessary movement or motion.
- Excess inventory.
- Defects in a product.

**Lean principles cycle**

![Graph 1](images/2026-10-26%20-%20Lean%20Thinking%20and%20Agile%20Delivery%20Approaches%20-%20Graph%201.png)

The picture shows the word 'Lean' in the middle of a circle of six boxes: Eliminate Waste, Build Quality, Fast Delivery, Delay in Making Decisions, Empower Team and Optimize the Whole. It shows that Lean is a set of connected principles, not a single technique. 'Eliminate Waste' ties directly to the waste targets listed in this section, and 'Fast Delivery' ties to the aim of reducing lead time and waiting.

*Added context (not from class):*

> These targets match the classic Lean 'wastes'. Overprocessing means doing more work than the customer needs, such as adding features nobody asked for. Transportation means moving materials or information unnecessarily. Motion means unnecessary movement by people. Defects force rework.

> The Graph 1 circle includes 'Delay in Making Decisions', which can look like it contradicts 'delay' as a waste. They are different ideas. The waste is idle waiting time in the process. The Lean software principle is to put off irreversible decisions until the last responsible moment, when more information is available. Check with your teacher how this was worded in class.

## Iteration-Based Agile

In iteration-based Agile, work is organized into repeating cycles of the same length, and the team plans around how many cycles it needs.

- Sprints are all equal in time.
    - Time boxes (the student noted Kanban here).
- Features are all equal in effort.
    - Features have similar story points.
- Estimates are based on the number of sprints needed to produce the required features.

**Equal sprints with a feature split across sprints**

![Graph 2](images/2026-10-26%20-%20Lean%20Thinking%20and%20Agile%20Delivery%20Approaches%20-%20Graph%202.png)

The picture shows four sprints, each labeled 20 SP. Sprint 1 and Sprint 2 hold Feature A Part 1 and Feature A Part 2. Sprint 3 holds Feature B and Sprint 4 holds Feature C, each labeled 20 SP. Feature A is marked 40(20) SP, which seems to mean the feature is 40 SP but only 20 SP fits in the first sprint. The rest is finished in Sprint 2. The box under the diagram says each iteration takes the same time, iterations are the same length, and delivery cadence is consistent for all product increments. This matches the notes: sprints are equal, effort per sprint is similar, and a larger feature is split so it fits the fixed sprint size.

*Added context (not from class):*

> A time box is a fixed period in which work must fit. Fixed sprints are most closely associated with Scrum. Kanban is usually linked to flow-based work, which is the next topic, so confirm the Kanban label with your teacher. Story points are a relative measure of how large or difficult a piece of work is.

## Flow-Based Agile

In flow-based Agile, work is pulled through the process as the team has capacity. It is not forced into fixed-length sprints.

- Work on the backlog progresses as capacity allows.
- Sprint time varies.
- Feature delivery effort varies.
- Key performance indicators are the WIP at each workflow stage and cycle time.
- Delivery is continuous.

**Variable-length work in flow-based Agile**

![Graph 3](images/2026-10-26%20-%20Lean%20Thinking%20and%20Agile%20Delivery%20Approaches%20-%20Graph%203.png)

The picture shows three sprints. Sprint 1 is wider and holds Feature A at 40 SP. Sprint 2 holds Feature B at 20 SP and Sprint 3 holds Feature C at 20 SP. The box under the diagram says the time to complete each feature is not the same, iterations are not the same length, and delivery cadence varies. Compared with Graph 2, Feature A is not split. It is finished in one longer block, so the timing follows the size of the work.

*Added context (not from class):*

> Cycle time is how long one item takes from when work starts on it to when it is finished. Flow-based Agile connects back to Lean, because both focus on limiting WIP and reducing wait time between stages.

## Key terms

- **Lean management**: An approach to increase efficiency in production processes by reducing lead time, supplier and customer response time, resources that add no customer value, and waste.
- **Lead time**: The total time from when work is requested or started to when it is delivered. Lean tries to shorten it. *(added, not from class)*
- **Work in process (WIP)**: The volume of work that has been started but not finished. Lean aims to reduce it and to reduce the wait before work moves between stages.
- **Waste**: Any activity or resource that does not add value for the customer. Examples include delay, overproduction, overprocessing, transportation, motion, excess inventory and defects.
- **Non-value-adding activity**: An activity the customer would not pay for or benefit from. Lean tries to remove these activities.
- **Overproduction**: Producing more than is needed.
- **Overprocessing**: Doing more work or effort on a product than the customer requires. *(added, not from class)*
- **Excess inventory**: Materials or finished goods held beyond what is needed, which ties up resources and can hide problems. *(added, not from class)*
- **Defects**: Faults in a product that cause rework, extra cost and delay. *(added, not from class)*
- **Iteration-based Agile**: An Agile style where sprints are all the same length, features have similar effort, and estimates are based on the number of sprints needed to produce the required features.
- **Sprint**: A fixed-length work cycle in which a team completes a set amount of work. In iteration-based Agile all sprints are equal in time.
- **Time box**: A fixed period of time within which work must be completed.
- **Story points (SP)**: A relative unit for estimating the size or effort of a feature. In iteration-based Agile, features have similar story points.
- **Flow-based Agile**: An Agile style where backlog work moves forward as capacity allows. Sprint time and feature effort vary, and delivery is continuous.
- **Backlog**: The prioritized list of work waiting to be done. *(added, not from class)*
- **Cycle time**: The time it takes for a work item to move through the workflow. It is a key performance indicator in flow-based Agile.
- **Key performance indicator (KPI)**: A measurable value used to judge how well a process is performing. In flow-based Agile these are WIP at each workflow stage and cycle time.
- **Delivery cadence**: The rhythm or regularity with which work is delivered. It is consistent in iteration-based Agile and varies in flow-based Agile.
- **Kanban**: A flow-based method that visualizes work on a board and limits WIP. The notes mention it next to time boxes, so confirm the context with your teacher. *(added, not from class)*

## Takeaways

- Lean aims to increase efficiency by reducing lead time, response time, waste, and resources that add no customer value.
- Reducing WIP and the wait time between stages is the central Lean target.
- The eight targets are delay or waiting, overproduction, overprocessing, non-value-adding activities, transportation, motion, excess inventory and defects.
- Iteration-based Agile uses equal sprints and similar-sized features, and estimates by counting sprints.
- Flow-based Agile pulls work as capacity allows, with varying sprint time and feature effort, continuous delivery, and WIP and cycle time as the KPIs.

## Review questions

1. What is the purpose of Lean management, and what four reductions does it aim for?
2. Why is reducing work in process and the wait time between stages a Lean target?
3. List the eight targets of the Lean approach.
4. How do iteration-based and flow-based Agile differ in sprint length, feature effort and delivery cadence?
5. Which KPIs are used in flow-based Agile, and why do they suit a continuous delivery model?
