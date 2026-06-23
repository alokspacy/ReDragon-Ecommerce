import AdminLayout from "@/components/admin/AdminLayout";

export const metadata = {
    title: "ReDragon - Admin Panel",
    description: "ReDragon - Admin Panel",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
        </>
    );
}
