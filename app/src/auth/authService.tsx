import { supabase } from "../lib/supabase"
import type { Session } from "@supabase/supabase-js"


export async function getCurrentSession()
: Promise<Session | null> {

  const { data, error } =
    await supabase.auth.getSession()


  if(error){
    throw error
  }


  return data.session
}


export function subscribeAuthChanges(
  callback: (
    session: Session | null,
    event: string
  ) => void
) {

  const {
    data
  } = supabase.auth.onAuthStateChange(
    (event, session) => {

      callback(
        session,
        event
      )

    }
  )


  return data.subscription
}


export async function signOut(){

  const { error } =
    await supabase.auth.signOut()


  if(error){
    throw error
  }
}