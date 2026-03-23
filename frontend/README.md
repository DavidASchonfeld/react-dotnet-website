

#### Running Instructions (Developer)
npm install <- Only needed before first time Running to install required NPM Packages
npm run dev


## Vite Template Generation Command:
npx create-vite@latest . --template react-ts
npm install react-router-dom
npm audit fix <- npm told me to run that command to fix security concerns, so I did and the concern was fixed.

## More to Download

Downloading Tailwind, a CSS folder:
npm install tailwindcss @tailwindcss/vite
And then, in index.css, I need to add "@import "tailwindcss";" to the top of the file.

Redux Toolkit
-- createSlice, createAsyncThunk, configureStore
React-Redux:
-- Provider, useSelector, useDispatch
Redux-Persist
-- replaces localStore.getItem/setItem from my handmade AuthContext.tsx file 

## Layer Separation Here in Front-End

-- Pages / Components (what user sees, calls dispatch(), reads states with useSelector())
    | dispatch(fetchMyLists(token))
-- Slices (Redux)  (holds state; manages async, knows about loading/error/success)
    | getMyMediaListS(token)
-- Services        (pure fetch() calls to the backend/HTTP; no Redux, just HTTP/JSON handling)
    | HttpRequest
-- Backend API (in the Backend half of this project)


## Data Between React Components/Layers

In React, data flows down (parent -> child via props), never up

A child cannot push a variable up to its parent. The only tools a child has to communicate upwards are:
-- Callbacks: parent passes a function down, child calls it (including passing in required values as parameters)
-- Lifted State: parent owns the state (a type of variable that automatically gets a setter method)
                and passes both the value and the setter method down.
-- Shared External Store: 
              -- Redux/ReduxTK (Redux Toolkit) (Located in my "stores" folder" aka the "slices" files.),
              -- Context (what I used before Redux, a JavaScript file with variables saved inside.),
              -- etc.
For parents, the only tools they have to communicate downwards are:
-- Props: Passing values, objects or functions down to a child.
-- Shared External Store: Redux, Context (see above section for details)

RTK Query:
— no store import needed, which breaks the circular import.
RTK Query
-- replaces multiple levels of:
----- thunk
----- slice reducer (stores result in Redux)
----- component reads from Redux state
Now, RTK Query does this instead
-- endpoint definition in apiSlice
----- auto-generated hook
------ component used the hook directly
"RTK Query"s patten "Fetch data, cache it, display it"
-- Examples for slices that should not use "RTK Query"
---- Notificaitons
--- Pure Browser Storage
How to decide whether to write something into a new/separate service or integrate it into "RTK Query"
-- Does it make an HTTP request to your backend.
----> If Yes -> Maybe apiSlice. If No -> Keep it separate
-- Is the response data displayed in thE UI
----> If Yes -> Lean towards apiSlice. If No -> Keep it separate
Do you want the UI to auto-update when this data changes.
----> If Yes -> Strong signal for apiSlice. If No-> Keep it separate

RTK Query: .Mutation VS .Query:
-- .Mutation: for POST, PATCH, and DELETE HTTP requests, data is NOT cached/stored
-- .Query: for GET, data is cached/stored

RTK Query and Data: Fresh VS Stale:
-- RTK Query only fetches data when
---- a component that needs it loads
---- if I manually call it
---- if I mark certain data as "live" data
-- Once all components that need a specific data value are closed,
   the data is kept for 60 seconds (can be changed, it is the keepUnusedDataFor variable)
   in case a user opens another/same component that needs that data
   then, it is deleted.
   After it is deleted, if a person opens a component that needs that data again,
   then RTK Query will fetch it from the backend.

--
Beforehand, I was manually caching MediaTypes on the frontend to have a lookup table for each of their ids, names and icons (stored as emoji strings). Now that I am using RTK Query,
the caching logic is already built into RTK Query.
So the MediaTypes lookup information is stored in this. (This code line shows how a component.tsx file can manually get access to that cache (that, thanks to RTK Query, automatically refreshes like all other fresh/stale data that RTK Query keeps track of.))
        const { data: mediaTypes = [], isLoading } = useGetAllApprovedMediaTypesQuery(undefined, { skip: !token });
Technically, the data is stored in "state.api.queries['getAllApprovedMediaTypes(undefined)'] " but you always should use that line of code above to get access.
The old "ASync thunk" system in Redux handled each thing with "idle'|'loading'|'succeeded'|'failed' and I had to write specific methods to handle each case (or that handling for each specific state would be ignored.) RTK Query handles that for me for every endpoint.


RTK Query automatically generates the hook object for each endpoint I list in apiSlice.ts

getMediaItemDetail ----> useGetMediaItemDetailQuery
How does it choose:
use + endpointName (make endpoint name's first letter uppercased) + Query or Mutation. 

Lazy Endpoints
-- RTK also generates 2 hook varies for each .query endpoint:
----- useGetMediaItemDetailQuery: the endpoints I was talking about earlier. Fires automatically when the component mounts
----- useLazyGetMediaItemDetail Query: gives you a [trigger, result] pair - This method only fires when you manually call trigger().
-------- You only use "Lazy" when the fetch should be triggered by a usre action, not by a component mounting. For example, my search bar that auto-searches every time the user types in another letter in the search bar.
-- Note: All mutations are considered lazy (because they are always only called when you manually call them. Note: Mutations still do NOT have "Lazy" in their automatically generated name)

providesTags VS invalidatesTags:

providesTags:
-- Queries (aka GET) only
-- labels the ached result with tags
-- RTK internals reads it when a Mutation fires.
-- Analogy: "I am responsible for data labeled X"

invalidatesTag:
-- Mutations (POST, PATCH,, DELETE) only
-- after mutation succeed, find all cached items iwth matching tags and refetches them
-- RTK internals reads those immediately after a succcesful HTTPRequest
-- After I run, please refresh everything labeled X.

Neiither:
-- Requests can have neither of those.
-- Objects that do not need to be cached
-- For example: the contents of a search bar








############### Generated from Vite ###################

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


