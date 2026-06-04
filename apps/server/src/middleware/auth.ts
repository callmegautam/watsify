import type { Request, Response, NextFunction } from "express";
import { auth } from "@watsify/auth";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    (req as any).userId = session.user.id;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
