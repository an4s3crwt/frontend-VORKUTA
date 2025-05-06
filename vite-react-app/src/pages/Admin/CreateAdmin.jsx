import React, { useState } from "react";
import api from "./../../api";

const CreateAdmin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Realizar la solicitud POST a Laravel usando axios con el token de Firebase
            const response = await api.post("/create-first-admin", {
                email,
                password,
            });

            setSuccess(true);
            setError(null);
            console.log("Admin creado:", response.data);
        } catch (error) {
            setError(error.response?.data?.error || "Hubo un error al crear el administrador");
            setSuccess(false);
        }
    };

    return (
        <div>
            <h1>Crear Primer Admin</h1>
            {success && <p>¡Administrador creado exitosamente!</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Crear Admin</button>
            </form>
        </div>
    );
};

export default CreateAdmin;
