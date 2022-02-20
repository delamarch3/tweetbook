import randomise from "randomatic";
import { pool } from "../db/pool";
import bcrypt from "bcrypt";

export const findUser = async (param: string, value: string) => {
    const user = await pool.query(`SELECT * FROM users WHERE ${param} = $1`, [
        value,
    ]);
    return user;
};

export const checkExistingUser = async (username: string, email: string) => {
    const existingUsername = await findUser("username", username);
    const existingEmail = await findUser("email", email);

    if (existingUsername.rowCount)
        return {
            success: false,
            message: "Username is taken",
        };

    if (existingEmail.rowCount)
        return {
            success: false,
            message: "Email has already registered",
        };

    return { success: true, message: "" };
};

export const createUser = async (
    username: string,
    email: string,
    password: string
) => {
    const id = randomise("0", 4);

    const hashPassword = await bcrypt.hash(password, 10);

    await pool.query(
        "INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4)",
        [id, username, email, hashPassword]
    );

    return { id };
};
