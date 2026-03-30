# Future Ideas

## Core Feature Ideas

### Series & Creator Information Display
- **Display Creators for a Series**: Query all creators for each MediaItem inside that SeriesItem, remove duplicates and display those creators
- **Display Genres for Creator**: When viewing a Creator's page, search through all of their MediaItems' Genre tags, remove duplicates and show aggregated genres

### List Management
- **Allow Duplicate MediaItems**: Currently duplicates in the same MediaList are not allowed. Add ability to allow duplicates after a confirmation popup.
- **Implement List Sharing**: Enable users to share lists with others (with permission controls)

### External Links & URLs
- **External Resource Links**: Give each MediaItem page and Creator page the ability to store URLs (each with their own custom title) to external websites
  - Example use cases:
    - Label: "Official Website", URL: officialWebsite.com
    - Label: "IMDB Page", URL: imdb.com/thatThing
    - Label: "Amazon Store", URL: amazon.com/officialBuyOnAmazon
  - Include a disclaimer: "You are about to navigate to an external website not controlled by this website. Are you sure you wish to proceed?"

## User Experience & UI

### Refresh & Interactions
- **Bouncy/Pull-to-Refresh**: Implement using @tanstack/react-query for a native mobile-like refresh experience

### Content Discovery
- **Recommendation Bar**: Display recommendations similar to GoodReads (e.g., "People who read this book also read...")
- **Plot Fragment Tags**: Extend/Improve tags to better create/edit tags for specific plot fragments.

## Data & Content Management

### Deletion & Archiving
- **Archive Instead of Delete**: Replace hard deletion with archiving (with automatic hard deletion after 30 days)
- **Ghost Account for Deleted Users**: When a user is deleted, transfer ownership of all their items (except MediaLists) to a default "ghost" account

### Content Filtering & Ratings
- **Explicit Content Handling**: If an album/series/franchise is marked as explicit, the system should respect user content filters
  - Example: If a user has "Hide Explicit" or "Hide PG-13 and Over" enabled, anything in that album/series/franchise should also be hidden

### History & Auditing
- **Edit History & Audit Trail**: Track all changes made to items with full history
- **Approval After Edits**: Require approval before new edits/updates take effect (especially for public items)

## Admin & Moderation

### Approval System
- **Submission Workflow**: Currently, only moderators and administrators can post public lists/tags. Implement a full submission/approval workflow.
- **Approval States**: Replace the simple `isApproved` boolean with a more nuanced system:
  - States: "Not Submitted", "Pending", "Approved", "Rejected (Able to be Resubmitted)"
  - Track: SubmittedById, SubmittedDate, ApprovedById, ApprovedDate, RejectedById, RejectedDate, RejectionReason
- **Refactor Approval Fields**: Consolidate repeating `Approved`, `SubmittedBy` fields into a separate submission tracking class
- **Clarify Approval vs. Access**:
  - `isApproved`: For items transitioning from private → public (goal is public visibility)
  - `AccessStatus`: User choice of Public or Private visibility

### Admin Access & Security
- **Admin Access to Private Lists**: Administrators can see all private lists for helpdesk support and safety purposes
  - Formalize policy on when and how admins access private data
  - Implement audit logging: track who accessed what data and when
- **Submission Queue Tool**: Admin interface to review/approve/deny pending items

### Moderation Tools
- **Report Button**: Allow users to report inappropriate content
- **Content Moderation**: Central interface for handling reported content

## Design Inspirations

Borrow concepts from:
- **GoodReads.com** — social reading, ratings, reviews
- **IMDB.com** — comprehensive media databases, ratings
- **Spotify.com** — discovery, recommendations (without audio playback)
- **TVTropes.org** — detailed tagging and categorization
