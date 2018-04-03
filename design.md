Design
===

# Activity view

- One axis should represent time.
- One axis should represent projects. Two different positions on that axis represent two different projects.
- Activities have a time and a project.
- Activities do not actually have a duration, just a timestamp, so some sort of default duration must be chosen for them in order to represent them on the time axis.
- This duration will be one day. Every activity will start at the beginning of that day, regardless of when in the day the timestamp ocurred. For visual parsing, it is best not to subdivide a day when the span of time when the entire graph can be several years. (I tried it.)
- In order to represent a lot of activity ocurring in one day, saturation can be used. The more saturated, the more activities occurred on that day. This can be implemented by overlapping rects that have opacities of less than 1.0.
- Getting details on an activity that happens on a day with other activities can be done by responding to a click to those rects with a dialog asking for which of the overlapping activities the user wants details for (ugh).
- OR at a certain zoom level, all of the activities in the day can be presented in a little treemap. (Weird, maybe)
- In order to distinguish activities on adjacent days, either alternating color (currently being done with OK results) or a different-colored stroke should be used. The stroke should be removed at a certain zoom level to avoid covering up the fill.
- For visual parsing ease, activities should more or less retain a square proportion. No thin slivers.
- In order to keep project labels readable, they need to have a minimum height, regardless of zoom level. And if they have a minimum height, in order to prevent them from overlapping illegibly, they need minimum spacing.  Hence, there should be a limit to zooming out on the projects axis.
- However, at the same time, zoom-out limit cannot apply to activities, lest they always retain a certain size on the project axis while their size on the time axis becomes smaller, resulting in hard-to-discern thin vertical rectangles. Activities should always zoom out as far on the project axis as on the time axis.
- Possibly, the user should be able to decide whether time goes on the x-axis and projects go on the y-axis and vice versa. Some activity patterns may benefit from one oriention while others may not.
