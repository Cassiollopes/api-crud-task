import jwt, { JwtPayload } from "jsonwebtoken";
import NodeCache from "node-cache";

const jwtSecret = process.env.JWT_SECRET!;

const tokenCache = new NodeCache({
  stdTTL: 300, 
  checkperiod: 60, 
  maxKeys: 1000, 
});

interface DecodedToken extends JwtPayload {
  userId: string;
}

const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Token não fornecido",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Formato de token inválido",
    });
  }

  try {
    const cachedUserId = tokenCache.get(token);
    if (cachedUserId) {
      req.userId = cachedUserId;
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Token inválido - userId não encontrado",
      });
    }

    tokenCache.set(token, decoded.userId);

    req.userId = decoded.userId;

    next();
  } catch (error) {
    tokenCache.del(token);

    if (process.env.NODE_ENV !== "production") {
      console.error("Erro de autenticação:", error);
    }

    return res.status(401).json({
      success: false,
      message: "Token inválido ou expirado",
    });
  }
};

export default authMiddleware;
