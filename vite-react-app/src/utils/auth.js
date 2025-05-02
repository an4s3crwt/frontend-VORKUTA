
export const getUser = async (token) => {
    const response = await fetch('/api/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        }
    });
    const data = await response.json();
    return data;
}


export const logout = async (token) => {
    const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        }
    });
    const data = await response.json();
    if (data.message) {
        localStorage.removeItem('jwt_token');
        return data.message; // Puedes mostrar un mensaje de sesión cerrada
    }
}