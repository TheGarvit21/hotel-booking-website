export const setAdminCredentials = (username, password) => {
    localStorage.setItem('adminCredentials', JSON.stringify({ username, password }));
};