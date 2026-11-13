import axiosInstance from './axiosInstance';

// GET /users?page&limit&search&role -> { data: [...], meta: { total, page, limit, totalPages } }
export const getUsersApi = (params) => axiosInstance.get('/users', { params });
// PATCH /users/:id/role  { role }
export const updateUserRoleApi = (id, role) => axiosInstance.patch(`/users/${id}/role`, { role });
// PATCH /users/:id/status  { isActive }
export const updateUserStatusApi = (id, isActive) => axiosInstance.patch(`/users/${id}/status`, { isActive });