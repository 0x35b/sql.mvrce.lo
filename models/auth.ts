import "server-only";

import { createServerActionProcedure } from "zsa";
import { UnauthorizedException } from "@/infra/errors";
import { auth } from "@/auth";
import { Session } from "@/global";

export const cookiesAuthKey = "AUTH";

export const sessionMock: Session = {
   user: {
      id: 1,
      name: "John doe",
      email: "https.braganca@gmail.com",
      image: "https://example.com/image.jpg",
   },
};

export async function authenticate(): Promise<Session | null> {
   if (process.env.NODE_ENV === "development") return sessionMock;
   const session: Session = (await auth()) as Session;
   if (!session?.user) return null;

   return session as { user: NonNullable<(typeof session)["user"]> };
}

export const authedProcedure = createServerActionProcedure()
   .handler(async () => {
      const session = await authenticate();
      if (!session) throw new UnauthorizedException();
      return session;
   })
   .createServerAction();

const Authentication = { authedProcedure };
export default Authentication;
