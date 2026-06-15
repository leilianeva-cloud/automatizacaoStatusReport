import { supabase } from '../lib/supabase'

const api = {
 async getProjects(){
  const {data,error}=await supabase.from('report_projects').select('*')
  if(error) throw error
  return data
 },
 async getUsers(){
  const {data,error}=await supabase.from('profiles').select('*')
  if(error) throw error
  return data
 }
}

export default api
