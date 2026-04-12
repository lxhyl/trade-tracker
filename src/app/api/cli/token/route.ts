import { auth } from "@/lib/auth";
import { generateCliToken } from "@/lib/cli-auth";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = await generateCliToken(session.user.id);
  return Response.json({ token });
}
