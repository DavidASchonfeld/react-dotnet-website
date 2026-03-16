import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';



// This hook is a thin wrapper over Redux
// it returns a shape with token and userName
// so any file that still uses useAuth() from before I updated
// this to use Redux still works.
// I am also exposing dispatch so callers call fire
// auth actions (For example: clearCredentials, etc.)
export function useAuth(){

    // Get the Auth Slice:
    const auth = useSelector((state: RootState) => state.auth);
    
    // Here, I need <AppDispatch> so TypeScript knows
    // that I can dispatch thunks, not only plain actions.
    // For example: dispatch(loginThunk(...))
    const dispatch = useDispatch<AppDispatch>();

    // Gives access to token, userName, and dispatch (to give the components
    // the ability to dispatch (aka call synchronous methods to call
    // asynchronous API methods to call the backend's API).
    //
    // 

    // "...auth" means unpack every key-value pair from the "auth" section
    //   directly into this object.
    //   Meaning, instead of adding the auth object directly,
    //   just add all of its attributes into this object
    //   From: {auth, dispatch} -> {token, userName, isAuthenticated, dispatch}
    return {...auth, dispatch };









    // OLD Code to Delete:
    // const context = useContext(AuthContext);
    // if (!context) throw new Error('useAuth must be used within AuthProvider');
    // return context;
}
