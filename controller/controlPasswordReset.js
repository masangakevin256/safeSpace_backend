//only for users who saved their emails in the system
import { pool } from "../config/connect_database.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateResetToken } from "./controlGeneratePasswordResetToken.js";
import { sendEmail } from "../utils/sendEmail.js";

export const resetPasswordLink = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = generateResetToken(email);
    //update password reset token
    await pool.query(
      "UPDATE users SET password_reset_token = $1 WHERE email = $2",
      [token, email]
    )
    const resetLink = `http://localhost:3000/api/auth/user/password-reset/serve-password-reset-form?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html:
        `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Password - Jali Connect</title>
                <style>
                    * {
                    margin: 0;
                    padding: 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    box-sizing: border-box;
                    }

                    body {
                    background: #f4f6f8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    color: #333;
                    }

                    .container {
                    background: #fff;
                    padding: 40px 30px;
                    max-width: 500px;
                    width: 100%;
                    border-radius: 12px;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                    text-align: center;
                    animation: fadeIn 0.8s ease-in-out;
                    }

                    @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                    }

                    h1 {
                    font-size: 32px;
                    font-weight: 700;
                    color: #3f51b5;
                    margin-bottom: 10px;
                    }

                    h3 {
                    font-size: 22px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    color: #555;
                    }

                    p {
                    font-size: 16px;
                    margin-bottom: 30px;
                    line-height: 1.5;
                    color: #444;
                    }

                    a.button {
                    display: inline-block;
                    padding: 12px 25px;
                    border-radius: 6px;
                    background: #3f51b5;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: background 0.3s ease;
                    }

                    a.button:hover {
                    background: #2c3e9f;
                    }

                    footer {
                    margin-top: 30px;
                    font-size: 13px;
                    color: #777;
                    }
                </style>
                </head>
                <body>
                <div class="container">
                    <section>
                    <h1>Jali Connect</h1>
                    <h3>Reset Your Password</h3>
                    <p>
                        You requested to reset your password. Click the button below to proceed. 
                        This link will expire in 15 minutes for your security.
                    </p>
                    <a href="${resetLink}" class="button">Reset Password</a>
                    </section>
                    <footer>
                    <p>&copy; 2026 Jali Connect. All rights reserved.</p>
                    </footer>
                </div>
                </body>
                </html>
            `
    });
    res.status(200).json({ message: "Password reset link sent to your email" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error?.message });
  }
}

export const servePasswordResetForm = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return sendErrorForm(res, "Expired token or invalid url");
  }
  try {
    //decode the token first
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await pool.query("SELECT * FROM users WHERE email = $1 AND password_reset_token = $2", [decoded.email, token]);

    if (user.rows.length === 0) {
      return sendErrorForm(res, "Expired token or invalid URL");

    }
    //send the form
    res.status(200).send(
      `

 <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password Form</title>
      <style>
        body {
          background: #f4f6f8;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .container {
          background: #fff;
          padding: 30px 25px;
          max-width: 400px;
          width: 100%;
          border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        }
        h1 {
          text-align: center;
          font-size: 26px;
          font-weight: 700;
          color: #3f51b5;
          margin-bottom: 20px;
        }
        .rules {
          background: #f9fafc;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .rules p {
          font-size: 14px;
          color: #555;
          margin-bottom: 8px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
        }
        label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        input {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
        }
        input:focus {
          border-color: #3f51b5;
          outline: none;
        }
        .error p { color: #d32f2f; text-align: center; }
        .message p { color: #388e3c; text-align: center; }
        .reset-password-btn { text-align: center; }
        button {
          padding: 12px 20px;
          border-radius: 6px;
          border: none;
          background: #3f51b5;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        button:hover { background: #2c3e9f; }
      </style>
    </head>
     <body>
       <div class="container">
         <h1>Jali Connect</h1>
         <div class="rules">
           <p>Password must be at least 8 characters long</p>
           <p>Password must contain at least one special character</p>
           <p>Password must contain at least one number</p>
           <p>Password must contain at least one uppercase letter</p>
           <p>Password must contain at least one lowercase letter</p>
         </div>
         <div class="input-group">
           <label for="password">Password:</label>
           <input type="password" id="password">
           <label for="confirmPassword">Confirm Password:</label>
           <input type="password" id="confirmPassword">
           <div style="display: flex; align-items: center; gap: 8px;">
             <input type="checkbox" id="showPassword" onclick="togglePasswordVisibility()">
             <label for="showPassword" style="font-weight: normal; font-size: 14px; cursor: pointer;">Show Password</label>
           </div>
         </div>
         <div class="error"><p id="error-message"></p></div>
         <div class="message"><p id="success-message"></p></div>
         <div class="reset-password-btn">
           <button id="reset-password" onclick="handleSubmit()">Reset Password</button>
         </div>
       </div>
       <script>
         const password = document.getElementById('password');
         const confirmPassword = document.getElementById('confirmPassword');
         const errorMessage = document.getElementById('error-message');
         const successMessage = document.getElementById('success-message');

         function togglePasswordVisibility() {
             const type = document.getElementById("showPassword").checked ? "text" : "password";
             password.type = type;
             confirmPassword.type = type;
         }

         async function handleSubmit(){
           errorMessage.textContent = "";
           successMessage.textContent = "";

           if(password.value.length < 8){
             errorMessage.textContent = "Password must be at least 8 characters long";
             return false;
           }
           if(!/[!@#$%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>\\/?]/.test(password.value)){
             errorMessage.textContent = "Password must contain at least one special character";
             return false;
           }
           if(!/[0-9]/.test(password.value)){
             errorMessage.textContent = "Password must contain at least one number";
             return false;
           }
           if(!/[A-Z]/.test(password.value)){
             errorMessage.textContent = "Password must contain at least one uppercase letter";
             return false;
           }
           if(!/[a-z]/.test(password.value)){
             errorMessage.textContent = "Password must contain at least one lowercase letter";
             return false;
           }
           if(password.value !== confirmPassword.value){
             errorMessage.textContent = "Passwords do not match";
             return false;
           }

             const urlParams = new URLSearchParams(window.location.search);
             const token = urlParams.get("token");

             try {
                 const response = await fetch('/api/auth/password-reset/reset-password', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ token, password: password.value }),
                 });

                 const data = await response.json();

                 if (response.ok) {
                     successMessage.textContent = data.message || "Password reset successful";
                     password.value = "";
                     confirmPassword.value = "";
                     
                     // Redirect to login page after successful password reset
                     setTimeout(() => {
                         // You might want to update this URL if the frontend is hosted separately
                         window.location.href = '/login'; 
                     }, 2000);
                 } else {
                     errorMessage.textContent = data.message || "Something went wrong. Try again.";
                 }
             } catch (error) {
                 console.error("Error submitting form:", error);
                 errorMessage.textContent = "An error occurred. Please try again later.";
             }
         }
       </script>
     </body>
    </html>
                `
    );
  } catch (error) {
    console.log(error);
    //send error form
    sendErrorForm(res, "Expired token or invalid URL");
    res.status(500).json({ message: error?.message });
  }
}
export const resetPassword = async (req, res) => {
  const { password, token } = req.body;

  if (!password || !token) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const tokenResult = await pool.query(
      "SELECT * FROM users WHERE password_reset_token = $1",
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decodedToken);

    if(decodedToken.exp < Date.now() / 1000){
      return res.status(400).json({ message: "Token has expired" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE user_id = $2",
      [hashedPassword, tokenResult.rows[0].user_id]
    );

    await pool.query(
      "UPDATE users SET password_reset_token = NULL WHERE user_id = $1",
      [tokenResult.rows[0].user_id]
    );
    return res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error?.message });
  }
};


function sendErrorForm(res, message) {

  res.status(400).send(
    `
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
                * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                }

                .container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height:30vh;
                text-align: center;
                }

                h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
                color: red;
                }

                p {
                font-size: 1.5rem;
                margin-bottom: 2rem;
                color: red;
                }
            </style>
            </head>
            <body>
            <div class="container">
                <h1>Error</h1>
                <p>${message}</p>
            </div>
            </body>
            </html>
        `
  )

}