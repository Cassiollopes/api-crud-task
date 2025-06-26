import { User } from "@prisma/client";
import prisma from "../db/prismaClient";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
const jwtSecret = process.env.JWT_SECRET!;

type GoogleAuthRequestDto = Omit<User, "id">;

interface AuthResponseDto {
  token: string;
  user: User;
}

interface ValidateMagicLinkResponseDto {
  valid: boolean;
  user: User;
}

class AuthService {
  async loginWithGoogle(data: GoogleAuthRequestDto): Promise<AuthResponseDto> {
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.name,
          avatarUrl: data.avatarUrl,
        },
      });
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: "7d",
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async sendMagicLink(email: string): Promise<void> {
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
        },
      });
    }

    const magicToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.magicLink.create({
      data: {
        userId: user.id,
        token: magicToken,
        expiresAt,
        used: false,
      },
    });

    const magicUrl = `${process.env.BACKEND_URL}/auth/verify?token=${magicToken}`;
    await this.sendMagicLinkEmail(email, magicUrl);
  }

  async validateMagicLink(
    token: string
  ): Promise<ValidateMagicLinkResponseDto> {
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      throw new Error("Link inválido");
    }

    if (magicLink.used) {
      throw new Error("Link já foi utilizado");
    }

    if (magicLink.expiresAt < new Date()) {
      throw new Error("Link expirou. Solicite um novo");
    }

    return {
      valid: true,
      user: {
        id: magicLink.user.id,
        email: magicLink.user.email,
        name: magicLink.user.name,
        avatarUrl: magicLink.user.avatarUrl,
      },
    };
  }

  async verifyMagicLink(token: string): Promise<AuthResponseDto> {
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      throw new Error("Link inválido");
    }

    if (magicLink.used) {
      throw new Error("Link já foi utilizado");
    }

    if (magicLink.expiresAt < new Date()) {
      throw new Error("Link expirou. Solicite um novo");
    }

    // ✅ AGORA marca como usado
    await prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { used: true },
    });

    const jwtToken = jwt.sign({ userId: magicLink.user.id }, jwtSecret, {
      expiresIn: "7d",
    });

    return {
      token: jwtToken,
      user: {
        id: magicLink.user.id,
        email: magicLink.user.email,
        name: magicLink.user.name,
        avatarUrl: magicLink.user.avatarUrl,
      },
    };
  }

  private async sendMagicLinkEmail(
    email: string,
    magicUrl: string
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
        <body style="margin:0; padding:0; background-color:#f9fafb; width:100%; height:100%;">
          <table width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;">
            <tr>
              <td align="center" valign="middle" style="padding-top:40px; padding-bottom:40px;">
                <table cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:24px; padding:32px 64px; max-width:600px; width:100%; text-align:center;">
                  <tr>
                    <td style="font-size:32px; font-weight:500; padding:16px 0;">Crud Task</td>
                  </tr>
                  <tr>
                    <td style="font-size:24px; font-weight:700; padding:8px 0;">Vamos realizar seu login</td>
                  </tr>
                  <tr>
                    <td style="font-size:16px; padding:8px 0;">Entre usando o link abaixo</td>
                  </tr>
                  <tr>
                    <td style="padding:16px 0;">
                      <a href="${magicUrl}"
                        style="display:inline-block; width:100%; max-width:400px; padding:12px; background-color:#3b82f6; color:#ffffff; text-decoration:none; font-weight:600; border-radius:8px;">
                        Clique aqui
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:12px; color:#9ca3af; padding-top:16px;">
                      Se você não solicitou este acesso, ignore este email.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: "Link para acessar Crud Task",
      html: emailTemplate,
    });
  }
}

export default new AuthService();
