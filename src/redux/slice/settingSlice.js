// loginSlice.js
// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import { createDepartmentApi, createUserApi, deleteUserByIdApi, fetchDepartmentDataApi, fetchUserDetailsApi, updateDepartmentDataApi, updateUserDataApi } from '../api/settingApi';
// loginSlice.js - Fix the imports
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createDepartmentApi,
  createUserApi,
  deleteUserByIdApi,
  fetchDepartmentDataApi,
  fetchUserDetailsApi,
  updateDepartmentDataApi,
  updateUserDataApi,
  fetchDepartmentsOnlyApi,
  fetchGivenByDataApi,
  fetchCustomDropdownsApi,
  createCustomDropdownApi,
  deleteCustomDropdownApi
} from '../api/settingApi';


export const userDetails = createAsyncThunk(
  'fetch/user',
  async () => {
    const user = await fetchUserDetailsApi();

    return user;
  }
);

export const departmentOnlyDetails = createAsyncThunk(
  'fetch/departments-only',
  async () => {
    const departments = await fetchDepartmentsOnlyApi();
    return departments;
  }
);

export const givenByDetails = createAsyncThunk(
  'fetch/given-by',
  async () => {
    const givenBy = await fetchGivenByDataApi();
    return givenBy;
  }
);

export const departmentDetails = createAsyncThunk(
  'fetch/department',
  async () => {
    const department = await fetchDepartmentDataApi();

    return department;
  }
);

export const createUser = createAsyncThunk(
  'post/users',
  async (newUser) => {
    const user = await createUserApi(newUser);

    return user;
  }
);

export const updateUser = createAsyncThunk('update/users', async ({ id, updatedUser }) => {
  const user = await updateUserDataApi({ id, updatedUser });

  return user;
}
);

export const createDepartment = createAsyncThunk(
  'post/department',
  async (newDept) => {
    const department = await createDepartmentApi(newDept);

    return department;
  }
);

export const updateDepartment = createAsyncThunk('update/department', async ({ id, updatedDept }) => {
  console.log(updatedDept);

  const department = await updateDepartmentDataApi({ id, updatedDept });


  return department;
}
);

export const deleteUser = createAsyncThunk(
  'delete/user',
  async (id) => {
    const deletedId = await deleteUserByIdApi(id);
    return deletedId;
  }
);

export const customDropdownDetails = createAsyncThunk(
  'fetch/custom-dropdowns',
  async () => {
    const dropdowns = await fetchCustomDropdownsApi();
    return dropdowns;
  }
);

export const createCustomDropdown = createAsyncThunk(
  'post/custom-dropdown',
  async (item) => {
    const dropdown = await createCustomDropdownApi(item);
    return dropdown;
  }
);

export const deleteCustomDropdown = createAsyncThunk(
  'delete/custom-dropdown',
  async (id) => {
    const deletedId = await deleteCustomDropdownApi(id);
    return deletedId;
  }
);



const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    userData: [],
    department: [],
    departmentsOnly: [],
    givenBy: [],
    customDropdowns: [],
    error: null,
    loading: false,
    isLoggedIn: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(userDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(userDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = action.payload;

      })
      .addCase(userDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(departmentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(departmentDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.department = action.payload;

      })
      .addCase(departmentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userData.push(action.payload);

      })
      .addCase(departmentOnlyDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(departmentOnlyDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentsOnly = action.payload;
      })
      .addCase(departmentOnlyDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(givenByDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(givenByDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.givenBy = action.payload;
      })
      .addCase(givenByDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = state.userData.map((user) =>
          user.id === action.payload.id ? action.payload : user
        );
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })
      .addCase(createDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.department.push(action.payload);

      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })
      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.department = state.department.map((dept) =>
          dept.id === action.payload.id ? action.payload : dept
        );
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = state.userData.filter((user) => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(customDropdownDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(customDropdownDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.customDropdowns = action.payload;
      })
      .addCase(customDropdownDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCustomDropdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.customDropdowns.push(action.payload);
      })
      .addCase(createCustomDropdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCustomDropdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.customDropdowns = state.customDropdowns.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteCustomDropdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

  },
});

export default settingsSlice.reducer;
