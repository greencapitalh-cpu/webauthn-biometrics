import fetch from "node-fetch";

/**
 * Middleware de autenticación centralizado.
 * Permite acceso solo a usuarios logueados en UDoChain App.
 * Valida el token JWT contra la API principal (api.udochain.com).
 */
export const requireAuth = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1] ||
      req.query.token ||
      req.cookies?.token;

    if (!token) {
      console.warn("⚠️ No token provided, redirecting to App login");
      return res.redirect("https://app.udochain.com");
    }

    const authUrl =
      process.env.AUTH_API_URL || "https://api.udochain.com/api/auth/me";

    const response = await fetch(authUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.warn("⚠️ Invalid token, redirecting to App login");
      return res.redirect("https://app.udochain.com");
    }

    const user = await response.json();
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error("❌ Error en requireAuth:", err.message);
    return res.redirect("https://app.udochain.com");
  }
};
