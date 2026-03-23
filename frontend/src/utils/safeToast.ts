// safeToast: wraps Sonner so any runtime failure falls back silently to toastEvents.
// All call-sites import from here — never from 'sonner' directly.
import { toast } from 'sonner';
import { toastEvents, type ToastType } from './toastEvents';

function show(type: ToastType, message: string) {
    
    //// Regarding Falsy Strings (Matching Sonner's Built-in Behavior)
    // Match Sonner's behavior: silently skip empty/falsy messages.
    //
    // "Falsy": JavaScript for any value that evaluates to false inside an if-check
    // Falsy Values:
    // -- false
    // -- 0
    // -- '' (empty string)
    // -- null
    // --undefined
    // --NaN (Not a Number)
    //
    // To clarify, a non-empty string (Ex: 'hello') is truthy (because it evaluates to true inside in if-check)

    // So since if(message) asks; Is this message truthy (including asking, is this message a non-empty string)?
    // then if(!message) asks: Is this message falsy (including asking, is this message an empty string)
    // then, (I am hardcoding this to match sonner's built-in behavior on handling falsy strings)
    //  return early and do NOT show a toast notifcation for this empty string
    if (!message) return;

    try {



        // Before starting a toast notification,
        // just console.log the error, but only when running the website in developer mode
        if (import.meta.env.DEV) {
            console.debug(`[safeToast] ${type}:`, message);
        }



        // What does this method do?
        // First, it tries the 3rd-Party Toast Library (called Sonner)
        // use "key" called "type"
        // to search 3rd-party object (called "toast")
        // (which is acting like a dictionary)

        // This is NOT a cast
        //    as (message: string) => void
        // It is a compile-time-only assertion —
        // it does not perform any runtime check.
        // If toast[type] is not a callable function,
        // JavaScript itself will throw a TypeError
        // when the call is attempted, which the catch block handles.

        // What does ()() mean here?
        // it means: inside the first is a function,
        // and the 2nd parentheses is the parameters to be passed in
        // and the function must be called immediately.
        // Example: (onFunction(inString){  print("inString");  })("Here we go!")
        //
        // I will rewrite the below code line here in English to make it simpler to understand:
        // -- toast[type] <- getting the object value from the "toast" dictionary/hashmap
        // -- assert that "toast[type]" is a function that has 1 string input and returns void (aka returns nothing)
        // -- then, call that "toast[type]" and pass in "message" as the parameter.
        //
        // Since this is in a try/catch box, then it will throw an error
        // if it cannot reach the functions stored in the toast hashmap
        // Catching the error will cause the same alert info to be passed into the home-made Toaster.
        (toast[type] as (message: string) => void)(message);

        // The actual component showing the toast
        // is called <Toaster />
        // and is inside App.tsx
        // The code line above will cause <Toaster /> to display the toast-message for that specific input

    } catch {

        // Use basic home-made version instead
        // (Emitting this event to toastEvents
        // will trigger FallbackToaster to render
        // the home-made version of the toast object)
        // The actual compnent showing the fallback toast
        // is called <FallbackToast/>
        // and is inside App.tsx.
        console.warn('[safeToast] Sonner unavailable, falling back to toastEvents');
        toastEvents.emit({ kind: 'add', id: Date.now().toString(), type, message });

        // Since <FallbackToaster /> is subscribed to toastEvents
        // and you are emitting an 'add' event
        // <FallbackToaster /> will display that error/success notification.
    }
}

export const safeToast = {
    success: (message: string) => show('success', message),
    error:   (message: string) => show('error',   message),
    info:    (message: string) => show('info',     message),
    warning: (message: string) => show('warning',  message),
    promise: <T>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }) => {
        //
        // Explanation of the "Promise" option:
        //
        // Example of Using 1 of the Other (Non-Promise) Options:
        //    (Example from AdminAllMediaItemsPage.tsx):
        //
        //   async function handleEditClick(mediaItemId: number){
        //         try {
        //             const mediaItemDetailObject = await dispatch(fetchMediaItemDetail({token: token!, mediaItemId: mediaItemId})).unwrap();
        //             setMediaItemToEdit(mediaItemDetailObject);
        //         } catch (err) {
        //             console.error(err);
        //             safeToast.error('Failed to load item details');
        //         }
        //     }
        //
        // Example of Using the Promise Options:
        //    (Example from AdminAllMediaItemsPage.tsx):
        //
        // async function handleCreate(name: string, description: string, mediaTypeId: number, publishedDateTime: string){
        //     try {
        //         await safeToast.promise(
        //             dispatch(createMediaItemTHUNK({
        //                 token: token!,
        //                 data: {name,
        //                     description,
        //                     mediaTypeId,
        //                     publishedDateTime: publishedDateTime || null
        //                 }
        //             })).unwrap(),  // Unwrap lets me catch the error here into this try block
        //             { loading: 'Creating...', success: 'Media item created', error: 'Failed to create media item' }
        //         );
        //         setShowCreateModal(false);
        //     } catch (err) {
        //         console.error(err);
        //         // Error toast already shown by safeToast.promise above
        //     }
        // }
        //
        // As you saw in the non-promise option, the async functions
        // (for example, the dispatch function) gives back a
        // result (wrapped in a Promise, because that's how TypeScript handles asynchronous functions)
        // Remember: Being Wrapped in a Promise means that that line of code needs to stall
        // and wait until it receives the value from the async function.
        // So, passing in a Promise into safeToast is just passing in an async function call,
        // and then safeToast looks at the returned value (aka wrapped in a Promise),
        // decides on which toast type to show (success, failure etc.)
        // before returning the entire returned value (still wrapped in the Promise object)
        // to the caller.
        // Yes, what I just described applies to Sonner's toast system AND my home-made toast system (toastEvents/FallbackToast)
        //
        // I want to note: safeToast only checks if the Promise is a success/failure/etc. to show to correct toast notification
        // and then returns. I want to note that it still returns the Promise, including the error attached.

        try {

            // Before starting a toast notification,
             // just console.log the error, but only when running the website in developer mode
            if (import.meta.env.DEV) {
                console.debug('[safeToast] promise:', msgs);
            }


            // Delegate to Sonner's built-in promise handler.
            // toast.promise() watches the promise internally via .then()/.catch()
            // and auto-transitions the toast: loading → success (on resolve) or error (on reject).
            // The caller does NOT need try/catch just for toast display — Sonner handles it.

            toast.promise(promise, msgs);

        } catch {

            // If Sonner is unavailable, fall back to toastEvents manually.
            // Show a loading toast immediately, then replace it with success/error when the promise settles.
            console.warn('[safeToast] Sonner toast.promise unavailable, falling back to toastEvents');

            // Use a fixed id so we can remove this exact loading toast when the promise settles.
            const loadingId = `loading-${Date.now()}`;
            toastEvents.emit({ kind: 'add', id: loadingId, type: 'loading', message: msgs.loading });

            promise.then(
                () => {
                    // Promise succeeded: always remove the loading toast (even if success is suppressed),
                    // then only show a success toast if msgs.success is non-empty.

                    toastEvents.emit({ kind: 'remove', id: loadingId });

                    // Mirroring Sonner's built-in way of handling falsy messages,
                    // so only show the toast notifcation is the message is truthy.
                    if (msgs.success) {


                        toastEvents.emit({ kind: 'add', id: Date.now().toString(), type: 'success', message: msgs.success });
                    }
                },
                () => {
                    // Promise failed: same pattern — always remove the loading toast,
                    // then only show an error toast if msgs.error is non-empty.
                    //
                    // apiSlice.ts passes error: '' intentionally on all mutations,
                    // because baseQueryWithErrorHandling already shows the right error toast.
                    // Without this guard, the fallback would emit a blank error toast on top of that.
                    toastEvents.emit({ kind: 'remove', id: loadingId });

                    // Just like above, where msg.success is the message for a successful Promise,
                    // this is the message for a returned error
                    // And just like above, I am mirroring Sonner's built-in ignoring of falsy messages, which is the if-statement in the line below
                    if (msgs.error) {
                        toastEvents.emit({ kind: 'add', id: Date.now().toString(), type: 'error', message: msgs.error });
                    }
                }
            );

        }

        // Return the original promise unchanged.
        // This lets callers optionally await it for post-success/post-failure state cleanup.
        // Note: if the original promise rejects, awaiting this return value WILL throw —
        // so callers still need try/catch if they have state cleanup to do on failure.
        return promise;
    },
};


// Explanation of safeToast.ts:

// "export const safeToast" is a TypeScript Object (similar to a HashMap or Dictionary),
// that gives you (the programmer) the ability to call safeToast.ts 's logic like this:
// -- safeToast.success("MessageForToastToShow")
//
// Technically, I can also create a function like this in safeToast.ts and get a similar result:
//    export function safeToast(inToastType:ToastType, message: string){
//        show(inToastType,message)
//    }
// And when it is called, it would look like this:
//    safeToast('success', 'Item added'); <-Bad because you have to spell the "ToastType" exactly
// or, even better,
//    import type ToastType from '../store/toastSlice' (technically, ToastType is not a Type, so importing ToastType is more complicated).
//    safeToast(success, 'Item added');  <- Here, I am using the actual ToastType object's possible value success, so better
//
// The advantage of the current safeToast way is to simulate calling each potential Toast type
// as its own unique method. It's as if we are using an extenral library method call.

///////////////

//

