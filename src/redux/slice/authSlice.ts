import { createSlice } from '@reduxjs/toolkit'

type initialType={
    users:{
      id:number,
        userName:string,
        email:string,
    }[],
    currentUser:{
      id:number,
        userName:string,
        email:string,
    }|null
}

const initialState:initialType = {
    users: [],
    currentUser: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState: initialState,
  reducers: {
    handleRegister(state,action){
        state.users.push(
        action.payload
        )
    },
    handleCurrentUser (state,action){
        state.currentUser = action.payload

    },
    handleLogout (state){
      state.currentUser=null
    }

    },
    
  },
)

export const { handleRegister,handleCurrentUser,handleLogout }  = authSlice.actions
export default authSlice.reducer