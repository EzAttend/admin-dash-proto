import type { Request , Response, NextFunction} from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@/utils/auth";

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void>{
    // Skip auth for CORS preflight requests
    if (req.method === "OPTIONS") {
        next();
        return;
    }

    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if(!session){
        res.status(401).json({
            status: "error",
            message: "Unauthorized - pleae sign in"
        });
        return;
    }

    (req as any).user = session.user;
    (req as any).session = session.session;
    next();
}