// safeToast: wraps Sonner so any runtime failure falls back silently to Redux.
// All call-sites import from here — never from 'sonner' directly.
import { toast } from 'sonner';
import { store } from '../store/store';
import { addToast, type ToastType } from '../store/toastSlice';

function show(type: ToastType, message: string) {
    try {

        // Try the 3rd-Party Toast Library
        // Explanation for this method
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
        // I will rewrite the below line to make it simpler to understand:
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
        // (Adding this object to toastSlice
        // will trigger FallbackToaster to render
        // the home-made version of the toast object)
        store.dispatch(addToast({ type, message }));

        // Since <FallbackToaster /> is connected to toastSlice
        // and you are adding a value to toastSlice
        // <FallbackToaster /> will display that error/success notification.
    }
}

export const safeToast = {
    success: (message: string) => show('success', message),
    error:   (message: string) => show('error',   message),
    info:    (message: string) => show('info',     message),
    warning: (message: string) => show('warning',  message),
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

