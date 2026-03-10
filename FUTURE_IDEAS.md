## Future Ideas


-- Plot Fragments
-- Tagging System
-- Make Creator Role a standardized list to choose from, with admins being able to approve/deny additional options

-- Approval System:
---- Currently, approval will automatically be approved. Eventually, it will be great to build a more complicated approval system.
---- Make the isApproved boolean used in many files into a more complicated system like "Not Submitted", "Pending", "Approval", "Rejection (Able to be Resubmitted)" etc.
---- Consolidate the repeating fields for Approved, SubmittedBy etc. into a separate class to add:
------ Visibility/AccessStatus
------ SubmittedById
------ SubmittedDate
------ ApprovedById
------ ApprovedDate
------ RejectedById
------ RejectedDate
------ RejectionReason
to classes to streamline/simplify/refactor the submission/approval process
---- Also: Streamline "IsApproved" VS "AccessStatus"
------ "isApproved": for private->submit becuase goal is for it to be public
------ "AccessStatus: You choose if it is Public or Private
-- Edit history/audit trail
-- after editing, requiring approval for new edits/updates
-- Report button (for inappropriate content)

-- Admin Features
---- Only Admins can edit MediaItems, Genres, MedaTypes after approval
---- Only admins can edit descriptions/titles of MediaItems
---- Only admins can edit descriptions/titles of public MediaLists
-- And after these features, build an edit/approval system of non-admins making edits that can be approved by the admins 

-- Creator Detail Characteristic:
---- For Example: a Birthday field

When Displaying a Series:
-- To Display Creators for that Series: I would query all of the creators for each piece of MediaItem inside that SeriesItem, remove duplicates and then display those creators
-- Same applies for when at a Creator's page, and wanting their Genres (search through all of their created MediaItems's Genre tags, remove duplicates and then show)

-- Instead of Deleting, Archiving (and then, after 30 days, automatically delete for real)

-- Deleting: Whee n a user is deleted, I want a default "ghost" account that gets ownership of all of those items (besides MediaList) that the deleted user used to own.
-- Submission Queue Tool for Admins to Review/Approve/Deny etc. pending items

Right now, duplicate MediaItems in the same MediaList is not allowed. In the future, I could add the ability to allow it after a Confirmation popup.

Implement batching for requesting data from the backend (Means to split the data into chunks for the front-end to process). Very helpful when you have huge amounts of data to request from the backend.

Implement bouncy refreshing, swiping left/right and swiping up/down to reorder:
Use External Libraries for this:
@dnd-kit/core + @dnd-kit/sortable : Sorting Items in a List
react-swipeable: swipe left/right
@tanstack/react-query: pull to refresh