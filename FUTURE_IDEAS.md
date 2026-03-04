## Future Ideas


-- Plot Fragments
-- Tagging System
-- Make Creator Role a standardized list to choose from, with admins being able to approve/deny additional options

-- Approval System:
---- Currently, approval will automatically be approved. Eventually, it will be great to build a more complicated approval system.
---- Make the isApproved boolean used in many files into a more complicated system like "Not Submitted", "Pending", "Approval", "Rejection (Able to be Resubmitted)" etc.
---- Consolidate the repeating fields for Approved, SubmittedBy etc. into a separate class to add 
to classes to streamline/simplify/refactor the submission/approval process

-- Creator Detail Characteristic:
---- For Example: a Birthday field

When Displaying a Series:
-- To Display Creators for that Series: I would query all of the creators for each piece of MediaItem inside that SeriesItem, remove duplicates and then display those creators
-- Same applies for when at a Creator's page, and wanting their Genres (search through all of their created MediaItems's Genre tags, remove duplicates and then show)

-- Instead of Deleting, Archiving (and then, after 30 days, automatically delete for real)

-- Deleting: Whee n a user is deleted, I want a default "ghost" account that gets ownership of all of those items (besides MediaList) that the deleted user used to own.
-- Submission Queue Tool for Admins to Review/Approve/Deny etc. pending items



