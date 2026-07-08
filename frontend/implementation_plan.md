# Goal Description

The current layout uses a strict `100vh` height which causes issues (squished or overflowing content) on laptops with smaller screens or different aspect ratios. The goal is to redesign the layout to be truly responsive and professional (like modern IDEs), ensuring it perfectly fits any laptop screen without requiring page-level scrolling.

## Open Questions

- I am proposing moving the **Run** and **Review** buttons to the top Editor bar (next to the Language selector). This is a standard IDE pattern and will save a lot of vertical space, fixing the squishing issue on small screens. Does this sound good to you?

## Proposed Changes

### UI Redesign & Layout Adjustments
#### [MODIFY] `frontend/src/App.jsx`
- **Move Action Buttons**: Move the `Run` button, `Review` button, and the `Analyze Complexity` checkbox into the top header of the code editor (or the main app header).
- **Flexible Right Panel**: Since the buttons are moved, the right panel will now only contain the `Input/Test Cases` and the `Output/Analysis` sections. We will assign a `flex-1` (or proportional flex like 40% / 60%) to both sections so they naturally share the available vertical space.
- **Improved Spacing**: Reduce excessive margins and paddings on smaller laptop screens (e.g., reducing `p-4` to `p-2` or `p-3` where necessary) to ensure the UI feels roomy without wasting space.
- **Scrollable Sub-containers**: Ensure all textareas, output boxes, and the test-case lists are strictly bound by their parent's height with `overflow-y-auto`, ensuring they scroll internally when the screen is small, rather than breaking the layout.

## Verification Plan

### Manual Verification
- Start the frontend server and test the UI on various screen sizes (using browser DevTools to simulate small laptops like 1280x800 and 1366x768).
- Ensure that the outer page never scrolls.
- Ensure that the Custom Input and Output sections are both visible and usable on small screens, gracefully degrading with internal scrollbars.
