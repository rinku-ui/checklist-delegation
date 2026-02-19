

// import supabase from "../../SupabaseClient";

// export const LoginCredentialsApi = async (formData) => {
//   const { data, error } = await supabase
//     .from('users')
//     .select('*')
//     .eq('user_name', formData.username)
//     .eq('password', formData.password)
//      .eq('status', 'active')
//     .single(); // get a single user

//   if (error || !data) {
//     return { error: 'Invalid username or password' };
//   }

//   return { data };
// };


import supabase from "../../SupabaseClient";

export const LoginCredentialsApi = async (formData) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_name', formData.username)
    .eq('password', formData.password)
    .single(); // remove .eq('status', 'active')

  // Handle error or no data
  if (error || !data) {
    return { error: 'Invalid username or password' };
  }

  // 🔴 Change: Allow login for 'on_leave' users too. Only reject if status is specifically 'inactive'
  if (data.status === 'inactive') {
    // Clear localStorage and reject login
    localStorage.clear();
    return { error: 'Your account is inactive. Please contact admin.' };
  }

  // Store user access in localStorage
  if (data.user_access) {
    localStorage.setItem("user_access", data.user_access);
  }

  return { data };
};