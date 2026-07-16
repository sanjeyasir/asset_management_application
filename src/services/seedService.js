import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export const seedDatabase = async () => {
    try {
        console.log("Starting DB seeding check...");

        // 1. Seed Departments
        const deptSnap = await getDocs(collection(db, "departments"));
        if (deptSnap.empty) {
            console.log("Seeding departments...");
            const defaultDepts = [
                { id: "dept-1", code: "IT", name: "Information Technology", description: "IT Department", active: true, createdAt: new Date().toISOString() },
                { id: "dept-2", code: "HR", name: "Human Resources", description: "HR Department", active: true, createdAt: new Date().toISOString() },
                { id: "dept-3", code: "FIN", name: "Finance", description: "Finance Department", active: true, createdAt: new Date().toISOString() }
            ];
            for (const d of defaultDepts) {
                await setDoc(doc(db, "departments", d.id), {
                    code: d.code,
                    name: d.name,
                    description: d.description,
                    active: d.active,
                    createdAt: d.createdAt
                });
            }
        }

        // 2. Seed Designations
        const desSnap = await getDocs(collection(db, "designations"));
        if (desSnap.empty) {
            console.log("Seeding designations...");
            const defaultDesignations = [
                { id: "des-1", code: "SE", name: "Software Engineer", description: "Developer", active: true, createdAt: new Date().toISOString() },
                { id: "des-2", code: "HRM", name: "HR Manager", description: "HR Head", active: true, createdAt: new Date().toISOString() },
                { id: "des-3", code: "FA", name: "Financial Analyst", description: "Finance staff", active: true, createdAt: new Date().toISOString() }
            ];
            for (const d of defaultDesignations) {
                await setDoc(doc(db, "designations", d.id), {
                    code: d.code,
                    name: d.name,
                    description: d.description,
                    active: d.active,
                    createdAt: d.createdAt
                });
            }
        }

        // 3. Seed Locations
        const locSnap = await getDocs(collection(db, "locations"));
        if (locSnap.empty) {
            console.log("Seeding locations...");
            const defaultLocations = [
                { id: "loc-1", name: "Headquarters", active: true, createdAt: new Date().toISOString() },
                { id: "loc-2", name: "Branch Office", active: true, createdAt: new Date().toISOString() }
            ];
            for (const l of defaultLocations) {
                await setDoc(doc(db, "locations", l.id), {
                    name: l.name,
                    active: l.active,
                    createdAt: l.createdAt
                });
            }
        }

        // 4. Seed Asset Categories
        const catSnap = await getDocs(collection(db, "assetCategories"));
        if (catSnap.empty) {
            console.log("Seeding asset categories...");
            const defaultCategories = [
                { id: "cat-1", name: "Laptops", code: "LAP", parentCategory: "", description: "Notebook computers", active: true, createdAt: new Date().toISOString() },
                { id: "cat-2", name: "Monitors", code: "MON", parentCategory: "", description: "Computer screens", active: true, createdAt: new Date().toISOString() },
                { id: "cat-3", name: "Printers", code: "PRN", parentCategory: "", description: "Office printers", active: true, createdAt: new Date().toISOString() }
            ];
            for (const c of defaultCategories) {
                await setDoc(doc(db, "assetCategories", c.id), {
                    name: c.name,
                    code: c.code,
                    parentCategory: c.parentCategory,
                    description: c.description,
                    active: c.active,
                    createdAt: c.createdAt
                });
            }
        }

        console.log("DB seeding check completed successfully!");
    } catch (error) {
        console.warn("DB Seeding failed (this may be due to Firestore permissions before login):", error.message);
    }
};

export default seedDatabase;
