import AuthService from "../services/AuthService";

class AuthController {
  async loginWithGoogle(req: any, res: any) {
    try {
      const authResponse = await AuthService.loginWithGoogle({
        ...req.body,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        token: authResponse.token,
        user: authResponse.user,
      });
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: "Error logging in" });
    }
  }
  
  async sendMagicLink(req: any, res: any) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email é obrigatório",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Email inválido",
        });
      }

      await AuthService.sendMagicLink(email.toLowerCase().trim());

      res.status(200).json({
        message: "Link de acesso enviado para seu email",
        success: true,
      });
    } catch (error) {
      console.error("Erro ao enviar magic link:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  async verifyMagicLink(req: any, res: any) {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/error?error=Token inválido`
        );
      }

      try {
        await AuthService.validateMagicLink(token);

        const redirectUrl = `${process.env.FRONTEND_URL}/auth/magic-link-callback?token=${token}`;
        res.redirect(redirectUrl);
      } catch (error) {
        let errorMessage = "Erro desconhecido";
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        res.redirect(
          `${process.env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(
            errorMessage
          )}`
        );
      }
    } catch (error) {
      console.error("Erro ao verificar magic link:", error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=Erro interno`);
    }
  }

  async verifyToken(req: any, res: any) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token é obrigatório",
        });
      }

      const result = await AuthService.verifyMagicLink(token);

      res.status(200).json({
        success: true,
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      console.error("Erro ao verificar token:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Token inválido",
      });
    }
  }
}

export default new AuthController();