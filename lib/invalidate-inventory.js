import "server-only";
import { revalidatePath, updateTag } from "next/cache";
export function invalidateInventory() {
    updateTag("car-filters");
    for (const path of ["/", "/cars", "/saved-cars", "/admin", "/admin/cars"]) revalidatePath(path);
    revalidatePath("/cars/[id]", "page");
    revalidatePath("/test-drive/[id]", "page");
}
