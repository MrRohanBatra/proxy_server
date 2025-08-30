import express from "express";
import { WebPortal } from "jsjiit";
import crypto from "crypto";

// ✅ Minimal shim for browser APIs (needed because jsjiit is browser-oriented)
if (typeof global.window === "undefined") global.window = {};
if (!global.window.crypto) {
    global.window.crypto = {
        subtle: crypto.webcrypto.subtle,
        getRandomValues: (arr) => crypto.webcrypto.getRandomValues(arr),
    };
}

const app = express();
app.use(express.json());

app.post("/", async (req, res) => {
    try {
        const { name, pass } = req.body;

        if (!name || !pass) {
            return res.status(400).json({ error: "Missing name or password" });
        }

        const portal = new WebPortal();

        // login
        await portal.student_login(name, pass);

        // fetch attendance
        const meta = await portal.get_attendance_meta();
        console.log("meta:", meta);

        const attendance = await portal.get_attendance(
            meta.headers[0],
            meta.semesters[0]
        );

        res.json({
            message: "ok",
            user: name,
            attendance,
        });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log("✅ Server running at http://localhost:3000");
});
