import Header from "./header";
import { checkUser } from "@/lib/checkUser";
export default async function UserHeader() {
    const user = await checkUser();
    return <Header isAdmin={user?.role === "ADMIN"} />;
}
