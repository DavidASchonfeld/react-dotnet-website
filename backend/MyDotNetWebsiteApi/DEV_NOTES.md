Notes on MediaApiRef VS CacheItem VS ImageCache

-- MediaApiRef: NOT a cache. Just an item with minimum information to identify whatever mediaItem it represents (For example: The Lightning Thief, by Rick Riordan, 2005. USA, and a URL to an image)

-- CacheItem: Caching any query result from a 3rd-Party
---- Potential (But Not All Possible) Queries
------ MediaItem Details (For example, for The Lightning Thief: genres: fantasy, adventure, and other facts)
------ SearchQuery Results (a list of MediaItems, each with basic details for them)
---- Has a TTL (Time to Leave) Eviction Policy aka Expires after Certain Amount of Time 

-- ImageCache
---- Has a TTL and a LRU Eviction Policy
------- TTL (Time to Leave): item expires after certain amount of time
------- LRU (Least Recently Used): Once the cache reaches max storage, during the nightly service (CacheEvictionService.cs), the least recently image(s) are removed to make room for more image caching.
--------- "least recently used": Every time an item is looked at, its "Last used" field is updated.

Constants/Hard Numbers for Expiration, for LRU etc.
-- Stored in backend/MyDotNetWebsiteApi/AppConstants.cs


Pre-Warming a Cache:
-- means: ahead of time, if I know that someone will need some resource, I will load it into the cache ahead of time.
-- In MediaApiRefService.cs
---- for searching for a list of media items, my backend's API endpoint for returning searh results from the 3rd party will prewarm the thumbnail images for each search result so when my front end shows the search results (each search result row (frontend/src/components/RowItemContent.tsx) asks for the backend's image cache instead of retrieving the image from the search results). So, by prewarming the cache with the thumbnail images that, originally I would just return/pass into the components directly, now I pre-warm thumbnails, the return the search results, then the front end requests the now-cached thumbnail images. So that way, when loading the searchResult list, it will still just be 1 3rd-party API request.
---- for searching for 1 specific media item, my script will prewarm its poster (aka full-sized image)


Before saving an imageUrl to the imageCache, the backend will test the imageUrl to ensure it does not receive an error. If it does, it does not save/use the imageUrl (though, if the imageUrl is attached to other non-error data, it still uses that other data.)