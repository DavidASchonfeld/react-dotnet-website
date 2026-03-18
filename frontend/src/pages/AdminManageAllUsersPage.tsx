// React Libraries
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

// My Code
import type { RootState } from '../store/store';
import { getAllUsers, updateUserRole } from '../services/usersService';
import type { UserSummary } from '../services/usersService';
import type { UserRole } from '../types/userRole';



export default function AdminManageAllUsersPage() {

    const { token, userName } = useSelector((state: RootState) => state.auth);

    

    // Adding variables exclusively-to-this component:
    const [userList, setUserList] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // This state object will keep track of each user's RoleLevel individually,
    // so I can easily change one in a dropdown menu and then click Save to send
    // that change to the backend
    const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});


    useEffect(() => {

        // Return nothing if there is no token.
        // The backend needs a token to give back this a list of users
        if (!token) return;


        // I am defining this async function here
        // and calling it immediately, right below this function definition.
        // Why? Because this function is asynchronous and useEffect cannot be asynchronous.
        async function fetchUsers() {
            setLoading(true);
            try {
                const data = await getAllUsers(token!);
                setUserList(data);

                // Build initial selectedRoles from the fetched data
                const initial: Record<string, string> = {};

                data.forEach(user => {initial[user.id] = user.roleLevel});

                setSelectedRoles(initial);

            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();

    }, [token]);


    // TODO LIST:
    // useEffect: call getAllUsers(token) and store result in useState<UserSummary[]

    // Render the table

    // I need to fetch all possible UserRoleLevel and the row user's roleLevel

    // Save calls the updateUserRole please

    // curent user's Row (matches the username...Does .NET/C#'s built-in user management recquire usernames to be unique?

    // Show a loading state when fetching and an error message if fetch fails.


    return (
            <div>

            

                {loading && <h2>Loading...</h2>}
                {error && <h2>{error}</h2>}
    
                <h1>Admin: Manage All Users</h1>
                {/* Refresh Button - Calls Refresh on Click: */}
                {/* Remember, you need "() =>"" so the function
                only runs when the button is clicked, instead
                of when the button is rendered. */}
                <button onClick={ () => { getAllUsers(token!).then(setUserList)} }>Refresh</button>

                {!loading && !error && (
                    <table>
                        <tbody>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Change Role</th>
                            <th>Save</th>
                        </tr>
                        {userList.map(eachUser => {
                            const isCurrentUser = eachUser.userName === userName;
                            return (
                                <tr key={eachUser.id} className={isCurrentUser ? 'opacity-50': ''}>
                                    <td>{eachUser.userName}</td>
                                    <td>{eachUser.email}</td>
                                    <td>
                                        <select
                                            name = "UserRole"
                                            id = {`${eachUser.id}_userRole`}
                                            disabled = {isCurrentUser}
                                            className={isCurrentUser ? 'cursor-not-allowed':''}

                                            // Initially, set the dropdown to the user's current RoleLevel.
                                            value = {selectedRoles[eachUser.id] ?? eachUser.roleLevel}
                                            
                                            onChange = {(e) => setSelectedRoles({
                                                ...selectedRoles,  // Keep the same values from before,
                                                // except for this row's user.
                                                [eachUser.id] : e.target.value
                                            })}
                                        >
                                            <option>Basic</option>
                                            <option>Moderator</option>
                                            <option>Administrator</option>
                                        </select>
                                    </td>
                                    <td>
                                        {/* token! here means token is guaranteed.
                                        If there was no token, this page's error would run instead
                                        so the programming logic would never reach this line of code.*/}
                                        <button
                                            disabled = {isCurrentUser}
                                            className = {isCurrentUser ? 'cursor-not-allowed opacity-50': ''}
                                            onClick={() => updateUserRole(token!, eachUser.id, selectedRoles[eachUser.id] as UserRole)}
                                        >
                                            Save
                                        </button>
                                    </td>
                                    
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
                
                
                 
            </div>
        );

}