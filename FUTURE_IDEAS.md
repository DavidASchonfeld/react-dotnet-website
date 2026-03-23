## Future Ideas


- Plot Fragments
- Tagging System
- Make Creator Role a standardized list to choose from, with admins being able to approve/deny additional options

- Approval System:
  - Currently, approval will automatically be approved. Eventually, it will be great to build a more complicated approval system.
  - Make the isApproved boolean used in many files into a more complicated system like "Not Submitted", "Pending", "Approval", "Rejection (Able to be Resubmitted)" etc.
  - Consolidate the repeating fields for Approved, SubmittedBy etc. into a separate class to add:
    - Visibility/AccessStatus
    - SubmittedById
    - SubmittedDate
    - ApprovedById
    - ApprovedDate
    - RejectedById
    - RejectedDate
    - RejectionReason
  - to classes to streamline/simplify/refactor the submission/approval process
  - Also: Streamline "IsApproved" VS "AccessStatus"
    - "isApproved": for private->submit because goal is for it to be public
    - "AccessStatus": You choose if it is Public or Private
- Edit history/audit trail
- After editing, requiring approval for new edits/updates
- Report button (for inappropriate content)

- Admin Features
  - Only Admins can edit MediaItems, Genres, MediaTypes after approval
  - Only admins can edit descriptions/titles of MediaItems
  - Only admins can edit descriptions/titles of public MediaLists
- And after these features, build an edit/approval system of non-admins making edits that can be approved by the admins

- Creator Detail Characteristic:
  - For Example: a Birthday field

When Displaying a Series:
- To Display Creators for that Series: I would query all of the creators for each piece of MediaItem inside that SeriesItem, remove duplicates and then display those creators
- Same applies for when at a Creator's page, and wanting their Genres (search through all of their created MediaItems's Genre tags, remove duplicates and then show)

- Instead of Deleting, Archiving (and then, after 30 days, automatically delete for real)

- Deleting: When a user is deleted, I want a default "ghost" account that gets ownership of all of those items (besides MediaList) that the deleted user used to own.
- Submission Queue Tool for Admins to Review/Approve/Deny etc. pending items

Right now, duplicate MediaItems in the same MediaList is not allowed. In the future, I could add the ability to allow it after a Confirmation popup.

Implement batching for requesting data from the backend (Means to split the data into chunks for the front-end to process). Very helpful when you have huge amounts of data to request from the backend.

Implement bouncy refreshing,
@tanstack/react-query: pull to refresh

- Administrators can see all private lists
  - Formalize/neaten policy on administrators being able to see private lists for helpdesk support and safety purposes.
  - It is optimal that Admin access to private data is audit-logged (who accessed what, and when.)
- TODO: Implement Sharing Lists.

TODO: Implement into the MediaItem creation process:
- Creators
- Genres


Permission Giving: Complication:
Maybe give Moderators the ability to upgrade regular users to Moderator (but not the ability to demote them - otherwise, it might cause potential drama/craziness, so only Admins could do that.)

Give each MediaItem page and Creator page places to give URLS (each with their own title) to external websites
- For example:
  - Disclaimer for Users: You are about to navigate to an external website not controlled by this website's control. Are you sure you wish to proceed?
  - Label: Official Website, URL: officialWebsite.com
  - Label: IMDB Page, URL: imdb.com/thatThing
  - Label: Amazon Store, URL: amazon.com/officialBuyOnAmazon

Inspirations for this Website
- GoodReads.com
- IMDB.com
- Spotify.com (except this website does not play songs)
- TVTropes.org

- Add a search bar to search ALL mediaItems
  - And have a dropdown list of the 5 most popular items when each keystroke is typed in the search bar.

- Import Data from 3rd Party Websites

Create Default Playlists
(Inspired by GoodReads):
- Have Read, Currently Reading, Want to Read

- Recommendation Bar (People who read this book also read this too.)

Add to MediaItemDetailPage
- A copy of GoodRead's DropDown
- [an icon]

If an album/series/franchise etc. is marked as explicit,
my system should somehow handle that still.
For example, if someone has "Hide Explicit" Or "Hide PG-13 and Over", anything in that album/series/franchise should also be hidden.

Implement this (And this page is referenced (and commented out) on
frontend/src/components/Modals/MediaItemsSettingsModal.tsx)
navigate(`/mediaitem/${currentMediaItem.id}/creators`);
