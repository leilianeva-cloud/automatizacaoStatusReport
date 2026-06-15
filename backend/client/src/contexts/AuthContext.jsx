import React, {createContext, useContext, useEffect, useState} from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({children}) {
 const [user,setUser]=useState(null)
 const [loading,setLoading]=useState(true)

 useEffect(()=>{
  supabase.auth.getSession().then(({data})=>{
   setUser(data.session?.user ?? null)
   setLoading(false)
  })
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{
   setUser(session?.user ?? null)
  })
  return ()=>subscription.unsubscribe()
 },[])

 const login=(email,password)=>supabase.auth.signInWithPassword({email,password})
 const logout=()=>supabase.auth.signOut()
 const register=(name,email,password)=>supabase.auth.signUp({email,password,options:{data:{name}}})

 return <AuthContext.Provider value={{user,loading,login,logout,register}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext)
